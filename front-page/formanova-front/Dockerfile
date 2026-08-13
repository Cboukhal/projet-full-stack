FROM node:22-alpine

WORKDIR /app

COPY front-page/formanova-front/package*.json ./
RUN npm install

COPY front-page/formanova-front ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]