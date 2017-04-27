import * as ajv from "ajv";
import * as ajvasync from "ajv-async"
import * as ValidationHelper from "../../validation/validationHelper"

export interface Collection {
    name?: string
};

export function validate(collection: Collection) {
    let validator = ajv({ async: 'es7', allErrors: true, formats: 'full' })
    let asyncValidator = ajvasync(validator)

    let collectionSchemaValidator = asyncValidator.compile(Schema)
    let errors: string[] = new Array<string>();

    let promise = new Promise((resolve, reject) => {
        collectionSchemaValidator(collection).then(e => {
            if (errors.length == 0) {
                resolve([true, []]);
            } else {
                reject([false, errors])
            }
        }).catch(e => {
            errors = ValidationHelper.reduceErrors(e.errors)
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
            "pattern": "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"
        }
    }
};