import json
import secrets
from functools import wraps

from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

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


def _make_token():
    # Jeton aléatoire non devinable, propre à chaque connexion.
    return secrets.token_hex(32)


def _get_bearer_token(request):
    # Extrait le jeton de l'en-tête "Authorization: Bearer <token>".
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    return header[len('Bearer '):].strip() or None


def require_token_auth(view_func):
    # Décorateur : vérifie le token et attache l'utilisateur correspondant à la requête.
    # Bloque l'accès (401) si le token est absent ou ne correspond à aucun utilisateur connecté.
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        token = _get_bearer_token(request)
        user = DemoUser.objects.filter(token=token).first() if token else None
        if not user:
            return JsonResponse({'detail': 'Authentification requise.'}, status=401)
        request.demo_user = user
        return view_func(request, *args, **kwargs)

    return wrapped


@csrf_exempt
@require_POST
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
    user.token = _make_token()
    user.save(update_fields=['token'])

    return JsonResponse(
        {
            'token': user.token,
            'user': _public_user(user),
        }
    )


@require_GET
@require_token_auth
def profile_view(request):
    # Retourne uniquement les infos de l'utilisateur authentifié par son token.
    return JsonResponse(_public_user(request.demo_user))


@csrf_exempt
@require_POST
@require_token_auth
def logout_view(request):
    # Invalide le token côté serveur pour que d'anciennes copies ne fonctionnent plus.
    request.demo_user.token = None
    request.demo_user.save(update_fields=['token'])
    return JsonResponse({'detail': 'Déconnecté.'})
