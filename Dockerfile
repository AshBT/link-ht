FROM ubuntu:14.04

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install \
	nodejs \
	nodejs-legacy \
	npm \
    mongodb

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
#CMD ["grunt","prod"]
RUN mkdir -p /data/db
CMD ["/bin/bash", "-c", "mongod & node server/app.js"]
