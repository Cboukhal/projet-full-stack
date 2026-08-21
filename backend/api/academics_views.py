from datetime import date, datetime, timezone

from django.db import IntegrityError
from django.db.models import Count, ProtectedError, Q
from django.http import JsonResponse
from django.utils.timezone import is_naive, make_aware, now as timezone_now
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import require_role, require_token_auth
from .http import parse_json_body
from .models import (
    Cours,
    CoursPlanifie,
    Cursus,
    CursusCours,
    DemoUser,
    Filiere,
    InscriptionCours,
    InscriptionPromotion,
    Promotion,
    Salle,
)

# Décorateurs de rôle prêts à l'emploi, empilés après @require_token_auth sur chaque vue.
REFERENTE = require_role(DemoUser.ROLE_REFERENTE)
ELEVE = require_role(DemoUser.ROLE_ELEVE)


# --- Petites aides communes -------------------------------------------------

def _add_months(base_date, months):
    # Ajoute des mois à une date sans dépendance externe (dateutil).
    month_index = base_date.month - 1 + months
    year = base_date.year + month_index // 12
    month = month_index % 12 + 1
    day = min(base_date.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                               31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


def _relative_time(dt):
    # Formate un datetime en texte relatif court ("il y a 3 jours"), comme dans les maquettes.
    delta = datetime.now(timezone.utc) - dt
    seconds = delta.total_seconds()
    if seconds < 3600:
        return "à l'instant"
    if seconds < 86400:
        hours = int(seconds // 3600)
        return f"il y a {hours} h"
    days = int(seconds // 86400)
    if days == 1:
        return "il y a 1 jour"
    return f"il y a {days} jours"


def _promotion_statut(promo):
    # Calculé à la volée à partir des dates plutôt que stocké : jamais désynchronisé.
    today = date.today()
    if not promo.date_debut or today < promo.date_debut:
        return "à venir"
    if promo.date_fin_estimee and today > promo.date_fin_estimee:
        return "terminée"
    return "en cours"


def _cours_planifie_statut(cp):
    # Idem : "planifié" dès que les deux dates sont renseignées, sans champ dédié à maintenir.
    return "planifié" if cp.date_debut and cp.date_fin else "à planifier"


def _parse_date(value):
    # Format YYYY-MM-DD attendu ; une valeur vide reste optionnelle (None).
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def _parse_datetime(value):
    # Rend le datetime "aware" (fuseau) si l'entrée ISO ne précisait pas de fuseau.
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    return make_aware(parsed) if is_naive(parsed) else parsed


def _offre_dates(payload, offre=None):
    """Valide les deux bornes obligatoires d'une offre de cours autonome."""
    date_debut = offre.date_debut if offre else None
    date_fin = offre.date_fin if offre else None

    try:
        if 'dateDebut' in payload:
            date_debut = _parse_datetime(payload.get('dateDebut'))
        if 'dateFin' in payload:
            date_fin = _parse_datetime(payload.get('dateFin'))
    except (TypeError, ValueError):
        return None, None, 'Le format des dates est invalide.'

    if not date_debut or not date_fin:
        return None, None, 'Les dates de début et de fin sont requises.'
    if date_fin <= date_debut:
        return None, None, 'La date de fin doit être postérieure à la date de début.'
    return date_debut, date_fin, None


def _offre_formateur(payload, offre=None):
    """Résout le formateur optionnel et refuse un utilisateur d'un autre rôle."""
    if 'formateurId' not in payload:
        return (offre.formateur if offre else None), None

    formateur_id = payload.get('formateurId')
    if formateur_id in (None, ''):
        return None, None

    formateur = DemoUser.objects.filter(
        id=formateur_id,
        role=DemoUser.ROLE_FORMATEUR,
    ).first()
    if not formateur:
        return None, 'Formateur introuvable.'
    return formateur, None


def _offre_salle(payload, offre=None):
    """Normalise la salle et applique la limite du champ avant l'écriture SQL."""
    salle = payload.get('salle', offre.salle if offre else '')
    if salle is None:
        salle = ''
    if not isinstance(salle, str):
        return None, 'La salle doit être un texte.'

    salle = salle.strip()
    if len(salle) > CoursPlanifie._meta.get_field('salle').max_length:
        return None, 'La salle ne peut pas dépasser 150 caractères.'
    return salle, None


def _positive_int(payload, field, label, current=None):
    """Valide un entier positif requis (numéro d'étage ou de salle)."""
    if field not in payload:
        return current, None

    value = payload.get(field)
    try:
        value = int(value)
    except (TypeError, ValueError):
        return None, f'Le {label} doit être un nombre entier.'
    if value < 0:
        return None, f'Le {label} ne peut pas être négatif.'
    return value, None


def _batiment_letters(payload, current=None):
    """Valide le numéro de bâtiment, désigné par une ou plusieurs lettres (A, B, C...)."""
    if 'numeroBatiment' not in payload:
        return current, None

    value = payload.get('numeroBatiment')
    if not isinstance(value, str) or not value.strip():
        return None, 'Le numéro de bâtiment est requis.'

    value = value.strip().upper()
    if not value.isalpha():
        return None, 'Le numéro de bâtiment doit être composé uniquement de lettres.'
    if len(value) > Salle._meta.get_field('numero_batiment').max_length:
        return None, 'Le numéro de bâtiment ne peut pas dépasser 10 caractères.'
    return value, None


# --- Sérialiseurs ------------------------------------------------------------

def _serialize_salle(s):
    return {
        'id': s.id,
        'numeroBatiment': s.numero_batiment,
        'numeroEtage': s.numero_etage,
        'numeroSalle': s.numero_salle,
    }


def _serialize_filiere(f):
    cursus_qs = f.cursus_set.all()
    # Élèves distincts inscrits à une promotion de n'importe quel cursus de cette filière.
    nb_eleves = InscriptionPromotion.objects.filter(promotion__cursus__filiere=f).values('eleve_id').distinct().count()
    return {
        'id': f.id,
        'nom': f.nom,
        'description': f.description,
        'statut': f.statut,
        'nbCursus': cursus_qs.count(),
        'nbEleves': nb_eleves,
        'cursusRattaches': [c.nom for c in cursus_qs],
    }


def _filiere_linked_students_count(filiere):
    # Un élève n'a pas de clé étrangère directe vers une filière. Il y est lié
    # soit par son inscription à une promotion, soit par une inscription à un
    # cours planifié. distinct() évite de compter deux fois le même élève.
    return DemoUser.objects.filter(role=DemoUser.ROLE_ELEVE).filter(
        Q(inscriptions_promotion__promotion__cursus__filiere=filiere)
        | Q(inscriptions_cours__cours_planifie__promotion__cursus__filiere=filiere)
    ).distinct().count()


def _serialize_cursus(c, detail=False):
    # ordrePedagogique n'est ajouté qu'en vue détaillée (coûteux en liste).
    data = {
        'id': c.id,
        'nom': c.nom,
        'filiereId': c.filiere_id,
        'filiere': c.filiere.nom,
        'description': c.description,
        'dureeMois': c.duree_mois,
        'nbCours': c.cours_ordre.count(),
        'dernModif': _relative_time(c.updated_at),
        'statut': c.statut,
    }
    if detail:
        data['ordrePedagogique'] = [
            {
                'id': cc.id,
                'coursId': cc.cours_id,
                'titre': cc.cours.nom,
                'technologie': cc.cours.technologie,
                'position': cc.position,
            }
            for cc in c.cours_ordre.select_related('cours').all()
        ]
    return data


def _serialize_cours(c, detail=False):
    # cursusAssocies est toujours inclus : la liste l'affiche déjà (colonne "Cursus").
    return {
        'id': c.id,
        'nom': c.nom,
        'slug': c.slug,
        'technologie': c.technologie,
        'duree': c.duree,
        'description': c.description,
        'objectifs': c.objectifs,
        'statut': c.statut,
        'cursusAssocies': [
            {
                'cursusCoursId': cc.id,
                'cursusId': cc.cursus_id,
                'cursus': cc.cursus.nom,
                'position': cc.position,
            }
            for cc in c.cursus_associes.select_related('cursus').all()
        ],
    }


def _serialize_promotion(p, detail=False):
    # Le planning complet n'est joint qu'en vue détaillée, avec le nombre d'inscrits pré-calculé.
    data = {
        'id': p.id,
        'titre': p.nom,
        'cursusId': p.cursus_id,
        'cursusNom': p.cursus.nom,
        'dateDebut': p.date_debut.isoformat() if p.date_debut else None,
        'dateFinEstimee': p.date_fin_estimee.isoformat() if p.date_fin_estimee else None,
        'effectifMax': p.effectif_max,
        'elevesInscrits': p.inscriptions.count(),
        'statut': _promotion_statut(p),
    }
    if detail:
        data['planning'] = [_serialize_cours_planifie(cp) for cp in p.planning.select_related(
            'cours', 'cursus_cours__cours', 'formateur', 'promotion'
        ).annotate(nb_inscrits=Count('inscriptions')).all()]
    return data


def _serialize_cours_planifie(cp):
    # nb_inscrits peut être pré-annoté par la requête appelante pour éviter un COUNT par ligne.
    nb_inscrits = getattr(cp, 'nb_inscrits', None)
    if nb_inscrits is None:
        nb_inscrits = cp.inscriptions.count()

    return {
        'id': cp.id,
        'mode': 'promotion' if cp.promotion_id else 'unite',
        'coursId': cp.cours_id,
        'titre': cp.cours.nom,
        'promotionId': cp.promotion_id,
        'promotionNom': cp.promotion.nom if cp.promotion else None,
        'dateDebut': cp.date_debut.isoformat() if cp.date_debut else '',
        'dateFin': cp.date_fin.isoformat() if cp.date_fin else '',
        'formateurId': cp.formateur_id,
        'formateurNom': cp.formateur.nom if cp.formateur else None,
        'salle': cp.salle,
        'statut': _cours_planifie_statut(cp),
        'nbInscrits': nb_inscrits,
    }


def _serialize_inscription_promotion(i):
    # Le préfixe "promo-" distingue cet id de celui d'une inscription à un cours (voir ci-dessous).
    return {
        'id': f'promo-{i.id}',
        'type': 'Promotion',
        'eleveId': i.eleve_id,
        'eleve': i.eleve.nom,
        'cibleId': i.promotion_id,
        'cible': i.promotion.nom,
        'statut': i.statut,
    }


def _serialize_inscription_cours(i):
    # Le préfixe "cours-" évite toute collision avec les identifiants d'inscriptions à une promotion.
    return {
        'id': f'cours-{i.id}',
        'type': 'Unité',
        'eleveId': i.eleve_id,
        'eleve': i.eleve.nom,
        'cibleId': i.cours_planifie_id,
        'cible': i.cours_planifie.cours.nom,
        'statut': i.statut,
    }


# --- Salles ------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def salles_view(request):
    # GET : liste toutes les salles. POST : en crée une nouvelle.
    if request.method == 'GET':
        return JsonResponse([_serialize_salle(s) for s in Salle.objects.all()], safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    numero_batiment, error_message = _batiment_letters(payload)
    if error_message:
        return JsonResponse({'detail': error_message}, status=400)
    numero_etage, error_message = _positive_int(payload, 'numeroEtage', "numéro d'étage")
    if error_message:
        return JsonResponse({'detail': error_message}, status=400)
    numero_salle, error_message = _positive_int(payload, 'numeroSalle', 'numéro de salle')
    if error_message:
        return JsonResponse({'detail': error_message}, status=400)

    if numero_batiment is None or numero_etage is None or numero_salle is None:
        return JsonResponse(
            {'detail': 'Le bâtiment, l\'étage et le numéro de salle sont requis.'},
            status=400,
        )

    try:
        salle = Salle.objects.create(
            numero_batiment=numero_batiment,
            numero_etage=numero_etage,
            numero_salle=numero_salle,
        )
    except IntegrityError:
        return JsonResponse({'detail': 'Cette salle existe déjà.'}, status=400)
    return JsonResponse(_serialize_salle(salle), status=201)


@csrf_exempt
@require_http_methods(['GET', 'PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def salle_detail_view(request, salle_id):
    salle = Salle.objects.filter(id=salle_id).first()
    if not salle:
        return JsonResponse({'detail': 'Salle introuvable.'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_serialize_salle(salle))

    if request.method == 'DELETE':
        salle.delete()
        return JsonResponse({'detail': 'Salle supprimée.'})

    payload, error = parse_json_body(request)
    if error:
        return error

    numero_batiment, error_message = _batiment_letters(payload, current=salle.numero_batiment)
    if error_message:
        return JsonResponse({'detail': error_message}, status=400)
    numero_etage, error_message = _positive_int(payload, 'numeroEtage', "numéro d'étage", current=salle.numero_etage)
    if error_message:
        return JsonResponse({'detail': error_message}, status=400)
    numero_salle, error_message = _positive_int(payload, 'numeroSalle', 'numéro de salle', current=salle.numero_salle)
    if error_message:
        return JsonResponse({'detail': error_message}, status=400)

    salle.numero_batiment = numero_batiment
    salle.numero_etage = numero_etage
    salle.numero_salle = numero_salle

    try:
        salle.save()
    except IntegrityError:
        return JsonResponse({'detail': 'Cette salle existe déjà.'}, status=400)
    return JsonResponse(_serialize_salle(salle))


# --- Filières ----------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def filieres_view(request):
    # GET : liste toutes les filières. POST : en crée une nouvelle.
    if request.method == 'GET':
        return JsonResponse([_serialize_filiere(f) for f in Filiere.objects.all()], safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    nom = payload.get('nom', '').strip()
    if not nom:
        return JsonResponse({'detail': 'Le nom est requis.'}, status=400)

    filiere = Filiere.objects.create(
        nom=nom,
        description=payload.get('description', '').strip(),
        statut=payload.get('statut', 'Actif').strip() or 'Actif',
    )
    return JsonResponse(_serialize_filiere(filiere), status=201)


@csrf_exempt
@require_http_methods(['GET', 'PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def filiere_detail_view(request, filiere_id):
    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return JsonResponse({'detail': 'Filière introuvable.'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_serialize_filiere(filiere))

    if request.method == 'DELETE':
        nb_cursus = filiere.cursus_set.count()
        nb_eleves = _filiere_linked_students_count(filiere)
        # La suppression est volontairement refusée tant que la filière n'est
        # pas vide. Les compteurs permettent aussi au frontend d'expliquer
        # précisément ce qui doit être détaché avant de réessayer.
        if nb_cursus or nb_eleves:
            return JsonResponse(
                {
                    'detail': (
                        'Impossible de supprimer cette filière : elle possède '
                        'encore des cursus ou des élèves rattachés.'
                    ),
                    'code': 'filiere_non_vide',
                    'nbCursus': nb_cursus,
                    'nbEleves': nb_eleves,
                },
                status=400,
            )

        try:
            filiere.delete()
        except ProtectedError:
            # Garde-fou contre une relation créée entre le contrôle précédent
            # et le DELETE (ou une future relation protégée non comptabilisée).
            return JsonResponse(
                {
                    'detail': (
                        'Impossible de supprimer cette filière : '
                        'des éléments y sont encore rattachés.'
                    ),
                    'code': 'filiere_non_vide',
                },
                status=400,
            )
        return JsonResponse({'detail': 'Filière supprimée.'})

    payload, error = parse_json_body(request)
    if error:
        return error

    if 'nom' in payload:
        nom = payload['nom'].strip()
        if not nom:
            return JsonResponse({'detail': 'Le nom est requis.'}, status=400)
        filiere.nom = nom
    if 'description' in payload:
        filiere.description = payload['description'].strip()
    if 'statut' in payload:
        filiere.statut = payload['statut'].strip() or 'Actif'
    filiere.save()
    return JsonResponse(_serialize_filiere(filiere))


# --- Cursus --------------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def cursus_list_view(request):
    # GET : liste tous les cursus avec leur filière. POST : en crée un nouveau.
    if request.method == 'GET':
        qs = Cursus.objects.select_related('filiere').all()
        return JsonResponse([_serialize_cursus(c) for c in qs], safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    nom = payload.get('nom', '').strip()
    filiere_id = payload.get('filiereId')
    if not nom or not filiere_id:
        return JsonResponse({'detail': 'Le nom et la filière sont requis.'}, status=400)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return JsonResponse({'detail': 'Filière introuvable.'}, status=404)

    cursus = Cursus.objects.create(
        nom=nom,
        filiere=filiere,
        description=payload.get('description', '').strip(),
        duree_mois=payload.get('dureeMois') or 0,
        statut=payload.get('statut', 'Actif').strip() or 'Actif',
    )
    return JsonResponse(_serialize_cursus(cursus, detail=True), status=201)


@csrf_exempt
@require_http_methods(['GET', 'PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def cursus_detail_view(request, cursus_id):
    cursus = Cursus.objects.select_related('filiere').filter(id=cursus_id).first()
    if not cursus:
        return JsonResponse({'detail': 'Cursus introuvable.'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_serialize_cursus(cursus, detail=True))

    if request.method == 'DELETE':
        try:
            cursus.delete()
        except ProtectedError:
            return JsonResponse(
                {'detail': 'Impossible de supprimer un cursus qui a des promotions.'},
                status=400,
            )
        return JsonResponse({'detail': 'Cursus supprimé.'})

    payload, error = parse_json_body(request)
    if error:
        return error

    if 'nom' in payload:
        nom = payload['nom'].strip()
        if not nom:
            return JsonResponse({'detail': 'Le nom est requis.'}, status=400)
        cursus.nom = nom
    if 'filiereId' in payload:
        filiere = Filiere.objects.filter(id=payload['filiereId']).first()
        if not filiere:
            return JsonResponse({'detail': 'Filière introuvable.'}, status=404)
        cursus.filiere = filiere
    if 'description' in payload:
        cursus.description = payload['description'].strip()
    if 'dureeMois' in payload:
        cursus.duree_mois = payload['dureeMois'] or 0
    if 'statut' in payload:
        cursus.statut = payload['statut'].strip() or 'Actif'
    cursus.save()
    return JsonResponse(_serialize_cursus(cursus, detail=True))


def _next_position(cursus):
    # Place toujours le nouveau cours en fin d'ordre pédagogique.
    last = cursus.cours_ordre.order_by('-position').first()
    return (last.position + 1) if last else 1


@csrf_exempt
@require_http_methods(['POST'])
@require_token_auth
@REFERENTE
def cursus_add_cours_view(request, cursus_id):
    # Associe un cours existant à ce cursus, à la fin de l'ordre pédagogique.
    cursus = Cursus.objects.filter(id=cursus_id).first()
    if not cursus:
        return JsonResponse({'detail': 'Cursus introuvable.'}, status=404)

    payload, error = parse_json_body(request)
    if error:
        return error

    cours = Cours.objects.filter(id=payload.get('coursId')).first()
    if not cours:
        return JsonResponse({'detail': 'Cours introuvable.'}, status=404)

    if CursusCours.objects.filter(cursus=cursus, cours=cours).exists():
        return JsonResponse({'detail': 'Ce cours est déjà dans le cursus.'}, status=400)

    CursusCours.objects.create(cursus=cursus, cours=cours, position=_next_position(cursus))
    return JsonResponse(_serialize_cursus(cursus, detail=True), status=201)


@csrf_exempt
@require_http_methods(['PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def cursus_cours_link_view(request, cursus_id, link_id):
    # PATCH : change la position (réordonnancement). DELETE : retire le cours du cursus.
    lien = CursusCours.objects.filter(id=link_id, cursus_id=cursus_id).select_related('cursus').first()
    if not lien:
        return JsonResponse({'detail': 'Association introuvable.'}, status=404)

    if request.method == 'DELETE':
        cursus = lien.cursus
        lien.delete()
        # Renumérote pour ne pas laisser de trous dans l'ordre pédagogique.
        for index, remaining in enumerate(cursus.cours_ordre.order_by('position'), start=1):
            if remaining.position != index:
                remaining.position = index
                remaining.save(update_fields=['position'])
        return JsonResponse(_serialize_cursus(cursus, detail=True))

    payload, error = parse_json_body(request)
    if error:
        return error

    nouvelle_position = payload.get('position')
    if not nouvelle_position:
        return JsonResponse({'detail': 'La position est requise.'}, status=400)

    # Réinsère le lien à sa nouvelle place parmi les autres, puis renumérote tout en séquence.
    cursus = lien.cursus
    autres = list(cursus.cours_ordre.exclude(id=lien.id).order_by('position'))
    nouvelle_position = max(1, min(int(nouvelle_position), len(autres) + 1))
    autres.insert(nouvelle_position - 1, lien)
    for index, item in enumerate(autres, start=1):
        if item.position != index:
            item.position = index
            item.save(update_fields=['position'])

    return JsonResponse(_serialize_cursus(cursus, detail=True))


# --- Cours -----------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def cours_list_view(request):
    # GET : liste tous les cours. POST : en crée un nouveau (le slug est généré automatiquement).
    if request.method == 'GET':
        return JsonResponse([_serialize_cours(c) for c in Cours.objects.all()], safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    nom = payload.get('nom', '').strip()
    if not nom:
        return JsonResponse({'detail': 'Le nom est requis.'}, status=400)

    cours = Cours.objects.create(
        nom=nom,
        technologie=payload.get('technologie', '').strip(),
        duree=payload.get('duree', '').strip(),
        description=payload.get('description', '').strip(),
        objectifs=payload.get('objectifs', '').strip(),
        statut=payload.get('statut', 'Actif').strip() or 'Actif',
    )
    return JsonResponse(_serialize_cours(cours, detail=True), status=201)


@csrf_exempt
@require_http_methods(['GET', 'PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def cours_detail_view(request, cours_id):
    cours = Cours.objects.filter(id=cours_id).first()
    if not cours:
        return JsonResponse({'detail': 'Cours introuvable.'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_serialize_cours(cours, detail=True))

    if request.method == 'DELETE':
        try:
            cours.delete()
        except ProtectedError:
            return JsonResponse(
                {
                    'detail': (
                        'Impossible de supprimer un cours associé à un cursus '
                        'ou à une offre planifiée.'
                    ),
                },
                status=400,
            )
        return JsonResponse({'detail': 'Cours supprimé.'})

    payload, error = parse_json_body(request)
    if error:
        return error

    for field, attr in (
        ('nom', 'nom'), ('technologie', 'technologie'), ('duree', 'duree'),
        ('description', 'description'), ('objectifs', 'objectifs'), ('statut', 'statut'),
    ):
        if field in payload:
            value = payload[field].strip()
            if field == 'nom' and not value:
                return JsonResponse({'detail': 'Le nom est requis.'}, status=400)
            setattr(cours, attr, value)
    cours.save()
    return JsonResponse(_serialize_cours(cours, detail=True))


@csrf_exempt
@require_http_methods(['GET'])
@require_token_auth
@REFERENTE
def cours_detail_by_slug_view(request, cours_slug):
    """Résout le slug visible dans l'URL React vers le cours interne."""
    cours = Cours.objects.filter(slug=cours_slug).first()
    if not cours:
        return JsonResponse({'detail': 'Cours introuvable.'}, status=404)
    return JsonResponse(_serialize_cours(cours, detail=True))


@csrf_exempt
@require_http_methods(['POST'])
@require_token_auth
@REFERENTE
def cours_add_cursus_view(request, cours_id):
    # Associe ce cours à un cursus existant (même relation que cursus_add_cours_view, vue de l'autre côté).
    cours = Cours.objects.filter(id=cours_id).first()
    if not cours:
        return JsonResponse({'detail': 'Cours introuvable.'}, status=404)

    payload, error = parse_json_body(request)
    if error:
        return error

    cursus = Cursus.objects.filter(id=payload.get('cursusId')).first()
    if not cursus:
        return JsonResponse({'detail': 'Cursus introuvable.'}, status=404)

    if CursusCours.objects.filter(cursus=cursus, cours=cours).exists():
        return JsonResponse({'detail': 'Ce cursus contient déjà ce cours.'}, status=400)

    CursusCours.objects.create(cursus=cursus, cours=cours, position=_next_position(cursus))
    return JsonResponse(_serialize_cours(cours, detail=True), status=201)


# --- Offres de cours à l'unité --------------------------------------------

def _offres_cours_queryset():
    # Base commune à toutes les vues d'offres : précharge les relations et compte les inscrits en une requête.
    return CoursPlanifie.objects.select_related(
        'cours', 'cursus_cours__cours', 'promotion', 'formateur'
    ).annotate(nb_inscrits=Count('inscriptions'))


@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def cours_offres_unitaires_view(request, cours_id):
    # GET : liste les sessions autonomes de ce cours précis. POST : en planifie une nouvelle.
    cours = Cours.objects.filter(id=cours_id).first()
    if not cours:
        return JsonResponse({'detail': 'Cours introuvable.'}, status=404)

    offres = _offres_cours_queryset().filter(
        cours=cours,
        promotion__isnull=True,
        cursus_cours__isnull=True,
    ).order_by('date_debut', 'id')

    if request.method == 'GET':
        return JsonResponse([_serialize_cours_planifie(o) for o in offres], safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    date_debut, date_fin, dates_error = _offre_dates(payload)
    if dates_error:
        return JsonResponse({'detail': dates_error}, status=400)

    formateur, formateur_error = _offre_formateur(payload)
    if formateur_error:
        return JsonResponse({'detail': formateur_error}, status=404)

    salle, salle_error = _offre_salle(payload)
    if salle_error:
        return JsonResponse({'detail': salle_error}, status=400)

    offre = CoursPlanifie.objects.create(
        cours=cours,
        date_debut=date_debut,
        date_fin=date_fin,
        formateur=formateur,
        salle=salle,
    )
    offre.nb_inscrits = 0
    return JsonResponse(_serialize_cours_planifie(offre), status=201)


@require_http_methods(['GET'])
@require_token_auth
@REFERENTE
def offres_cours_view(request):
    # Vue transverse (toutes les offres) filtrable par mode, recherche et échéance à venir.
    mode = request.GET.get('mode', 'all').strip().lower()
    if mode not in {'all', 'unite', 'promotion'}:
        return JsonResponse(
            {'detail': 'Le mode doit être "unite", "promotion" ou "all".'},
            status=400,
        )

    upcoming = request.GET.get('upcoming', '0').strip()
    if upcoming not in {'0', '1'}:
        return JsonResponse(
            {'detail': 'Le paramètre "upcoming" doit valoir 0 ou 1.'},
            status=400,
        )

    offres = _offres_cours_queryset()
    if mode == 'unite':
        offres = offres.filter(promotion__isnull=True, cursus_cours__isnull=True)
    elif mode == 'promotion':
        offres = offres.filter(promotion__isnull=False, cursus_cours__isnull=False)

    search = request.GET.get('search', '').strip()
    if search:
        offres = offres.filter(cours__nom__icontains=search)
    if upcoming == '1':
        offres = offres.filter(date_fin__gte=timezone_now())

    offres = offres.order_by('date_debut', 'id')[:100]
    return JsonResponse([_serialize_cours_planifie(o) for o in offres], safe=False)


@csrf_exempt
@require_http_methods(['PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def offre_cours_detail_view(request, offre_id):
    # Cette route ne doit jamais permettre d'altérer le planning d'une promotion.
    offre = _offres_cours_queryset().filter(
        id=offre_id,
        promotion__isnull=True,
        cursus_cours__isnull=True,
    ).first()
    if not offre:
        return JsonResponse({'detail': "Offre de cours à l'unité introuvable."}, status=404)

    if request.method == 'DELETE':
        if offre.inscriptions.exists():
            return JsonResponse(
                {
                    'detail': (
                        "Impossible de supprimer cette offre : des élèves y sont inscrits."
                    ),
                },
                status=400,
            )
        offre.delete()
        return JsonResponse({'detail': 'Offre de cours supprimée.'})

    payload, error = parse_json_body(request)
    if error:
        return error

    date_debut, date_fin, dates_error = _offre_dates(payload, offre=offre)
    if dates_error:
        return JsonResponse({'detail': dates_error}, status=400)

    formateur, formateur_error = _offre_formateur(payload, offre=offre)
    if formateur_error:
        return JsonResponse({'detail': formateur_error}, status=404)

    salle, salle_error = _offre_salle(payload, offre=offre)
    if salle_error:
        return JsonResponse({'detail': salle_error}, status=400)

    offre.date_debut = date_debut
    offre.date_fin = date_fin
    offre.formateur = formateur
    offre.salle = salle
    offre.save()
    return JsonResponse(_serialize_cours_planifie(offre))


# --- Promotions --------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def promotions_list_view(request):
    # GET : liste toutes les promotions. POST : en crée une avec son planning initial à planifier.
    if request.method == 'GET':
        qs = Promotion.objects.select_related('cursus').all()
        return JsonResponse([_serialize_promotion(p) for p in qs], safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    nom = payload.get('nom', '').strip()
    cursus = Cursus.objects.filter(id=payload.get('cursusId')).first()
    if not nom or not cursus:
        return JsonResponse({'detail': 'Le nom et le cursus sont requis.'}, status=400)

    # La fin estimée découle automatiquement de la durée du cursus : pas de saisie manuelle.
    date_debut = _parse_date(payload.get('dateDebut'))
    date_fin_estimee = _add_months(date_debut, cursus.duree_mois) if date_debut and cursus.duree_mois else None

    promotion = Promotion.objects.create(
        cursus=cursus,
        nom=nom,
        date_debut=date_debut,
        date_fin_estimee=date_fin_estimee,
        effectif_max=payload.get('effectifMax') or 0,
    )

    # Une ligne de planning "à planifier" par cours du cursus, prête à être renseignée ensuite.
    CoursPlanifie.objects.bulk_create([
        CoursPlanifie(promotion=promotion, cursus_cours=lien, cours=lien.cours)
        for lien in cursus.cours_ordre.select_related('cours').all()
    ])

    return JsonResponse(_serialize_promotion(promotion, detail=True), status=201)


@csrf_exempt
@require_http_methods(['GET', 'PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def promotion_detail_view(request, promotion_id):
    # GET : détail avec planning. PATCH : modifie nom/dates/effectif. DELETE : supprime la promotion.
    promotion = Promotion.objects.select_related('cursus').filter(id=promotion_id).first()
    if not promotion:
        return JsonResponse({'detail': 'Promotion introuvable.'}, status=404)

    if request.method == 'GET':
        return JsonResponse(_serialize_promotion(promotion, detail=True))

    if request.method == 'DELETE':
        promotion.delete()
        return JsonResponse({'detail': 'Promotion supprimée.'})

    payload, error = parse_json_body(request)
    if error:
        return error

    if 'nom' in payload:
        nom = payload['nom'].strip()
        if not nom:
            return JsonResponse({'detail': 'Le nom est requis.'}, status=400)
        promotion.nom = nom
    if 'dateDebut' in payload:
        promotion.date_debut = _parse_date(payload['dateDebut'])
        promotion.date_fin_estimee = (
            _add_months(promotion.date_debut, promotion.cursus.duree_mois)
            if promotion.date_debut and promotion.cursus.duree_mois else None
        )
    if 'effectifMax' in payload:
        promotion.effectif_max = payload['effectifMax'] or 0
    promotion.save()
    return JsonResponse(_serialize_promotion(promotion, detail=True))


@csrf_exempt
@require_http_methods(['PATCH'])
@require_token_auth
@REFERENTE
def promotion_planning_view(request, promotion_id):
    # Mise à jour groupée des dates (et formateur/salle) des cours d'une promotion.
    promotion = Promotion.objects.filter(id=promotion_id).first()
    if not promotion:
        return JsonResponse({'detail': 'Promotion introuvable.'}, status=404)

    payload, error = parse_json_body(request)
    if error:
        return error

    items = payload.get('items')
    if not isinstance(items, list):
        return JsonResponse({'detail': 'Une liste "items" est requise.'}, status=400)

    by_id = {cp.id: cp for cp in promotion.planning.all()}
    for item in items:
        cp = by_id.get(item.get('id'))
        if not cp:
            continue
        if 'dateDebut' in item:
            cp.date_debut = _parse_datetime(item['dateDebut'])
        if 'dateFin' in item:
            cp.date_fin = _parse_datetime(item['dateFin'])
        if 'formateurId' in item:
            cp.formateur_id = item['formateurId']
        if 'salle' in item:
            cp.salle = (item['salle'] or '').strip()
        cp.save()

    return JsonResponse(_serialize_promotion(promotion, detail=True))


# --- Élèves (recherche pour le formulaire d'inscription) --------------------

@require_http_methods(['GET'])
@require_token_auth
@REFERENTE
def eleves_search_view(request):
    # Recherche courte (10 résultats max) utilisée par l'auto-complétion du formulaire d'inscription.
    search = request.GET.get('search', '').strip()
    qs = DemoUser.objects.filter(role=DemoUser.ROLE_ELEVE)
    if search:
        qs = qs.filter(nom__icontains=search)
    eleves = [{'id': e.id, 'nom': e.nom, 'identifiant': e.identifiant} for e in qs[:10]]
    return JsonResponse(eleves, safe=False)


@require_http_methods(['GET'])
@require_token_auth
@REFERENTE
def formateurs_search_view(request):
    # Liste des formateurs pour le sélecteur du formulaire de planification.
    search = request.GET.get('search', '').strip()
    qs = DemoUser.objects.filter(role=DemoUser.ROLE_FORMATEUR)
    if search:
        qs = qs.filter(nom__icontains=search)
    formateurs = [{'id': f.id, 'nom': f.nom} for f in qs.order_by('nom')[:50]]
    return JsonResponse(formateurs, safe=False)


@require_http_methods(['GET'])
@require_token_auth
@REFERENTE
def cours_planifies_search_view(request):
    # Liste globale des offres de promotion et des offres autonomes, pour
    # choisir la session exacte ciblée par l'inscription.
    qs = _offres_cours_queryset()
    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(cours__nom__icontains=search)
    qs = qs.order_by('date_debut', 'id')[:20]
    return JsonResponse([_serialize_cours_planifie(cp) for cp in qs], safe=False)


# --- Inscriptions --------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def inscriptions_view(request):
    # GET : fusionne inscriptions à une promotion et à un cours à l'unité en une seule liste.
    # POST : crée l'une ou l'autre selon `type`, avec contrôle de prérequis pour les cours.
    if request.method == 'GET':
        promo_items = [
            _serialize_inscription_promotion(i)
            for i in InscriptionPromotion.objects.select_related('eleve', 'promotion').all()
        ]
        cours_items = [
            _serialize_inscription_cours(i)
            for i in InscriptionCours.objects.select_related(
                'eleve', 'cours_planifie__cours'
            ).all()
        ]
        return JsonResponse(promo_items + cours_items, safe=False)

    payload, error = parse_json_body(request)
    if error:
        return error

    eleve = DemoUser.objects.filter(id=payload.get('eleveId'), role=DemoUser.ROLE_ELEVE).first()
    if not eleve:
        return JsonResponse({'detail': 'Élève introuvable.'}, status=404)

    type_ = payload.get('type')
    force = bool(payload.get('force'))

    if type_ == 'promotion':
        promotion = Promotion.objects.filter(id=payload.get('cibleId')).first()
        if not promotion:
            return JsonResponse({'detail': 'Promotion introuvable.'}, status=404)
        try:
            inscription = InscriptionPromotion.objects.create(
                eleve=eleve,
                promotion=promotion,
                statut=InscriptionPromotion.STATUT_FORCEE if force else InscriptionPromotion.STATUT_VALIDEE,
            )
        except IntegrityError:
            return JsonResponse({'detail': 'Cet élève est déjà inscrit à cette promotion.'}, status=400)
        return JsonResponse(_serialize_inscription_promotion(inscription), status=201)

    if type_ == 'cours':
        cours_planifie = CoursPlanifie.objects.select_related('cours', 'cursus_cours').filter(
            id=payload.get('cibleId')
        ).first()
        if not cours_planifie:
            return JsonResponse({'detail': 'Cours planifié introuvable.'}, status=404)

        if not force and not _prerequis_satisfaits(eleve, cours_planifie):
            return JsonResponse(
                {'detail': "Prérequis non satisfait : le cours précédent du cursus n'est pas validé. Forçage possible."},
                status=409,
            )

        try:
            inscription = InscriptionCours.objects.create(
                eleve=eleve,
                cours_planifie=cours_planifie,
                statut=InscriptionCours.STATUT_FORCEE if force else InscriptionCours.STATUT_VALIDEE,
            )
        except IntegrityError:
            return JsonResponse({'detail': 'Cet élève est déjà inscrit à ce cours.'}, status=400)
        return JsonResponse(_serialize_inscription_cours(inscription), status=201)

    return JsonResponse({'detail': 'Le type d\'inscription doit être "promotion" ou "cours".'}, status=400)


def _prerequis_satisfaits(eleve, cours_planifie):
    # Le premier cours d'un cursus n'a pas de prérequis. Les suivants exigent que
    # l'élève ait déjà une inscription validée/forcée au cours précédent du même cursus.
    # Une offre autonome n'appartient à aucun ordre de cursus.
    if not cours_planifie.cursus_cours_id:
        return True

    position = cours_planifie.cursus_cours.position
    if position <= 1:
        return True

    precedent = CursusCours.objects.filter(
        cursus_id=cours_planifie.cursus_cours.cursus_id, position=position - 1
    ).first()
    if not precedent:
        return True

    return InscriptionCours.objects.filter(
        eleve=eleve,
        cours_planifie__cursus_cours=precedent,
        statut__in=[InscriptionCours.STATUT_VALIDEE, InscriptionCours.STATUT_FORCEE],
    ).exists()


# --- Planning de l'élève connecté (calendrier) --------------------------------

def _mon_planning_queryset(eleve):
    # Un cours planifié est visible pour l'élève soit parce qu'il est inscrit à toute la
    # promotion, soit parce qu'il s'est inscrit à ce cours précis "à l'unité" ; on prend l'union
    # des deux et .distinct() évite les doublons si les deux cas se recoupent.
    return CoursPlanifie.objects.select_related(
        'cours', 'cursus_cours', 'promotion', 'formateur'
    ).filter(
        Q(promotion__inscriptions__eleve=eleve) | Q(inscriptions__eleve=eleve)
    ).distinct()


@require_http_methods(['GET'])
@require_token_auth
@ELEVE
def mon_planning_view(request):
    # Vue calendrier de l'élève connecté : liste ses sessions, promotion et unité confondues.
    items = []
    for cp in _mon_planning_queryset(request.demo_user):
        items.append({
            'id': cp.id,
            'mode': 'promotion' if cp.promotion_id else 'unite',
            'coursId': cp.cours_id,
            'titre': cp.cours.nom,
            'promotionId': cp.promotion_id,
            'promotionNom': cp.promotion.nom if cp.promotion else None,
            'dateDebut': cp.date_debut.isoformat() if cp.date_debut else None,
            'dateFin': cp.date_fin.isoformat() if cp.date_fin else None,
            'formateurNom': cp.formateur.nom if cp.formateur else None,
            'salle': cp.salle,
            'statut': _cours_planifie_statut(cp),
        })
    return JsonResponse(items, safe=False)


@require_http_methods(['GET'])
@require_token_auth
@ELEVE
def mon_planning_detail_view(request, cours_planifie_id):
    # Le filtre vient de _mon_planning_queryset : un élève ne peut donc pas consulter
    # le détail d'un cours auquel il n'est pas inscrit, même en devinant l'id dans l'URL.
    cp = _mon_planning_queryset(request.demo_user).filter(id=cours_planifie_id).first()
    if not cp:
        return JsonResponse({'detail': 'Cours introuvable.'}, status=404)

    cours = cp.cours
    return JsonResponse({
        'id': cp.id,
        'mode': 'promotion' if cp.promotion_id else 'unite',
        'coursId': cours.id,
        'titre': cours.nom,
        'description': cours.description,
        'objectifs': cours.objectifs,
        'technologie': cours.technologie,
        'promotionId': cp.promotion_id,
        'promotionNom': cp.promotion.nom if cp.promotion else None,
        'dateDebut': cp.date_debut.isoformat() if cp.date_debut else None,
        'dateFin': cp.date_fin.isoformat() if cp.date_fin else None,
        'formateur': {
            'nom': cp.formateur.nom,
            'specialite': cp.formateur.specialite,
        } if cp.formateur else None,
        'salle': cp.salle,
        'statut': _cours_planifie_statut(cp),
    })
