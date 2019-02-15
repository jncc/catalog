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

    yarn install
    yarn run dev

A browser window will open at http://localhost:5000

Tip: It's often handy to run the Typescript compiler `tsc` to quickly check for compile errors.

Run Tests
    yarn run tests

## Documentation

Docs follow this template:
https://docs.google.com/document/d/1HSQ3Fe77hnthw8hizqvXJU-qGEPHavMkctvCCadkVbY/edit?pli=1#

to build docs run: 

yarn run build-docs

Table generator is handy for building complex tables.
http://www.tablesgenerator.com/text_tables
