# catalog
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
    pip install Sphinx

Database access parameters such as server location and authentication are provided through environment variables. A selection of scripts is available in /scripts folder.

Save a copy outside of source control and edit.

For linux set_env.sh:
    soruce set_env.sh

You're good to go. 

    yarn install
    yarn run dev

A browser window will open at http://localhost:5000

Tip: It's often handy to run the Typescript compiler `tsc` to quickly check for compile errors.

Run Tests
    yarn run tests
