FROM python:3.13-slim

# Empêche la création de fichiers .pyc et transmet immédiatement les journaux
# Python vers la sortie du conteneur.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copier les dépendances séparément permet de réutiliser le cache Docker tant
# que requirements.txt ne change pas.
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend /app

EXPOSE 8000

# Applique le schéma avant de démarrer le serveur utilisé en développement.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
