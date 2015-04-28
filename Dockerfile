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

RUN bower --allow-root --config.interactive=false install
RUN npm install

EXPOSE 8080
CMD ["grunt","prod"]