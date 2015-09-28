# Link HT
A domain-specific, entity focused search application developed under DARPA's Memex program

# Setup
This project is generated by [angular-fullstack](https://github.com/DaftMonk/generator-angular-fullstack)

## Install instructions to set up Link HT on your local machine

We recommend Homebrew to install the project requirements on OSX

- Update homebrew: `brew update`
- Node: `brew install node`
- Bower: `npm install -g bower`
- Grunt: `npm install -g grunt-cli`
- Sass: `brew install ruby && gem install sass`
- Jade: `npm install jade --global`
- Mongo: `brew install mongodb`


Currently, we're using

- node v0.12.7
- npm 2.11.3
- bower 1.4.1
- grunt-cli v0.1.13
- grunt v0.4.5
- Sass 3.4.13 (Selective Steve)
- jade 1.9.2
- MongoDB shell version: 3.0.2


Next, clone this github repository.

```
git clone git@github.com:qadium/link-ht.git
```

# Running the app

Next, start mongo. The app will use the server and DB declared in `server/config/environment`. 

```
mongod
```

Next, install dependencies with bower and NPM and serve the app.

```
bower install
npm install
grunt serve
```

Alternatively, 
```
make all
make serve
```

## Populating local databases
Start `mysqld` and `elasticsearch` locally, then
```
cd pipeline
virtualenv env
source env/bin/activate
pip install -r requirements.txt
cd onetime
LINK_HT_PIPELINE=<URL> ELS_USER=<your user> ELS_PASS=<your password> ELS_HOST=<url> ELS_PORT=<port> python populate_ads.py
```


