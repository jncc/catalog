import * as ajv from 'ajv';
import * as ajvasync from 'ajv-async';
import * as Footprint from "./components/footprint";
import * as Properties from "./components/properties";
import * as Metadata from "./components/metadata";
import * as Data from "./components/data/data";
import * as DataServices from "./components/data/services";
import * as DataFiles from "./components/data/files";
import * as ValidationHelper from "../../validation/validationHelper";

import { Database } from "../../repository/database";

//test reqs
import { Fixtures } from "../../test/fixtures";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import  'mocha';
import { should } from 'chai';
require('mocha-inline')();
chai.use(chaiAsPromised);

export interface Product {
    id?: string,
    name: string,
    collectionId?: string,
    collectionName: string,
    metadata: Metadata.Metadata,
    properties: Properties.Properties,
    data: Data.Data,
    footprint: Footprint.Footprint
};

export const Schema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "$async": true,
    "title": "Product",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "uuid"
        },
        "name": {
            "type": "string",
            "pattern": "^([A-Za-z0-9\-\_\.])+$"
        },
        "collectionId": {
            "type": "string",
            "format": "uuid"
        },
        "collectionName": {
            "type": "string",
            "pattern": "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"
        },
        "metadata": {
            "$ref": "#/definitions/metadata/metadata"
        },
        "properties": {
            "$ref": "#/definitions/properties"
        },
        "data": {
            "$ref": "#/definitions/data/data"
        },
        "footprint": {
            "type": "object"
        }
    },
    "definitions": {
        "metadata": Metadata.Schema,
        "properties": Properties.Schema,
        "data": Data.Schema,
        "files": DataFiles.Schema,
        "services": DataServices.Schema
    },
    "required": ["name", "collectionName", "metadata", "properties", "data", "footprint"]
}

function checkCollectionNameExists(errors: Array<string>, collectionName: string) {
    return Database.instance.connection.task(t => {
        return t.oneOrNone('select name from collection where name = $1', [collectionName], x => x && x.name)
            .then(name => {
                if (name == null || name == undefined) {
                    errors.push(' | collection name does not exist in the database')
                }
                return errors;
            });
    }).catch(error => {
        console.log("database error : " + error)
        throw new Error(error)
    });
}

function nonSchemaValidation(product: Product, errors: Array<string>): Promise<Array<string>> {
    errors = Footprint.nonSchemaValidation(product.footprint, errors)
    errors = Metadata.nonSchemaValidation(product.metadata, errors)
    
    return checkCollectionNameExists(errors, product.collectionName);
}

export function validate(product: Product): Promise<Array<string>> {
    console.log('running validator')

    let validator = ajv({ allErrors: true, formats: 'full' })
    let asyncValidator = ajvasync(validator)
   
    let productSchemaValidator = asyncValidator.compile(Schema)
    let errors: string[] = new Array<string>();

    let promise = new Promise((resolve, reject) => {
        
        productSchemaValidator(product)
        .then(e => nonSchemaValidation(product, e))     
        .then(e => {
            if (errors.length == 0) {
                resolve(errors);
            } else {
                reject(errors)
            }
        }).catch(e => {
            errors = ValidationHelper.reduceErrors(e.errors)
            reject(errors)
        })
    });

    return promise
};



//Tests
describe('validate', () => {
  it('should validate a valid product', () => {
    const product = Fixtures.GetTestProduct();
    validate(product).then(result => {
        console.log(result);
    })   
    return chai.expect(validate(product)).to.not.be.rejected;
  });
})