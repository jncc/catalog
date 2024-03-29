
import { ProductQuery, ITerm, ALLOWED_OPERATORS } from "../../query/productQuery";
import { CollectionStore } from "../../repository/collectionStore";
import { RequestValidator } from "./requestValidator";
import * as ValidationHelper from "../validationHelper";
import * as ValidatorFactory from "../validatorFactory";

import "mocha"; // test reqs
import "mocha-inline"; // test reqs
import * as chai from "chai"; // test reqs
import * as chaiAsPromised from "chai-as-promised"; // test reqs
import { Fixtures } from "../../test/fixtures";
import * as TypeMoq from "typemoq";



export class ProductRequestValidator extends RequestValidator {
  collectionStore: CollectionStore;

  constructor(collectionStore: CollectionStore) {
    super();
    this.collectionStore = collectionStore
  }

  public async validate(query: ProductQuery): Promise<string[]> {

    return new Promise<string[]>(async (resolve, reject) => {
      let errors: string[] = [];

      if (query.collections.length == 0) {
        errors.push("searchParam | collections must be defined")
        reject(errors);
      } else {
        for (let name of query.collections) {
          if (name.match(/^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$/)) {
            let collection = await this.collectionStore.getCollection(name);
            if (collection === undefined) {
              errors.push(`searchParam | collection ${name} does not exist`)
            }
          } else {
            errors.push(`searchParam | collection ${name} should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"`)
          }
        }
      }

      if (errors.length > 0) {
        reject(errors);
        return;
      }

      if (query.collections.length > 1) {
        let count = await this.collectionStore.countCollectionsWithNonMatchingProductSchema(query.collections)

        if (count > 0) {
          errors.push("searchParam | all collections must have the same product schema");
        }
      }

      if (query.footprint !== "") {
        this.validateFootprint(query.footprint, errors);
      }

      if (query.spatialop !== "") {
        this.validateSpatialOp(query.spatialop, errors);
      }

      if (errors.length > 0) {
        reject(errors);
        return;
      }

      let productsSchema = {};
      let firstCollection = await this.collectionStore.getCollection(query.collections[0])

      if (firstCollection == undefined) {
        throw new Error("searchParam | Error getting product property schema");
      } else {
        productsSchema = firstCollection.productsSchema;
      }

      if (query.terms.length > 0 && this.validateTermStructure(query.terms, errors)) {
        query.types = this.extractQueryDataTypes(productsSchema, query)
        let validationSchema = this.getValidationSchema(productsSchema);
        let queryValues = this.getQueryValues(query.terms);

        try {
          await this.validateQueryValues(validationSchema, queryValues)
        } catch (queryValueErrors) {
          errors = errors.concat(queryValueErrors as string[]);
          reject(errors);
          return;
        }

        this.validateQueryOperations(query, errors);
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve(errors);
      }
    });
  }

  private validateTermStructure(terms: ITerm[], errors: string[]): boolean {
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

  private extractQueryDataTypes(schema: any, query: ProductQuery): any {
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

  private validateQueryOperations(query: ProductQuery, errors: string[]) {
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
  private getValidationSchema(schema: any) {
    delete schema.required;
    return schema;
  }

  /**
   * Extracts each query param as an individual element to be validated individually
   *
   * @param params A JSON object containing the query params
   * @returns An array of individual JSON objects to be validated
   */
  private getQueryValues(params: ITerm[]) {
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

  private validateQueryValues(schema: any, extractedQueryParams: any[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let validator = ValidatorFactory.getValidator(schema.$schema);
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
  let q = {};
  let mockRepo  = Fixtures.GetMockCollectionStore()
  let repo = mockRepo.object
  let validator = new ProductRequestValidator(repo);

  beforeEach(() => {
    q = {collections: ["test/valid/path/1/2/345aa"]};
  })

  it("should validate a valid array of collections", () => {
    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });

  it("should not validate a collection name containing wildcards", () => {
    let qstar = {collections: ["*test/valid/pat*h/1/2/345aa*"]};
    return chai.expect(validator.validate(new ProductQuery(qstar)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain(
      'searchParam | collection *test/valid/pat*h/1/2/345aa* should be a path matching the pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"');
  });

  it("should not validate an invalid collection name", () => {
    let qWrong = {collections: ["\\\\test/inv%%alid/path/1/2/345aa"]};
    return chai.expect(validator.validate(new ProductQuery(qWrong)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain(
      'searchParam | collection \\\\test/inv%%alid/path/1/2/345aa should be a path matching the pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"');
  });

  it("should return multiple errors for multiple invalid collection names", () => {
    let q = {collections: ["test/valid/path/1/2/345aa", "*test/valid/pat*h/1/2/345aa*", "\\\\test/inv%%alid/path/1/2/345aa"]}

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(2)
      .and.contain(
      'searchParam | collection \\\\test/inv%%alid/path/1/2/345aa should be a path matching the pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"')
      .and.contain(
        'searchParam | collection *test/valid/pat*h/1/2/345aa* should be a path matching the pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"');
  });

  it("should validate a set of collections whose the product schemas match", () => {
    let q = {collections: ["test/valid/path/1/2/345a", "test/valid/path/1/2/345b"]}

    return chai.expect(validator.validate(new ProductQuery(q))).to.be.fulfilled;
  });

  it("should not validate a set of collections whose product schema do not match", () => {
    let q = {collections: ["test/valid/path/1/2/345a", "test/valid/path/1/2/345b"]}

    //void existing mock definition.
    void(mockRepo.object.countCollectionsWithNonMatchingProductSchema(["x"]));

    mockRepo.setup((x) => x.countCollectionsWithNonMatchingProductSchema(TypeMoq.It.isAny())).returns((x, y) => {
      return Promise.resolve(1);
    })

    let v = new ProductRequestValidator(mockRepo.object);

    return chai.expect(v.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.be.an("array")
      .that.has.lengthOf(1)
      .and.contain("searchParam | all collections must have the same product schema")

  });

  it("should validate a valid spatialOp", () => {
    let results: Promise<string[]>[] = [];
    ["within", "intersects", "overlaps"].forEach((op) => {
      q["spatialop"] = op
      results.push(validator.validate(new ProductQuery(q)))
    })

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate an invalid spatialOp", () => {
    q["spatialop"] = "bobbins"
    return chai.expect(validator.validate(new ProductQuery(q)))
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

    q["footprint"] = footprint;

    return chai.expect(validator.validate(new ProductQuery(q)))
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

    q["footprint"] = footprint;

    return chai.expect(validator.validate(new ProductQuery(q)))
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

    q["footprint"] = footprint;
    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain("footprint | is not a closed polygon");
  });

  it("should not validate a term without a property defined", () => {
    q["terms"] = [{
      property: "",
      operation: "=",
      value: "some value"
    }]
    return chai.expect(validator.validate(new ProductQuery(q))).to.be.rejected
    .and.eventually.have.lengthOf(1)
    .and.contain("query.terms[0] | A property must be defined")
  })

  it("should not validate a term without an operator defined", () => {
    q["terms"] = [{
      property: "stringType",
      operation: "",
      value: "some value"
    }]
    return chai.expect(validator.validate(new ProductQuery(q)))
    .to.be.rejected
    .and.eventually.have.lengthOf(1)
    .and.contain("query.terms[0] | An operation must be defined")
  })

  it("should not validate a term without a value defined", () => {
    q["terms"] = [{
      property: "stringType",
      operation: "=",
      value: ""
    }]
    return chai.expect(validator.validate(new ProductQuery(q)))
    .to.be.rejected
    .and.eventually.have.lengthOf(1)
    .and.contain("query.terms[0] | A value must be defined")
  })

  it("should validate a string term with an = operator", () => {
    q["terms"] = [{
      property: "stringType",
      operation: "=",
      value: "some value"
    }]
    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.fulfilled
      .and.eventually.be.an('array').that.is.empty;
  })

  it("should not validate a string term with other operators", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=<", "<"].forEach((op) => {
      q["terms"] = [{
        property: "stringType",
        operation: op,
        value: "some value"
      }]

      results.push(validator.validate(new ProductQuery(q)))
    });

    return chai.expect(Promise.all(results)).to.be.rejected;
  });

  it("should not validate a string term with an invalid operator", () => {
    q["terms"] = [{
      property: "stringType",
      operation: "invalidOp",
      value: "some value"
    }]
    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('stringType | Operator must be = for string');
  })

  it("should validate a date term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      q["terms"] = [{
        property: "dateType",
        operation: op,
        value: "2016-10-07"
      }]

      results.push(validator.validate(new ProductQuery(q)))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate a date term with an invalid operator", () => {
    q["terms"] = [{
      property: "dateType",
      operation: "invalidOp",
      value: "2016-10-07"
    }]
    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('dateType | Operator must be one of >,>=,=,=<,< for date');
  })

  it("should not validate a date term with an invalid date", () => {
    q["terms"] = [{
      property: "dateType",
      operation: "=",
      value: "not a date"
    }]
    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(2)
      .and.contain('dateType | should match format "date"')
      .and.contain('dateType | should pass "fullDateValidation" keyword validation')
  })

  it("should validate a datetime term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      q["terms"] = [{
        property: "dateTimeType",
        operation: op,
        value: "2016-10-07T00:00:00Z"
      }]

      results.push(validator.validate(new ProductQuery(q)))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate a datetime term with an invalid operator", () => {
    q["terms"] = [{
      property: "dateTimeType",
      operation: "invalidOp",
      value: "2016-10-07T00:00:00Z"
    }]

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('dateTimeType | Operator must be one of >,>=,=,=<,< for date-time');
  })

  it("should not validate a datetime term with an invalid datetime", () => {
    q["terms"] = [{
      property: "dateTimeType",
      operation: "=",
      value: "2016-10-07"
    }]

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('dateTimeType | should match format "date-time"');
  })

  it("should validate an int term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      q["terms"] = [{
        property: "intType",
        operation: op,
        value: 234
      }]

      results.push(validator.validate(new ProductQuery(q)))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate an int term with an invalid operator", () => {
    q["terms"] = [{
      property: "intType",
      operation: "!=",
      value: 234
    }]

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('intType | Operator must be one of >,>=,=,=<,< for int');
  })

  it("should not validate an int term with an invalid int", () => {

    q["terms"] = [{
      property: "intType",
      operation: "=",
      value: 12.5
    }]

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('intType | should be integer');
  })

  it("should validate a number term with a valid operator", () => {
    let results: Promise<string[]>[] = [];

    [">", ">=", "=", "=<", "<"].forEach((op) => {
      q["terms"] = [{
        property: "numberType",
        operation: op,
        value: 34.34
      }]

      results.push(validator.validate(new ProductQuery(q)))
    });

    return chai.expect(Promise.all(results)).to.be.fulfilled;
  });

  it("should not validate a number term with an invalid operator", () => {
    q["terms"] = [{
      property: "numberType",
      operation: ">>",
      value: 34.34
    }]

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('numberType | Operator must be one of >,>=,=,=<,< for double');
  })

  it("should not validate a number term with an invalid number", () => {
    q["terms"] = [{
      property: "numberType",
      operation: "=",
      value: "1234x"
    }]

    return chai.expect(validator.validate(new ProductQuery(q)))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain('numberType | should be number');
  });
});
