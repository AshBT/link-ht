FROM gcr.io/google_appengine/nodejs

RUN npm install npm -g
RUN npm install n -g
RUN n stable

COPY ./dist /app
WORKDIR /app

RUN npm install --production
WORKDIR /app

CMD npm start
