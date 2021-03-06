import "mocha"; // test reqs
import "mocha-inline";
import * as chai from "chai"; // test reqs
//import * as chaiAsPromised from "chai-as-promised";

import { Fixtures } from "../../test/fixtures";
import { RequestValidator } from "./requestValidator";
import { CollectionQuery } from "../../query/collectionQuery";

export class CollectionRequestValidator extends RequestValidator {
  public static validate(query: CollectionQuery): string[] {
    let errors: string[] = []

    if (query === null || query === undefined) {
      errors.push('searchParam | unable to parse query"')
    } else if (query.collection === "") {
      errors.push('searchParam | collection name pattern is not specified')
    } else if (!query.collection.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
      errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"')
    }

    return errors;
  }
}

// Test setup
// tslint:disable-next-line:no-var-requires
//chai.use(chaiAsPromised);

describe("Collection Request Validator", () => {
  it("should validate a valid search path", () => {
    let query = {
      collection : "*test/valid/pat*h/1/2/345aa*"
    }

    return chai.expect(CollectionRequestValidator.validate(new CollectionQuery(query)))
      .to.be.an("array").that.is.empty;
  });

  it("should not validate a query that does not contain a collection", () => {
    let query = {}

    return chai.expect(CollectionRequestValidator.validate(new CollectionQuery(query)))
      .to.be.an("array").that.has.lengthOf(1)
      .and.contain('searchParam | collection name pattern is not specified')
  });

  it("should not validate an invalid search path", () => {
    let query = {
      collection : "\\\\test/inv%%alid/path/1/2/345aa"
    }

    return chai.expect(CollectionRequestValidator.validate(new CollectionQuery(query)))
      .to.be.an("array").that.has.lengthOf(1)
      .and.contain('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
  });

  // Potentially handle spatial ops in the future to query footprint.
  // it("should validate a valid spatialOp", () => {
  //   let results: string[] = [];
  //   ["within", "intersects", "overlaps"].forEach((op) => {
  //     results.concat(CollectionRequestValidator.validate(new CollectionQuery({ collection: p, spatialop: op })))
  //   })

  //   return chai.expect(results).to.be.an("array").that.is.empty;
  // });

  // it("should not validate an invalid spatialOp", () => {
  //   return chai.expect(CollectionRequestValidator.validate(new CollectionQuery({collection: p, spatialop: "bobbins" })))
  //     .to.be.an("array").that.has.lengthOf(1)
  //     .and.contain("spatialop | should be one of 'within', 'intersects', 'overlaps'");
  // });

  // it("should validate a valid WKT footprint", () => {
  //   let footprint =
  //     "POLYGON((-2.2043681144714355 53.692260240428965," +
  //     "-2.203187942504883 53.692260240428965," +
  //     "-2.203187942504883 53.691726603500705," +
  //     "-2.2043681144714355 53.691726603500705," +
  //     "-2.2043681144714355 53.692260240428965))";

  //   return chai.expect(CollectionRequestValidator.validate(new CollectionQuery({collection: p, footprint: footprint })))
  //     .to.be.fulfilled
  //     .and.eventually.be.an("array").that.is.empty;
  // });

  // it("should not validate an ivalid WKT footprint", () => {
  //   let footprint =
  //     "POLYGON((-2.2043681144714355 53.692260240428965," +
  //     "-2.203187942504883 53.692260240428965," +
  //     "-2.203187942504883 53.691726603500705," +
  //     "-2.2043681144714355 53.691726603500705," +
  //     "-2.2043681144714355))";

  //   return chai.expect(CollectionRequestValidator.validate(new CollectionQuery({collection: p, footprint: footprint })))
  //     .to.be.an("array").that.has.lengthOf(1)
  //     .and.contain("footprint | is not valid WKT");
  // });

  // it("should not validate a WKT footprint that is not a closed polygon", () => {
  //   let footprint =
  //     "POLYGON((-2.2043681144714355 53.692260240428965," +
  //     "-2.203187942504883 53.692260240428965," +
  //     "-2.203187942504883 53.691726603500705," +
  //     "-2.2043681144714355 53.691726603500705))";

  //   return chai.expect(CollectionRequestValidator.validate(new CollectionQuery({collection: p,  footprint: footprint })))
  //     .to.be.an("array").that.has.lengthOf(1)
  //     .and.contain("footprint | is not a closed polygon");
  // });
});
