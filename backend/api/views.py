import json

from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import make_token, require_token_auth
from .models import DemoUser


def _public_user(user):
    # On enlève le mot de passe avant de renvoyer l'utilisateur au frontend.
    return {
        'identifiant': user.identifiant,
        'role': user.role,
        'nom': user.nom,
        'email': user.email,
        'telephone': user.telephone,
        'specialite': user.specialite,
    }


def _find_user_by_credentials(identifiant, mot_de_passe):
    # Recherche simple dans les données de démonstration.
    user = DemoUser.objects.filter(identifiant=identifiant).first()
    if user and check_password(mot_de_passe, user.mot_de_passe):
        return user
    return None


@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
    # Connexion simple: identifiant + mot de passe.
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Requête invalide.'}, status=400)

    # Le corps doit être un objet JSON (ex: {"identifiant": ...}), pas une liste ou un scalaire.
    if not isinstance(payload, dict):
        return JsonResponse({'detail': 'Requête invalide.'}, status=400)

    # On récupère les champs envoyés par le formulaire React.
    identifiant = payload.get('identifiant', '').strip()
    mot_de_passe = payload.get('motDePasse', '')

    if not identifiant or not mot_de_passe:
        return JsonResponse({'detail': 'Identifiant et mot de passe requis.'}, status=400)

    # Si l'utilisateur n'existe pas, on renvoie une erreur claire.
    user = _find_user_by_credentials(identifiant, mot_de_passe)
    if not user:
        return JsonResponse({'detail': 'Identifiant ou mot de passe incorrect.'}, status=401)

    # On génère un nouveau token à chaque connexion (invalide les sessions précédentes).
    user.token = make_token()
    user.save(update_fields=['token'])

    return JsonResponse(
        {
            'token': user.token,
            'user': _public_user(user),
        }
    )


@csrf_exempt
@require_http_methods(['GET', 'PATCH'])
@require_token_auth
def profile_view(request):
    # GET : renvoie les infos de l'utilisateur authentifié par son token.
    if request.method == 'GET':
        return JsonResponse(_public_user(request.demo_user))

    # PATCH : met à jour la fiche de l'utilisateur authentifié (jamais celle d'un autre).
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Requête invalide.'}, status=400)

    if not isinstance(payload, dict):
        return JsonResponse({'detail': 'Requête invalide.'}, status=400)

    user = request.demo_user
    # Seuls ces champs sont modifiables ; identifiant, rôle et mot de passe ne passent pas par ici.
    nom = payload.get('nom', user.nom).strip()
    email = payload.get('email', user.email).strip()
    telephone = payload.get('telephone', user.telephone).strip()
    specialite = payload.get('specialite', user.specialite).strip()

    if not nom or not email:
        return JsonResponse({'detail': 'Le nom et l\'email sont requis.'}, status=400)

    user.nom = nom
    user.email = email
    user.telephone = telephone
    user.specialite = specialite
    user.save(update_fields=['nom', 'email', 'telephone', 'specialite'])

    return JsonResponse(_public_user(user))


@csrf_exempt
@require_http_methods(['POST'])
@require_token_auth
def logout_view(request):
    # Invalide le token côté serveur pour que d'anciennes copies ne fonctionnent plus.
    request.demo_user.token = None
    request.demo_user.save(update_fields=['token'])
    return JsonResponse({'detail': 'Déconnecté.'})
