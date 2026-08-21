"""Fonctions communes de lecture et de validation des requêtes HTTP."""

import json

from django.http import JsonResponse


def parse_json_body(request):
    """Décoder un objet JSON ou fournir directement la réponse d’erreur 400."""

    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, JsonResponse({'detail': 'Requête invalide.'}, status=400)

    if not isinstance(payload, dict):
        return None, JsonResponse({'detail': 'Requête invalide.'}, status=400)

    return payload, None
