import * as ajv from 'ajv';
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

export function validate(product: Product) {
    let productSchemaValidator = ajv({ allErrors: true }).compile(Schema)
    let result = productSchemaValidator(product);
    
    let errors = ValidationHelper.reduceErrors(productSchemaValidator.errors)
    
    // Footprint Validation
    errors = Footprint.validate(product.footprint, errors)
    
    return [result, errors]
};

export const Schema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Product",
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "uuid"
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