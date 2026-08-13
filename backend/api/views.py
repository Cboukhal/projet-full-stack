import base64
import json
from time import time

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


def _find_user_by_role(role):
    # Le profil est récupéré à partir du rôle choisi.
    return DemoUser.objects.filter(role=role).first()


def _make_token(identifiant):
    # Jeton fictif suffisant pour le niveau du projet.
    payload = f'{identifiant}:{int(time())}'
    return base64.b64encode(payload.encode('utf-8')).decode('utf-8')


@csrf_exempt
@require_POST
def login_view(request):
    # Connexion simple: identifiant + mot de passe.
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
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

    # Le frontend reçoit un faux token et la fiche utilisateur sans mot de passe.
    return JsonResponse(
        {
            'token': _make_token(user.identifiant),
            'user': _public_user(user),
        }
    )


@require_GET
def profile_view(request):
    # Retourne les infos d'un utilisateur à partir de son rôle.
    role = request.GET.get('role', '').strip()
    if not role:
        return JsonResponse({'detail': 'Le rôle est requis.'}, status=400)

    # Chaque rôle correspond à un profil de démonstration.
    user = _find_user_by_role(role)
    if not user:
        return JsonResponse({'detail': 'Profil introuvable.'}, status=404)

    # On renvoie seulement les données publiques.
    return JsonResponse(_public_user(user))
