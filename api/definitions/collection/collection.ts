import * as ValidationHelper from "../../validation/validationHelper";
import * as ValidatorFactory from "../../validation/validatorFactory";
import * as Footprint from "../components/footprint";
import * as Metadata from "../components/metadata";

export interface ICollection {
  id: string;
  name: string;
  metadata: Metadata.IMetadata;
  productsSchema: any;
  footprint: Footprint.IFootprint;
}

export function validate(collection: ICollection) {
  let asyncValidator = ValidatorFactory.getValidator();
  let collectionSchemaValidator = asyncValidator.compile(Schema);
  let errors: string[] = new Array<string>();

  return new Promise((resolve, reject) => {
    collectionSchemaValidator(collection).then((e) => {
      if (errors.length === 0) {
        resolve([true]);
      } else {
        reject(errors);
      }
    }).catch((e) => {
      errors = ValidationHelper.reduceErrors(e.errors);
      reject(errors);
    });
  });
}

export const Schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $async: true,
  title: "Product",
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid"
    },
    name: {
      type: "string",
      pattern: "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"
    },
    metadata: {
      $ref: "#/definitions/metadata/metadata"
    },
    propertiesSchema: {
      type: "object"
    },
    footprint: {
      $ref: "#/definitions/footprint/footprint"
    },
    required: ["id", "name", "metadata", "propertiesSchema", "footprint"]
  },
  definitions: {
    metadata: Metadata.Schema,
    footprint: Footprint.Schema
  },
  required: ["id", "name", "metadata", "footprint"]
};
