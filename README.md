Formanova

Application de gestion académique pour un organisme de formation : filières, cursus, cours,
promotions, planification et inscriptions. Backend Django (API JSON) + frontend React (Vite).

Stack

Backend : Django 6, PostgreSQL (Docker) ou SQLite (local), authentification par token

Frontend : React 19, Vite, React Router

Conteneurisation : Docker Compose (db + backend + frontend)

Démarrage rapide (Docker)

Prérequis : Docker et Docker Compose.

docker compose up --build

Frontend : http://localhost:5173

Backend / API : http://localhost:8000/api/

Postgres : exposé au conteneur backend uniquement (pas de port publié sur l'hôte)

Les migrations et le seed des utilisateurs de démo sont appliqués automatiquement au démarrage
du conteneur backend (python manage.py migrate --noinput).

La configuration (mot de passe DB, clé secrète Django, hôtes autorisés, origines CORS/CSRF) est
lue depuis le fichier .env à la racine.

```env
POSTGRES_DB=à modifier
POSTGRES_USER=à modifier
POSTGRES_PASSWORD=à modifier
DJANGO_SECRET_KEY= insérer clé API qui se trouve dans le fichier Setting.py après l'instalation du projet
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,frontend
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://frontend:5173
```

Démarrage local (sans Docker)

Backend

cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows

# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Sans POSTGRES_HOST dans l'environnement, le backend bascule automatiquement sur SQLite
(backend/db.sqlite3), pratique pour développer sans Docker.

Frontend

cd front-page/formanova-front
npm install
npm run dev

Le frontend appelle l'API sur http://localhost:8000 par défaut (configurable via la variable
d'environnement Vite VITE_BACKEND_URL).

Comptes de démonstration

Les utilisateurs suivants sont créés automatiquement par les migrations (backend/api/data.py)


Structure du projet

backend/                    Projet Django
  api/                      App principale (modèles, vues, auth, middleware)
  formanova/                Settings, URLs racine, WSGI/ASGI
front-page/formanova-front/ Application React (Vite)
  src/api/                  Clients HTTP par ressource (cours, cursus, promotions, ...)
  src/pages/                Pages (élève, référente)
  src/components/           Composants réutilisables
docker-compose.yaml         Orchestration db + backend + frontend

Tests

cd backend
python manage.py test

Notes

Projet : l'authentification utilise un modèle DemoUser dédié (pas le système
auth intégré de Django) avec un jeton simple généré à la connexion.
