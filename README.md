# Formanova

Application de gestion académique pour un organisme de formation : **filières, cursus, cours, promotions, planification et inscriptions**.

Le projet utilise un backend **Django (API JSON)** et un frontend **React avec Vite**.

## Stack

* **Backend** : Django 6, PostgreSQL avec Docker ou SQLite en local, authentification par token
* **Frontend** : React 19, Vite, React Router
* **Conteneurisation** : Docker Compose (`db` + `backend` + `frontend`)

## Démarrage rapide avec Docker

### Prérequis

Docker et Docker Compose doivent être installés.

À la racine du projet, exécuter :

```bash
docker compose up --build
```

Une fois les conteneurs démarrés :

* **Frontend** : `http://localhost:5173`
* **Backend / API** : `http://localhost:8000/api/`
* **PostgreSQL** : accessible uniquement depuis le conteneur backend. Aucun port PostgreSQL n'est publié sur la machine hôte.

Les migrations ainsi que le seed des utilisateurs de démonstration sont appliqués automatiquement au démarrage du conteneur backend avec :

```bash
python manage.py migrate --noinput
```

## Configuration `.env`

La configuration du projet est lue depuis le fichier `.env` situé à la racine.

Exemple :

```env
POSTGRES_DB=à_modifier
POSTGRES_USER=à_modifier
POSTGRES_PASSWORD=à_modifier

DJANGO_SECRET_KEY=votre_cle_secrete_django
DJANGO_DEBUG=1

DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,frontend
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://frontend:5173
```

> **Important :** `DJANGO_SECRET_KEY` doit contenir une clé secrète Django. Il vaut mieux éviter de copier une clé directement depuis `settings.py` si elle est versionnée dans Git. La clé doit rester dans le fichier `.env` et ne pas être publiée dans le dépôt.

## Démarrage local sans Docker

### Backend

Se placer dans le dossier backend :

```bash
cd backend
```

Créer un environnement virtuel :

```bash
python -m venv .venv
```

#### Windows

Activer l'environnement virtuel :

```powershell
.venv\Scripts\activate
```

#### macOS / Linux

Activer l'environnement virtuel :

```bash
source .venv/bin/activate
```

Installer les dépendances :

```bash
pip install -r requirements.txt
```

Appliquer les migrations :

```bash
python manage.py migrate
```

Démarrer le serveur Django :

```bash
python manage.py runserver
```

Sans variable `POSTGRES_HOST` dans l'environnement, le backend bascule automatiquement sur **SQLite** :

```text
backend/db.sqlite3
```

Cela permet de développer localement sans avoir besoin de Docker ou de PostgreSQL.

## Frontend

Se placer dans le dossier du frontend :

```bash
cd front-page/formanova-front
```

Installer les dépendances :

```bash
npm install
```

Démarrer le serveur de développement Vite :

```bash
npm run dev
```

Par défaut, le frontend appelle l'API disponible à l'adresse :

```text
http://localhost:8000
```

Cette adresse peut être modifiée grâce à la variable d'environnement Vite :

```env
VITE_BACKEND_URL=http://localhost:8000
```

## Comptes de démonstration

Les utilisateurs de démonstration sont créés automatiquement par les migrations.

Les données utilisées pour leur création sont définies dans :

```text
backend/api/data.py
```

## Structure du projet

```text
backend/                         Projet Django
├── api/                         App principale
│   ├── modèles
│   ├── vues
│   ├── authentification
│   └── middleware
│
├── formanova/                   Configuration Django
│   ├── settings
│   ├── URLs racine
│   ├── WSGI
│   └── ASGI
│
front-page/
└── formanova-front/             Application React avec Vite
    └── src/
        ├── api/                  Clients HTTP par ressource
        │                         (cours, cursus, promotions, ...)
        ├── pages/                Pages élève et référente
        └── components/           Composants réutilisables

docker-compose.yaml              Orchestration db + backend + frontend
```

## Tests

Pour lancer les tests du backend, se placer dans le dossier `backend` :

```bash
cd backend
```

Puis exécuter :

```bash
python manage.py test
```
