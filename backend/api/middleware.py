from django.conf import settings
from django.http import HttpResponse


# On lit d'abord une éventuelle configuration explicite de CORS.
def _allowed_origins():
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and settings.CORS_ALLOWED_ORIGINS:
        return set(settings.CORS_ALLOWED_ORIGINS)

    # Sinon, on réutilise les origines CSRF autorisées.
    trusted_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    cleaned = set()
    for origin in trusted_origins:
        cleaned.add(origin.rstrip('/'))
    return cleaned


class SimpleCORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # On lit l'origine du frontend pour autoriser seulement le domaine attendu.
        origin = request.headers.get('Origin')
        allowed_origins = _allowed_origins()

        # Réponse rapide aux préflight OPTIONS du navigateur.
        if request.method == 'OPTIONS' and origin in allowed_origins:
            response = HttpResponse(status=204)
            self._set_cors_headers(response, origin)
            response['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response

        response = self.get_response(request)

        # On ajoute les en-têtes CORS uniquement si l'origine est connue.
        if origin in allowed_origins:
            self._set_cors_headers(response, origin)

        return response

    def _set_cors_headers(self, response, origin):
        # En-têtes CORS minimaux pour le frontend Vite.
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Vary'] = 'Origin'
