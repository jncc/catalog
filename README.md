# Catalog
Metadata and data product catalogue.

## Development

The catalog is a Node.js REST server application written in Typescript.

Install Node.js (Note: Ubuntu requires the `nodejs-legacy` package to create a `node` symlink
https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

    apt install nodejs-legacy

Install Typescript and Yarn
    npm i -g typescript
    npm i -g yarn

Install Sphinx for documentation
    pip install sphinx sphinx-autobuild

    For linting:
    pip install restructuredtext-lint

    Install the reStructuredText extension for vs code by searching for:
      restructuredtext publisher:"LeXtudio"

    Further configuration for the plugin can be found here:
    https://github.com/vscode-restructuredtext/vscode-restructuredtext/blob/master/docs/sphinx.md

Database access parameters such as server location and authentication are provided through environment variables. A selection of scripts is available in /scripts folder.

Save a copy outside of source control and edit.

Either fill in a .env file with the appropriate Environment values or add the apporpriate variables to your system environment, all required variables are listed in .env.example

You're good to go.

    cd ./app
    yarn install
    yarn run dev

A browser window will open at http://localhost:5000

Tip: It's often handy to run the Typescript compiler `tsc` to quickly check for compile errors.

Run Tests
    yarn run tests

# Database setup

* Install postgres package.
* Install postgis package.

* su to the postgres user

    sudo su - postgres

* create the database

    psql -c "CREATE DATABASE catalog;"
    psql -d catalog -f ./setup-scripts/database-scripts/postgis/database.sql 
    psql -d catalog -f ./setup-scripts/database-scripts/postgis/collection.sql 
    psql -d catalog -f ./setup-scripts/database-scripts/postgis/product.sql 
    psql -d catalog -f ./setup-scripts/database-scripts/postgis/product_view.sql 

* create the user with a password (CHANGE THE PASSWORD BELOW)

    psql -d catalog -c "CREATE USER catalog WITH ENCRYPTED PASSWORD 'password';"
    psql -d catalog -c "GRANT connect ON DATABASE catalog TO catalog;"
    psql -d catalog -c "GRANT usage ON SCHEMA public TO catalog;"
    psql -d catalog -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO catalog;"


## Online Documentation

Docs follow this template:
https://docs.google.com/document/d/1HSQ3Fe77hnthw8hizqvXJU-qGEPHavMkctvCCadkVbY/edit?pli=1#

to build docs run: 

yarn run build-docs

Table generator is handy for building complex tables.
http://www.tablesgenerator.com/text_tables

## Docker container

### Build container

To build the docker container simply run: 

    yarn run build:docker

while in the app directory and this should build the application and then a docker container based off of that called jncc/catalog. 

### Pull Container

This image is currently being hosted at docker hub under our JNCC account if you want to pull a particular verison (1.0.0 - 1.0.4 currently) or just the latest run `docker pull jncc/catalog:latest`.

### Run container

If you need to run the container locally for testing you can run with the following command: `

*NB - Run from the project root*

    docker run -p 9001:8081 -d --env-file .env jncc/catalog -t catalog

where the `--env-file .env` parameter points to a .env with all the configuration required as in the `.env.example` file. 

The `NODE_ENV` environment varaible **must not** be set to `developement` when its being supplied to the docker container however as this is an option only for local development outside the docker container

This will run a container with the port exposed at `http://localhost:9001`.

### Local postgres with Docker

Postgres will by default only listen to the localhost (127.0.0.1) and probably hasn't been configured to do anything else on a development machine. However docker vm's run on there own network and postgres must be configured to interact with this.

Get the docker network :

    ifconfig docker0 | grep inet

This will give an output as follows: 

    inet 172.17.0.1  netmask 255.255.0.0  broadcast 172.17.255.255
    inet6 fe80::42:54ff:feab:e808  prefixlen 64  scopeid 0x20<link>

In this case Postgres needs to listen on 172.17.0.1 and accept authenticated connections from the 172.17.0.1/16 ip address range before it will work with docker.




