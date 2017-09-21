import * as ajv from "ajv";
import * as ajvasync from "ajv-async";
import * as ValidationHelper from "../../validation/validationHelper";
import * as Footprint from "../components/footprint";
import * as Metadata from "../components/metadata";

export interface Collection {
  id: string,
  name: string,
  metadata: Metadata.Metadata,
  productsSchema: any,
  footprint: Footprint.IFootprint
};

export function validate(collection: Collection) {
  let validator = ajv({ async: 'es7', allErrors: true, formats: 'full' })
  let asyncValidator = ajvasync(validator)

  let collectionSchemaValidator = asyncValidator.compile(Schema)
  let errors: string[] = new Array<string>();

  let promise = new Promise((resolve, reject) => {
    collectionSchemaValidator(collection).then(e => {
      if (errors.length == 0) {
        resolve([true]);
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
    },
    "metadata": {
      "$ref": "#/definitions/metadata/metadata"
    },
    "propertiesSchema": {
      "type": "object"
    },
    "footprint": {
      "$ref": "#/definitions/footprint/footprint"
    },
    "required": ["id", "name", "metadata", "propertiesSchema", "footprint"]
  },
  "definitions": {
    "metadata": Metadata.Schema,
    "footprint": Footprint.Schema
  },
  "required": ["id", "name", "metadata", "footprint"]
};
