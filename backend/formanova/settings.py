"""Réglages Django de FormaNova, adaptés au local comme à Docker."""
import os
from pathlib import Path

# Chemin racine du projet Django.
BASE_DIR = Path(__file__).resolve().parent.parent

# Réglages de développement simples, pas pour la production.
# Le projet reste volontairement léger pour un backend étudiant.
SECRET_KEY = os.getenv(
    'DJANGO_SECRET_KEY',
    'django-insecure-a=ci=%8qu=c)zl)81jz@(gzm8e_irtk80ts-l@k!d3s4dvx!(5',
)
DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,backend').split(',')
    if host.strip()
]
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'DJANGO_CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://frontend:5173',
    ).split(',')
    if origin.strip()
]

# CORS et CSRF répondent à deux besoins différents. Le frontend React utilise
# CORS pour appeler l'API avec son en-tête Authorization ; cette liste est donc
# configurable indépendamment des origines CSRF.
CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip('/')
    for origin in os.getenv(
        'DJANGO_CORS_ALLOWED_ORIGINS',
        (
            'http://localhost:5173,http://localhost:5174,'
            'http://127.0.0.1:5173,http://127.0.0.1:5174,'
            'http://frontend:5173'
        ),
    ).split(',')
    if origin.strip()
]

# Apps activées par Django pour ce projet.
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Django REST Framework est disponible pour les futures vues API,
    # sérialiseurs, permissions et ViewSets.
    'rest_framework',
    'api',
]

# Middleware exécutés à chaque requête HTTP.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'api.middleware.SimpleCORSMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'formanova.urls'

# Le moteur de gabarits reste requis par l’administration et l’interface DRF.
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'formanova.wsgi.application'
ASGI_APPLICATION = 'formanova.asgi.application'

# En Docker, on vise PostgreSQL. En local, on évite de bloquer si le driver manque.
if os.getenv('POSTGRES_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'formanova'),
            'USER': os.getenv('POSTGRES_USER', 'formanova'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'formanova_dev_password'),
            'HOST': os.getenv('POSTGRES_HOST', 'db'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Les validateurs de mot de passe restent ceux fournis par Django.
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        # DemoUser n'utilise pas les noms de champs du User Django standard.
        'OPTIONS': {
            'user_attributes': ('identifiant', 'nom', 'email'),
        },
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Paramètres régionaux du projet.
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

# Les fichiers statiques ne sont pas encore servis par un serveur dédié.
STATIC_URL = 'static/'

# En Docker, les variables du compose dirigent les emails vers MailHog.
# Hors Docker, le backend console reste le comportement de développement par défaut.
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend',
)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '1025'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', '0').lower() in {'1', 'true', 'yes'}
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', '0').lower() in {'1', 'true', 'yes'}
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '10'))
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@formanova.local')

# URL publique utilisée dans les e-mails et durée de validité d'un lien.
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
PASSWORD_RESET_TOKEN_TTL_SECONDS = int(
    os.getenv('PASSWORD_RESET_TOKEN_TTL_SECONDS', '3600'),
)
