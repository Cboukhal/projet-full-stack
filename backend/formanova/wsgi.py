"""Expose l’application FormaNova aux serveurs compatibles WSGI."""

import os

from django.core.wsgi import get_wsgi_application

# Définit les réglages uniquement si le processus hôte ne les a pas déjà choisis.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'formanova.settings')

# Objet standard découvert par le serveur WSGI au démarrage.
application = get_wsgi_application()
