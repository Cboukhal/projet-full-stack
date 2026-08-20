"""Outils d’authentification par jeton et de contrôle des rôles métier."""

import secrets
from functools import wraps

from django.http import JsonResponse

from .models import DemoUser


def make_token():
    """Créer un jeton de session aléatoire propre à une connexion."""

    # token_hex produit 64 caractères à partir de 32 octets aléatoires.
    return secrets.token_hex(32)


def _get_bearer_token(request):
    """Extraire le jeton de l’en-tête ``Authorization`` s’il est bien formé."""

    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    return header[len('Bearer '):].strip() or None


def require_token_auth(view_func):
    """Exiger un jeton valide et attacher son utilisateur à la requête."""

    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        """Autoriser l’appel de la vue seulement pour une session active."""

        token = _get_bearer_token(request)
        user = DemoUser.objects.filter(token=token).first() if token else None
        if not user:
            return JsonResponse({'detail': 'Authentification requise.'}, status=401)
        request.demo_user = user
        return view_func(request, *args, **kwargs)

    return wrapped


def require_role(*roles):
    """Construire un décorateur limitant une vue aux rôles indiqués."""

    # Ce décorateur s’empile après require_token_auth, qui fournit demo_user.
    def decorator(view_func):
        """Envelopper une vue avec le contrôle de rôle demandé."""

        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            """Refuser la vue lorsque le rôle courant n’est pas autorisé."""

            if request.demo_user.role not in roles:
                return JsonResponse({'detail': "Accès réservé à un autre rôle."}, status=403)
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator
