import * as ajv from 'ajv';
import * as ajvasync from 'ajv-async';
import * as ValidationHelper from "../validation/validationHelper"

import { DateValidator } from "../validation/dateValidator"


export class QueryProcessor {

  constructor() {

  }

  /**
   * Returns the properties validation schema for this collection without a required
   * block so that individual elements can be validated
   *
   * @param schema The base properties schema of a collection
   * @returns A JSON schema for use in validating individual query parameters
   */
  private getValidationSchema(schema: any) {
    delete schema['required'];
    return schema;
  }

  /**
   * Extracts each query param as an individual element to be validated individually
   *
   * @param params A JSON object containing the query params
   * @returns An array of individual JSON objects to be validated
   */
  private getExtractedQueryParams(params: any) {
    let extracted: any[] = []

    for (let param in params) {
      let current = {};
      current[param['p']] = param['t'];
      extracted.push(current);
    }

    return extracted;
  }

  private validateExtractedQueryParams(schema: any, extractedQueryParams: any[]) {
    let validator = ajv({ allErrors: true, formats: 'full' });
    let asyncValidator = ajvasync(validator);

    asyncValidator.addKeyword('fullDateValidation', {
      type: 'string',
      errors: true,
      validate: (schema, data) => {
        //todo: Get real errors into avj error list.
        var errors: string[] = []
        DateValidator.validateDate(data, '', errors)

        if (errors.length > 0) {
          return false
        } else {
          return true
        }
      }
    });

    let propertySchemaValidator = asyncValidator.compile(schema);
    let errors: string[] = new Array<string>();

    extractedQueryParams.forEach(param => {
      let promise = new Promise((resolve, reject) => {
        propertySchemaValidator(param)
          .then(e => {
            if (errors.length == 0) {
              resolve(errors);
            } else {
              reject(errors);
            }
          })
          .catch(e => {
            if ('errors' in e) {
              // Return from an AJV promise
              errors = errors.concat(ValidationHelper.reduceErrors(e.errors));
            } else {
              // Return from a nonSchemaValidation promise
              errors = errors.concat(e);
            }
            reject(errors);
          })
      });

      promise.then
    });
  }


}
