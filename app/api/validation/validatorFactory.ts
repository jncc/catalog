import * as ajv from "ajv";
import * as ajvasync from "ajv-async";

import { DateValidator } from "../validation/dateValidator";


export function getValidator(schemaVersion:String = "", options: any = { allErrors: true, formats: "full" }) {
  let validator = ajv(options);

  // Fix for mixed json schema versions, older schemas need some extra bits
  if (schemaVersion == "http://json-schema.org/draft-06/schema#") {
    validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  } else if (schemaVersion == "http://json-schema.org/draft-04/schema#") {
    options.schemaId = 'id';
    validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
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
