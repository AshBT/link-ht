FROM ubuntu:14.04

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install \
	git \
	nodejs \
	nodejs-legacy \
	npm \
	ruby-full
RUN npm install -g grunt-cli bower
RUN gem install sass

COPY . /app
WORKDIR /app
RUN rm -rf node_modules

RUN bower --allow-root --config.interactive=false install
RUN npm install
RUN grunt build
WORKDIR /app/dist

ENV NODE_ENV production
EXPOSE 9000
#CMD ["grunt","prod"]
CMD ["node", "server/app.js"]