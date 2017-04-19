import * as ajv from 'ajv';
import * as ajvasync from 'ajv-async';
import * as Footprint from "./components/footprint";
import * as Properties from "./components/properties";
import * as Metadata from "./components/metadata";
import * as Data from "./components/data/data";
import * as DataServices from "./components/data/services";
import * as DataFiles from "./components/data/files";
import * as ValidationHelper from "../../validation/validationHelper";

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

function checkIdExists(schema, data) {
    return false;
}

function nonSchemaValidation(product:Product, errors:Array<string>) {
    errors = Footprint.validate(product.footprint, errors)
    return errors;
}

export function validate(product: Product) {
    let validator = ajv({ async: 'es7', allErrors: true })
    let asyncValidator = ajvasync(validator)
    let productSchemaValidator = asyncValidator.compile(Schema)

    asyncValidator.addKeyword('idExists', {
        async: true,
        type: 'string',
        validate: checkIdExists
    });

    let errors:string[] = new Array<string>();

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
            "format": "uuid",
            "idExists": {"test": "stuff"}
        },
        "name": {
            "type": "string"
        },
        "collectionId": {
            "type": "string",
            "format": "uuid"
        },
        "collectionName": {
            "type": "string"
        },
        "metadata": {
            "$ref": "#/definitions/metadata"
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