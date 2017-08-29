import { Collection } from "../definitions/collection/collection";
import { CatalogRepository } from "../repository/catalogRepository";

import * as ajv from "ajv";
import * as ajvasync from "ajv-async";
import * as flat from "flat";
import * as jsonPointer from "json-pointer";
import * as ValidationHelper from "../validation/validationHelper";

export class QueryValidator {
  constructor() { }

  public validateQuery(req: any, collection: Collection): Promise<string[]> {
    let promise = new Promise((resolve, reject) => {
      // process request into a json representation of the values
      let coerced: any = this.coerceQueryToRepresentation(req);

      this.validateQueryToPropertiesSchema(coerced, collection)
        .then((e) => { this.validateQueryToValidOperations(coerced, req, collection) })
        .then((e) => { resolve() })
        .catch((e) => {
          reject(e);
        });
    });
    return promise;
  }

  private coerceQueryToRepresentation(query: any): any {
    Object.keys(query).forEach(element => {
      if ("_value" in query["element"]) {
        query[element] = query[element]["_value"];
      } else {
        query[element] = this.coerceQueryToRepresentation(query[element])
      }
    });

    return query;
  }

  private validateQueryToValidOperations(coerced: any, req: any, collection: Collection): Promise<string[]> {
    let promise = new Promise((resolve, reject) => {
      let coerced_flattened = flat.flatten(coerced);
      let raw_flattened = flat.flatten(req);

      for (let key in Object.keys(coerced_flattened)) {
        this.navigateToDef(req, key.split("."));
      }
    })
    return promise;
  }


  private navigateToDef(schema: any, path: string[]): any {
    let keys = Object.keys(schema);
    let currentPointer = "";
    let obj = jsonPointer.get(schema, "/");

    for (let segment in path) {
      currentPointer = `${currentPointer}/${segment}`;
      obj = jsonPointer.get(schema, currentPointer);

      if (obj['type'] == 'object' && 'properties' in obj) {
        currentPointer = `${currentPointer}/properties`
      } else {
        throw new Error('Expected AJV Schema')
      }
    }

    return obj;
  }

  private validateQueryToPropertiesSchema(res: any, collection: Collection): Promise<string[]> {
    let schema: any = this.removeRequires(collection.productsSchema);
    let validator = ajv({ allErrors: true, formats: 'full' });
    let asyncValidator = ajvasync(validator);

    let querySchemaValidator = asyncValidator.compile(schema);
    let errors: string[] = new Array<string>();

    let promise = new Promise((resolve, reject) => {
      querySchemaValidator(res)
        .then(resolve(errors))
        .catch(e => {
          reject(ValidationHelper.reduceErrors(e, 'query'))
        });
    });

    return promise;
  }

  private removeRequires(schema: any): any {
    // Remove any requires statements so we can validate on types only
    schema = this.removeRequiresInObject(schema);

    if ('definitions' in schema) {
      schema['definitions'] = this.removeRequiresInDefinitions(schema['definitions']);
    }

    return schema;
  }

  private removeRequiresInDefinitions(schema: any): any {
    for (let definition in schema) {
      if ('type' in schema[definition] && schema[definition]['type'] == 'object') {
        if ('required' in schema[definition]) {
          delete schema[definition]['required']
        }
        schema[definition] = this.removeRequiresInObject(schema[definition])
      } else {
        schema[definition] = this.removeRequiresInDefinitions(schema[definition])
      }
    }
    return schema;
  }

  private removeRequiresInObject(schema: any): any {
    if ('type' in schema && schema['type'] == 'object') {
      if ('required' in schema) {
        delete schema['required'];
      }

      for (let property in Object.keys(schema['properties'])) {
        schema['property'] = this.removeRequiresInObject(schema['properties'][property]);
      }
    }

    return schema;
  }
}
