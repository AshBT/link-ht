SHELL   := /bin/bash
PROJECT := link-ht
OSNAME  := $(shell uname -s)
ARCH    := $(shell uname -m)

# Python Information
PYTHON_VERSION := 3
PYTHON  := $(shell which python$(PYTHON_VERSION))
INSTALL := Miniconda$(subst 2,,$(PYTHON_VERSION))-latest-$(subst Darwin,MacOSX,$(OSNAME))-$(ARCH).sh
URL     := http://repo.continuum.io/miniconda/${INSTALL}
CONDA   := miniconda/bin/conda
PIP     := miniconda/bin/pip

# Node Information
NODE_VERSION := 0.12.7
BIN     := node_modules/.bin
BOWER   := $(BIN)/bower
NVM     := https://raw.githubusercontent.com/creationix/nvm/v0.26.1/install.sh
GRUNT   := $(BIN)/grunt
NVM_DIR := $(PWD)/nvm

.PHONY: all
all: install

.PHONY: help
help:
	@echo " Usage: \`make <target>'"
	@echo " ======================="
	@echo "  npm        install npm and nodejs"
	@echo "  bower      install bower and frontend dependencies"
	@echo "  serve      run grunt serve"
	@echo "  miniconda  boostrap anacondas python"
	@echo "  clean      remove build files"
	@echo
	@echo

.PHONY: miniconda
miniconda: $(CONDA)
	$(CONDA) update conda -y
	$(PIP) install -r pipeline/requirements.txt

$(CONDA):
	@echo $(LAOD)
	@echo "installing Miniconda"
	curl -O $(URL);
	@if  [ -r miniconda ]; then rm -rf miniconda; fi
	@bash $(INSTALL) -b -p miniconda
	@$(CONDA) create -n venv python=$(PYTHON_VERSION)* -y

npm: $(NVM_DIR)/nvm.sh
	@echo "Installing NodeJS Packages"
	@test -d $(BIN) || mkdir -p $(BIN)
	source nvm/nvm.sh && nvm install $(NODE_VERSION) && npm install && npm install grunt-cli

$(NVM_DIR)/nvm.sh:
	@echo "Installing NVM"
	@git clone https://github.com/creationix/nvm.git

.PHONY: bower
bower: npm
	@echo "Installing Javascript Packages"
	npm install bower

bower.json: bower
	@$(BOWER) install

.PHONY: install
install: miniconda npm bower
	@echo "Packages Installed"

.PHONY: serve
serve: install
	$(GRUNT) serve

.PHONY: clean
clean:
	@if [ -x $(GRUNT) ]; then $(GRUNT) clean; fi
	rm -rf node_modules
	rm -rf .DS_Store
	rm -rf miniconda
	rm -rf nvm
	rm -rf $(INSTALL)

