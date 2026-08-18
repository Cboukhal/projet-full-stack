from datetime import date, datetime, timezone

from django.db import IntegrityError
from django.db.models import ProtectedError, Q
from django.http import JsonResponse
from django.utils.timezone import is_naive, make_aware
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
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def _parse_datetime(value):
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    return make_aware(parsed) if is_naive(parsed) else parsed


# --- Sérialiseurs ------------------------------------------------------------

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


def _serialize_cursus(c, detail=False):
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
            'cursus_cours__cours', 'formateur'
        ).all()]
    return data


def _serialize_cours_planifie(cp):
    return {
        'id': cp.id,
        'cursusCoursId': cp.cursus_cours_id,
        'coursId': cp.cursus_cours.cours_id,
        'titre': cp.cursus_cours.cours.nom,
        'dateDebut': cp.date_debut.isoformat() if cp.date_debut else '',
        'dateFin': cp.date_fin.isoformat() if cp.date_fin else '',
        'formateurId': cp.formateur_id,
        'formateurNom': cp.formateur.nom if cp.formateur else None,
        'salle': cp.salle,
        'statut': _cours_planifie_statut(cp),
    }


def _serialize_inscription_promotion(i):
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
    return {
        'id': f'cours-{i.id}',
        'type': 'Unité',
        'eleveId': i.eleve_id,
        'eleve': i.eleve.nom,
        'cibleId': i.cours_planifie_id,
        'cible': i.cours_planifie.cursus_cours.cours.nom,
        'statut': i.statut,
    }


# --- Filières ----------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def filieres_view(request):
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
        try:
            filiere.delete()
        except ProtectedError:
            return JsonResponse(
                {'detail': 'Impossible de supprimer une filière qui a des cursus rattachés.'},
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
                {'detail': 'Impossible de supprimer un cours associé à un cursus.'},
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


# --- Promotions --------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def promotions_list_view(request):
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
        CoursPlanifie(promotion=promotion, cursus_cours=lien)
        for lien in cursus.cours_ordre.all()
    ])

    return JsonResponse(_serialize_promotion(promotion, detail=True), status=201)


@csrf_exempt
@require_http_methods(['GET', 'PATCH', 'DELETE'])
@require_token_auth
@REFERENTE
def promotion_detail_view(request, promotion_id):
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
def cours_planifies_search_view(request):
    # Liste globale (toutes promotions) des cours planifiés, pour choisir une cible d'inscription.
    qs = CoursPlanifie.objects.select_related('cursus_cours__cours', 'promotion')
    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(cursus_cours__cours__nom__icontains=search)
    items = [
        {
            'id': cp.id,
            'titre': cp.cursus_cours.cours.nom,
            'promotionNom': cp.promotion.nom,
            'statut': _cours_planifie_statut(cp),
        }
        for cp in qs[:20]
    ]
    return JsonResponse(items, safe=False)


# --- Inscriptions --------------------------------------------------------------

@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_token_auth
@REFERENTE
def inscriptions_view(request):
    if request.method == 'GET':
        promo_items = [
            _serialize_inscription_promotion(i)
            for i in InscriptionPromotion.objects.select_related('eleve', 'promotion').all()
        ]
        cours_items = [
            _serialize_inscription_cours(i)
            for i in InscriptionCours.objects.select_related(
                'eleve', 'cours_planifie__cursus_cours__cours'
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
        cours_planifie = CoursPlanifie.objects.select_related('cursus_cours').filter(
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
        'cursus_cours__cours', 'promotion', 'formateur'
    ).filter(
        Q(promotion__inscriptions__eleve=eleve) | Q(inscriptions__eleve=eleve)
    ).distinct()


@require_http_methods(['GET'])
@require_token_auth
@ELEVE
def mon_planning_view(request):
    items = []
    for cp in _mon_planning_queryset(request.demo_user):
        items.append({
            'id': cp.id,
            'coursId': cp.cursus_cours.cours_id,
            'titre': cp.cursus_cours.cours.nom,
            'promotionId': cp.promotion_id,
            'promotionNom': cp.promotion.nom,
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

    cours = cp.cursus_cours.cours
    return JsonResponse({
        'id': cp.id,
        'coursId': cours.id,
        'titre': cours.nom,
        'description': cours.description,
        'objectifs': cours.objectifs,
        'technologie': cours.technologie,
        'promotionId': cp.promotion_id,
        'promotionNom': cp.promotion.nom,
        'dateDebut': cp.date_debut.isoformat() if cp.date_debut else None,
        'dateFin': cp.date_fin.isoformat() if cp.date_fin else None,
        'formateur': {
            'nom': cp.formateur.nom,
            'specialite': cp.formateur.specialite,
        } if cp.formateur else None,
        'salle': cp.salle,
        'statut': _cours_planifie_statut(cp),
    })
