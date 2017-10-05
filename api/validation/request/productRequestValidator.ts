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

      if (this.validCollectionNameFormat(query, errors)) {
        catalogRepository.getCollection(query.collection).then((collection) => {
          if (collection == undefined) {
            errors.push("searchParam | collection must exist")
            reject(errors);
          } else {

            if (query.footprint !== "") {
              this.validateFootprint(query.footprint, errors);
            }

            if (query.spatialop !== "") {
              this.validateSpatialOp(query.spatialop, errors);
            }

            if (query.terms.length > 0 && this.validateTermStructure(query.terms, errors)) {
              query.types = this.extractQueryDataTypes(collection.productsSchema, query)
              let validationSchema = this.getValidationSchema(collection.productsSchema);
              let queryValues = this.getQueryValues(query.terms);

              this.validateQueryValues(validationSchema, queryValues).then(() => {
                this.validateQueryOperations(query, errors)

                if (errors.length > 0) {
                  reject(errors);
                } else {
                  resolve(errors);
                }
              }).catch((valueErrors) => {
                reject(errors.concat(valueErrors))
              })

            } else {
              if (errors.length > 0) {
                reject(errors);
              } else {
                resolve(errors);
              }
            }
          }

        })
      } else {
        reject(errors);
      }
    });
  }

  private static validateTermStructure(terms: ITerm[], errors: string[]): boolean {
    let valid = true

    terms.forEach((term, index)=> {
      let p = `query.terms[${index}]`

      if(!term.property) {
        errors.push(`${p} | A property must be defined`)
        valid = false
      }

      if(!term.operation) {
        errors.push(`${p} | An operation must be defined`)
        valid = false
      }

      if(!term.value) {
        errors.push(`${p} | A value must be defined`)
        valid = false
      }
    })

    return valid
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
        let errormsg = `${term.property} | Operator must be `
        if (allowed.length > 1) {
          errormsg = errormsg.concat(`one of ${allowed.reduce((x, y) => { return `${x},${y}` })} `)
        } else {
          errormsg = errormsg.concat(`${allowed[0]} `)
        }
        errormsg = errormsg.concat(`for ${propType}`)
        errors.push(errormsg)
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
  private static validateQueryValues(schema: any, extractedQueryParams: any[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let validator = ValidatorFactory.getValidator();
      let propertySchemaValidator = validator.compile(schema);
      let promisedValidations: Promise<any>[] = []
      let errors: string[] = []

      extractedQueryParams.forEach((param) => {
        let promisedResult = propertySchemaValidator(param);
        promisedValidations.push(promisedResult);
      });

      // Allows us to catch all promise failures from the Promise.all command below,
      // returns array of resolved promises, errors appear as arrays, resolved promises
      // return as any;
      // https://stackoverflow.com/questions/40851454/is-it-possible-to-catch-all-rejected-promises-in-promise-all
      let caughtPromises = promisedValidations.map(promise => promise.catch((x) => x.errors));

      Promise.all(caughtPromises)
        .then(results => {
          results.filter(x => x instanceof Array)
            .forEach((e) => {
              let msgs = ValidationHelper.reduceErrors(e)
              msgs.forEach((m) => errors.push(m))
            })

          if (errors.length > 0) {
            reject(errors)
          } else {
            resolve(errors)
          }
        })
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

  it("should not validate a term without a property defined", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "",
        operation: "=",
        value: "some value"
      }]
    }), mockRepo)).to.be.rejected
    .and.eventually.have.lengthOf(1)
    .and.contain("query.terms[0] | A property must be defined")
  })

  it("should not validate a term without an operator defined", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "stringType",
        operation: "",
        value: "some value"
      }]
    }), mockRepo)).to.be.rejected
    .and.eventually.have.lengthOf(1)
    .and.contain("query.terms[0] | An operation must be defined")
  })

  it("should not validate a term without a value defined", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "stringType",
        operation: "=",
        value: ""
      }]
    }), mockRepo)).to.be.rejected
    .and.eventually.have.lengthOf(1)
    .and.contain("query.terms[0] | A value must be defined")
  })

  it("should validate a string term with an = operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "stringType",
        operation: "=",
        value: "some value"
      }]
    }), mockRepo)).to.be.fulfilled
      .and.eventually.be.an('array').that.is.empty;
  })

  it("should not validate a string term with other operators", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=<", "<"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p, {
        terms: [{
          property: "stringType",
          operation: op,
          value: "some value"
        }]
      }), mockRepo))
    });

    return chai.expect(Promise.all(results)).to.be.rejected;
  });

  it("should not validate a string term with an invalid operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "stringType",
        operation: "invalidOp",
        value: "some value"
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('stringType | Operator must be = for string');
  })

  it("should validate a date term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p, {
        terms: [{
          property: "dateType",
          operation: op,
          value: "2016-10-07"
        }]
      }), mockRepo))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate a date term with an invalid operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "dateType",
        operation: "invalidOp",
        value: "2016-10-07"
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('dateType | Operator must be one of >,>=,=,=<,< for date');
  })

  it("should not validate a date term with an invalid date", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "dateType",
        operation: "=",
        value: "not a date"
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(2)
      .and.contain('dateType | should match format "date"')
      .and.contain('dateType | should pass "fullDateValidation" keyword validation')
  })

  it("should validate a datetime term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p, {
        terms: [{
          property: "dateTimeType",
          operation: op,
          value: "2016-10-07T00:00:00Z"
        }]
      }), mockRepo))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate a datetime term with an invalid operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "dateTimeType",
        operation: "invalidOp",
        value: "2016-10-07T00:00:00Z"
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('dateTimeType | Operator must be one of >,>=,=,=<,< for date-time');
  })

  it("should not validate a datetime term with an invalid datetime", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "dateTimeType",
        operation: "=",
        value: "2016-10-07"
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('dateTimeType | should match format "date-time"');
  })

  it("should validate an int term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p, {
        terms: [{
          property: "intType",
          operation: op,
          value: 234
        }]
      }), mockRepo))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate an int term with an invalid operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "intType",
        operation: "!=",
        value: 234
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('intType | Operator must be one of >,>=,=,=<,< for int');
  })

  it("should not validate an int term with an invalid int", () => {

    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "intType",
        operation: "=",
        value: 12.5
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('intType | should be integer');
  })

  it("should validate a number term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      results.push(ProductRequestValidator.validate(new Query(p, {
        terms: [{
          property: "numberType",
          operation: op,
          value: 34.34
        }]
      }), mockRepo))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate a number term with an invalid operator", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "numberType",
        operation: ">>",
        value: 34.34
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('numberType | Operator must be one of >,>=,=,=<,< for double');
  })

  it("should not validate a number term with an invalid number", () => {
    return chai.expect(ProductRequestValidator.validate(new Query(p, {
      terms: [{
        property: "numberType",
        operation: "=",
        value: "1234x"
      }]
    }), mockRepo)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('numberType | should be number');
  });
});
