import * as ajv from "ajv";
import * as ajvasync from "ajv-async";

import { DateValidator } from "../validation/dateValidator";

export function getValidator(options: any = { allErrors: true, formats: "full" }) {
  let validator = ajv(options);

  validator.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
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

  return ajvasync(getValidator(options));;
}


