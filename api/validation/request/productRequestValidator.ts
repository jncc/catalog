import "mocha"; // test reqs
import "mocha-inline"; // test reqs
import * as chai from "chai"; // test reqs
import * as chaiAsPromised from "chai-as-promised"; // test reqs

import { Query, ITerm, ALLOWED_OPERATORS } from "../../query";
import { CatalogRepository } from "../../repository/catalogRepository";
import { Fixtures } from "../../test/fixtures";
import { RequestValidator } from "./requestValidator";
import * as ValidationHelper from "../validationHelper";
import * as ValidatorFactory from "../validatorFactory";
import { ICollection } from "../../definitions/collection/collection"

export class ProductRequestValidator extends RequestValidator {
  public static validate(query: Query, catalogRepository: CatalogRepository): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let errors: string[] = [];

      if (this.validCollectionNameFormat(query,errors)) {
        catalogRepository.getCollection(query.collection).then((collection)  => {
          if (collection == undefined) {
            errors.push("searchParam | collection must exist")
          } else {

            if (query.footprint !== "") {
              this.validateFootprint(query.footprint, errors);
            }
      
            if (query.spatialop !== "") {
              this.validateSpatialOp(query.spatialop, errors);
            }
            if (query.terms.length > 0) {
              query.types = this.extractQueryDataTypes(collection.productsSchema, query)
              let validationSchema = this.getValidationSchema(collection.productsSchema);
              let queryValues = this.getQueryValues(query.terms);
              
              this.validateQueryValues(validationSchema, queryValues, errors)
              this.validateQueryOperations(query, errors)
            }
          }

          if (errors.length > 0) {
            reject(errors);
          } else {
            resolve(errors);
          }
        })
      } else {
        reject(errors);
      }
    });
  }
  
  private static validCollectionNameFormat(query: Query, errors: string[]): boolean {
    let isvalid = true
    if (!query.collection.match(/^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$/)) {
      // tslint:disable-next-line:max-line-length
      errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"');
      isvalid = false
    }

    return isvalid;
  }

  private static extractQueryDataTypes(schema: any, query: Query): any {
    let properties = query.terms.map((term) => term.property);
    let tm: any = {};

    properties.filter((item, position) => properties.indexOf(item) === position).forEach((property) => {
      if (schema.properties.hasOwnProperty(property)) {
        if (schema.properties[property].type === "string") {
          if (schema.properties[property].hasOwnProperty("format") && ["date", "date-time"].indexOf(schema.properties[property].format) >= 0) {
            tm[property] = schema.properties[property].format;
          } else {
            tm[property] = "string";
          }
        } else if (schema.properties[property].type === "number") {
          tm[property] = "double";
        } else if (schema.properties[property].type === "integer") {
          tm[property] = "int";
        }
      }
    });

    return tm;
  }

  private static validateQueryOperations(query: Query, errors: string[]) {
    let queryValid: boolean = true;
    let valid: boolean = false;

    query.terms.forEach((term) => {
      let propType = query.types[term.property];
      let op = term.operation;
      let allowed = ALLOWED_OPERATORS.default;

      if (propType in ALLOWED_OPERATORS) {
        allowed = ALLOWED_OPERATORS[propType];
      }
      
      if (allowed.indexOf(op) == -1) {
        errors.push(`${term.property} | Operator must be one of ${allowed} for ${propType}`)
      }
      
    });
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
  private static getQueryValues(params: ITerm[]) {
    let extracted: any[] = [];

    params.forEach((element) => {
      let current = {};
      current[element.property] = element.value;
      extracted.push(current);
    });

    return extracted;
  }

  /**
   * Validates an array of extracted query parameters against a supplied JSON schema, returns
   * a promise for the result of the validation
   *
   * @param schema A properties schema to validate against
   * @param extractedQueryParams An array of extracted query objects
   * @returns A promise, if validation fails, promise is rejected, if it validates then promise is fulfilled
   */
  private static validateQueryValues(schema: any, extractedQueryParams: any[], errors: string[]) {
      let validator = ValidatorFactory.getValidator();

      let propertySchemaValidator = validator.compile(schema);

      extractedQueryParams.forEach((param) => {
        let valid = propertySchemaValidator(param);
        if (!valid) {
          errors.concat(ValidationHelper.reduceErrors(validator.errors, ""));
        }
      });
  }
}

// Test setup
// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);

describe("Product Request Validator", () => {
  let p = "test/valid/path/1/2/345aa";
  let mockRepo = Fixtures.GetMockRepo().object;

  it("should validate a valid search path", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {}), mockRepo))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });

  it("should not validate an wildcard search path", () => {
    let reqParam = "*test/valid/pat*h/1/2/345aa*";
    return chai.expect(ProductRequestValidator.validate(new Query(reqParam, {}), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain(
      'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"');
  });

  it("should not validate an invalid search path", () => {
    let reqParam = "\\\\test/inv%%alid/path/1/2/345aa";
    return chai.expect(ProductRequestValidator.validate(new Query(reqParam, {}), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain(
      'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"');
  });

  it("should validate a valid spatialOp", () => {
    let results: Promise<string[]>[] = [];
    ["within", "intersects", "overlaps"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p, { spatialop: op }), mockRepo))
    })

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate an invalid spatialOp", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, { spatialop: "bobbins" }), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain("spatialop | should be one of 'within', 'intersects', 'overlaps'");
  });

  it("should validate a valid WKT footprint", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705," +
      "-2.2043681144714355 53.692260240428965))";

    return chai.expect(ProductRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });

  it("should not validate an ivalid WKT footprint", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705," +
      "-2.2043681144714355))";

    return chai.expect(ProductRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain("footprint | is not valid WKT");
  });

  it("should not validate a WKT footprint that is not a closed polygon", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705))";

    return chai.expect(ProductRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain("footprint | is not a closed polygon");
  });

  it("should validate a date term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p,{ 
        terms: [{ property: "dateType",
                  operation: op,
                  value: "2016-10-07"}] 
      }), mockRepo))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });
  
  it("should not validate a date term with an invalid operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p,{ 
      terms: [{ property: "dateType",
                operation: "invalidOp",
                value: "2016-10-07"}] 
    }), mockRepo)).to.be.rejected;
  })

});
