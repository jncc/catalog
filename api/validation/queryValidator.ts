import * as ajv from "ajv";
import * as ajvasync from "ajv-async";
import * as Query from "../query";
import * as ValidationHelper from "../validation/validationHelper";

import { DateValidator } from "../validation/dateValidator";

export class QueryValidator {
  public static validateQueryParams(schema: any, params: any): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let validationSchema: any = this.getValidationSchema(schema);
      let extractedQueryParams: any = this.getExtractedQueryParams(params);
      this.validateExtractedQueryParams(validationSchema, extractedQueryParams)
        .then(() => {
          console.log("this.validateExtractedQueryParams");
          resolve();
        }).catch((errors) => {
          reject(errors);
        });
    });
  }

  public static extractQueryDataTypes(schema: any, query: Query.Query): any[] {
    let properties = query.terms.map((term) => term.property);
    return properties.filter((item, position) => properties.indexOf(item) === position).map((property) => {
      let tm: any = {};
      if (schema.properties[property].type === "string") {
        if ("format" in schema.properties[property] && schema.properties[property].format in ["date", "date-time"]) {
          tm[property] = schema.properties[property].format;
        } else {
          tm[property] = "string";
        }
      } else if (schema.properties[property].type === "number") {
        tm[property] = "double";
      } else if (schema.properties[property].type === "integer") {
        tm[property] = "int";
      }

      return tm;
    });
  }

  public static validateExtractedDataTypes(query: Query.Query, extracted: any[]): string[] {
    let queryValid: boolean = true;
    let errors: string[] = [];

    let valid: boolean = false;
    let error: string = "";

    query.terms.forEach((element) => {
      [valid, error] = this.validateOperationAgainstType(extracted[element.value], element);
      if (!valid) {
        queryValid = false;
        errors.push(error);
      }
    });

    return errors;
  }

  /**
   * Returns the properties validation schema for this collection without a required
   * block so that individual elements can be validated
   *
   * @param schema The base properties schema of a collection
   * @returns A JSON schema for use in validating individual query parameters
   */
  private static getValidationSchema(schema: any) {
    delete schema.required;
    return schema;
  }

  /**
   * Extracts each query param as an individual element to be validated individually
   *
   * @param params A JSON object containing the query params
   * @returns An array of individual JSON objects to be validated
   */
  private static getExtractedQueryParams(params: Query.ITerm[]) {
    let extracted: any[] = [];

    params.forEach((element) => {
      let current = {};
      current[element.property] = element.value;
      extracted.push(current);
    });

    return extracted;
  }

  /**
   * Validates an arrat of extracted query parameters against a supplied JSON schema, returns
   * a promise for the result of the validation
   *
   * @param schema A properties schema to validate against
   * @param extractedQueryParams An array of extracted query objects
   * @returns A promise, if validation fails, promise is rejected, if it validates then promise is fulfilled
   */
  private static validateExtractedQueryParams(schema: any, extractedQueryParams: any[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let validator = ajv({ allErrors: true, formats: "full" });
      let asyncValidator = ajvasync(validator);

      asyncValidator.addKeyword("fullDateValidation", {
        type: "string",
        errors: true,
        validate: (ajvschema, data) => {
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

      let propertySchemaValidator = asyncValidator.compile(schema);
      let errors: string[] = new Array<string>();
      extractedQueryParams.forEach((param) => {
        propertySchemaValidator(param)
          .then((e) => {
            // data is valid, do nothing
          })
          .catch((err) => {
            if (!(err instanceof ajvasync.ValidationError)) {
              throw err;
            }
            // data is invalid
            console.log("Validation errors:", err.errors);
            errors.push(err.errors);
          });
      });

      console.log("GOT HERE");
      console.log(errors);
      console.log("GOT HERE");
      console.log(schema);
      console.log("GOT HERE");
      console.log(extractedQueryParams);
      console.log("GOT HERE");
      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve();
      }
    });
  }

  private static validateOperationAgainstType(type: any[], queryElement: Query.ITerm): [boolean, string] {
    let propType = type[queryElement.property];
    let op = queryElement.operation;
    let allowed = Query.ALLOWED_OPERATORS.default;

    if (propType in Query.ALLOWED_OPERATORS) {
      allowed = Query.ALLOWED_OPERATORS[propType];
    }

    if (op in allowed) {
      return [true, ""];
    }

    return [false, `Operator must be one of ${allowed} for ${propType}`];
  }
}
