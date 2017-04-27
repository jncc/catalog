import * as ajv from 'ajv';
import * as ajvasync from 'ajv-async';
import * as Footprint from "./components/footprint";
import * as Properties from "./components/properties";
import * as Metadata from "./components/metadata";
import * as Data from "./components/data/data";
import * as DataServices from "./components/data/services";
import * as DataFiles from "./components/data/files";
import * as ValidationHelper from "../../validation/validationHelper";

import { Database } from "../../repository/database"

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

function checkCollectionNameExists(schema, data) {
    return Database.instance.connection.task(t => {
        return t.oneOrNone('select name from collection where name = $1', [data], x => x && x.name)
            .then(name => {
                if (name == null || name == undefined) {
                    return false;
                }
                return true;
            });
    }).catch(error => {
        console.log("database error : " + error)
        throw new Error(error)
    });
}

function nonSchemaValidation(product: Product, errors: Array<string>) {
    errors = Footprint.validate(product.footprint, errors)
    errors = Metadata.validate(product.metadata, errors)
    return errors;
}

export function validate(product: Product) {
    let validator = ajv({ async: 'es7', allErrors: true, formats: 'full' })
    let asyncValidator = ajvasync(validator)

    // Add a keyword [external function] to the validator to check for name presence in database table
    asyncValidator.addKeyword('collectionNameExists', {
        async: true,
        type: 'string',
        validate: checkCollectionNameExists
    });

    let productSchemaValidator = asyncValidator.compile(Schema)
    let errors: string[] = new Array<string>();

    let promise = new Promise((resolve, reject) => {
        productSchemaValidator(product).then(e => {
            errors = nonSchemaValidation(product, errors)
            if (errors.length == 0) {
                resolve([true, []]);
            } else {
                reject([false, errors])
            }
        }).catch(e => {
            errors = ValidationHelper.reduceErrors(e.errors)
            errors = nonSchemaValidation(product, errors)
            reject([false, errors])
        })
    });

    return promise
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
            "pattern": "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$",
            "collectionNameExists": { }
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