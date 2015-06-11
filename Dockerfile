FROM debian

RUN apt-get -qqy update
RUN apt-get -qqy install nodejs npm mongodb-server

COPY ./dist /app
WORKDIR /app

RUN npm install --production
WORKDIR /app

ENV NODE_ENV production
ENV MONGO_PORT_27017_TCP_ADDR localhost
ENV MONGO_PORT_27017_TCP_PORT 27017

ENV NEO_PASS D*USi0ntZwUfRNPr^6b20uGd
ENV NEO_HOST http://neo4j.52.8.52.176.xip.io/

EXPOSE 8080
RUN mkdir -p /data/db
CMD ["/bin/bash", "-c", "mongod --smallfiles & nodejs server/app.js"]
