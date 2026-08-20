#!/usr/bin/env python
"""Point d’entrée des commandes d’administration Django de FormaNova."""
import os
import sys


def main():
    """Configure Django puis exécuter la commande reçue en argument."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'formanova.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
