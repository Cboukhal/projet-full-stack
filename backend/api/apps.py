"""Déclare l’application métier auprès du registre Django."""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration chargée automatiquement pour l’application ``api``."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
