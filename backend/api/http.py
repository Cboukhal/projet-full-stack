import json

from django.http import JsonResponse


def parse_json_body(request):
    # Petite aide partagée : décode le corps JSON d'une requête, ou renvoie
    # directement la réponse d'erreur 400 à retourner si le corps est invalide.
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, JsonResponse({'detail': 'Requête invalide.'}, status=400)

    if not isinstance(payload, dict):
        return None, JsonResponse({'detail': 'Requête invalide.'}, status=400)

    return payload, None
