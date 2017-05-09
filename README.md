# catalog
Metadata and data product catalogue.

## Development


The catalog is a Node.js REST server application written in Typescript.

Install Node.js (Note: Ubuntu requires the `nodejs-legacy` package to create a `node` symlink
https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

    apt install nodejs-legacy

Install Typescript

    npm i -g typescript

You're good to go. 

    npm i
    npm run dev

A browser window will open at http://localhost:5000

Tip: It's often handy to run the Typescript compiler `tsc` to quickly check for compile errors.

Run Tests
    npm run tests