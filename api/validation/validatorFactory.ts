import * as ajv from "ajv";
import * as ajvasync from "ajv-async";

import { DateValidator } from "../validation/dateValidator";

export function getValidator(options: any = { allErrors: true, formats: "full" }) {
  // Fix for mixed json schema versions, older schemas need some extra bits
  let metaSchemaVersion = 7;

  if ("schemaVersion" in options) {
    if (options.schemaVersion == "http://json-schema.org/draft-04/schema#") {
      options.schemaId = 'id';
      metaSchemaVersion = 4
    } else if (options.schemaVersion == "http://json-schema.org/draft-6/schema#") {
      metaSchemaVersion = 6
    }
    delete options.schemaVersion;
  }

  let validator = ajv(options);

  // Fix for mixed json schema versions, older schemas need some extra bits
  if (metaSchemaVersion == 4) {
    validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
  } else if (metaSchemaVersion == 6) {
    validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  }

  validator.addKeyword("fullDateValidation", {
    type: "string",
    errors: true,
    validate: (schema, data) => {
      // todo: Get real errors into avj error list.
      let errors: string[] = [];
      DateValidator.validateDate(data, "", errors);

      if (errors.length > 0) {
        return false;
      } else {
        return true;
      }
    }
  });

  return ajvasync(validator);
}
