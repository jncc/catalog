import * as Footprint from "../components/footprint";
import * as Metadata from "../components/metadata";
import * as Properties from "./components/properties";
import * as Data from "./components/data/data";
import * as DataServices from "./components/data/services";
import * as DataFiles from "./components/data/files";
import * as ValidationHelper from "../../validation/validationHelper";

export interface Product {
  id: string,
  name: string,
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
  "additionalProperties": false,
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "pattern": "^(([A-Za-z0-9\_\-]+)(\/))*([A-Za-z0-9\_\-])+$"
    },
    "collectionId": {
      "type": "string",
      "format": "uuid"
    },
    "collectionName": {
      "type": "string",
      "pattern": "^(([A-Za-z0-9\_\-]+)(\/))*([A-Za-z0-9\_\-])+$"
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
};
