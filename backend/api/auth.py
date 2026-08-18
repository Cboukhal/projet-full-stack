import secrets
from functools import wraps

from django.http import JsonResponse

from .models import DemoUser


def make_token():
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


def require_role(*roles):
    # Décorateur à empiler après @require_token_auth : bloque (403) si le rôle de
    # l'utilisateur connecté ne fait pas partie de ceux autorisés pour cette route.
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if request.demo_user.role not in roles:
                return JsonResponse({'detail': "Accès réservé à un autre rôle."}, status=403)
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator
