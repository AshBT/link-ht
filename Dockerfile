FROM gcr.io/google_appengine/nodejs

COPY ./dist /app
WORKDIR /app

RUN npm install --production
WORKDIR /app

CMD npm start
