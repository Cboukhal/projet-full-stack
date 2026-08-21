"""Expose l’application FormaNova aux serveurs compatibles ASGI."""

import os

from django.core.asgi import get_asgi_application

# Définit les réglages uniquement si le processus hôte ne les a pas déjà choisis.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'formanova.settings')

# Objet standard découvert par le serveur ASGI au démarrage.
application = get_asgi_application()
