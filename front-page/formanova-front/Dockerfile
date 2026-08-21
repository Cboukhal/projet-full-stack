FROM node:22-alpine

WORKDIR /app

# Isoler les manifestes maximise la réutilisation du cache de dépendances.
COPY front-page/formanova-front/package*.json ./
RUN npm install

COPY front-page/formanova-front ./

EXPOSE 5173

# --host rend Vite accessible depuis l'extérieur du conteneur.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
