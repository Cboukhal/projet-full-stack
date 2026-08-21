"""Middleware CORS minimal pour les appels du frontend React."""

from django.conf import settings
from django.http import HttpResponse
from django.utils.cache import patch_vary_headers


# La liste CORS est indépendante de CSRF. Le repli conserve la compatibilité
# avec une ancienne configuration qui ne définirait pas encore ce réglage.
def _allowed_origins():
    """Normaliser les origines CORS configurées dans les réglages Django."""

    configured_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', None)
    if configured_origins is None:
        configured_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])

    return {
        origin.strip().rstrip('/')
        for origin in configured_origins
        if isinstance(origin, str) and origin.strip()
    }


class SimpleCORSMiddleware:
    """Répondre aux prérequêtes CORS et annoter les réponses autorisées."""

    def __init__(self, get_response):
        """Mémoriser le prochain maillon de la chaîne de middlewares."""

        self.get_response = get_response

    def __call__(self, request):
        """Traiter une prérequête ou enrichir la réponse Django normale."""

        # On lit l'origine du frontend pour autoriser seulement le domaine attendu.
        origin = request.headers.get('Origin')
        allowed_origins = _allowed_origins()

        # Réponse rapide aux préflight OPTIONS du navigateur.
        if request.method == 'OPTIONS' and origin in allowed_origins:
            response = HttpResponse(status=204)
            self._set_cors_headers(response, origin)
            response['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            # Le navigateur peut mémoriser ce préflight pendant dix minutes.
            response['Access-Control-Max-Age'] = '600'
            return response

        response = self.get_response(request)

        # On ajoute les en-têtes CORS uniquement si l'origine est connue.
        if origin in allowed_origins:
            self._set_cors_headers(response, origin)

        return response

    def _set_cors_headers(self, response, origin):
        """Ajouter les en-têtes CORS minimaux pour le frontend Vite."""

        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        # Ajoute Origin sans écraser un éventuel Vary déjà posé par Django.
        patch_vary_headers(response, ('Origin',))
