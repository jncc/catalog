import "mocha"; // test reqs
import "mocha-inline";
import * as chai from "chai"; // test reqs
import * as chaiAsPromised from "chai-as-promised";

import { Fixtures } from "../../test/fixtures";
import { RequestValidator } from "./requestValidator";
import { CollectionQuery } from "../../query/collectionQuery";

export class CollectionRequestValidator extends RequestValidator {
  public static validate(query: CollectionQuery): string[] {
    let errors: string[] = []

    if (!query.collection.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
      errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"')
    }

    return errors;
  }
}

// Test setup
// tslint:disable-next-line:no-var-requires
// chai.use(chaiAsPromised);

// describe("Collection Request Validator", () => {
//   let p = "*test/valid/pat*h/1/2/345aa*";
//   let mockRepo = Fixtures.GetMockProductQueries().object;

//   it("should validate a valid search path", () => {
//     return chai.expect(CollectionRequestValidator.validate(new Query(p, {}), mockRepo))
//       .to.be.fulfilled
//       .and.eventually.be.an("array").that.is.empty;
//   });

//   it("should not validate an invalid search path", () => {
//     let reqParam = "\\\\test/inv%%alid/path/1/2/345aa";
//     return chai.expect(CollectionRequestValidator.validate(new Query(reqParam, {}), mockRepo))
//       .to.be.rejected
//       .and.eventually.have.lengthOf(1)
//       .and.contain(
//       'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
//   });

//   it("should validate a valid spatialOp", () => {
//     let results: Promise<string[]>[] = [];
//     ["within", "intersects", "overlaps"].forEach((op) => {
//       results.push(CollectionRequestValidator.validate(new Query(p, { spatialop: op }), mockRepo))
//     })

//     return chai.expect(Promise.all(results)).to.be.fulfilled;
//   });

//   it("should not validate an invalid spatialOp", () => {
//     return chai.expect(CollectionRequestValidator.validate(new Query(p, { spatialop: "bobbins" }), mockRepo))
//       .to.be.rejected
//       .and.eventually.have.lengthOf(1)
//       .and.contain("spatialop | should be one of 'within', 'intersects', 'overlaps'");
//   });

//   it("should validate a valid WKT footprint", () => {
//     let footprint =
//       "POLYGON((-2.2043681144714355 53.692260240428965," +
//       "-2.203187942504883 53.692260240428965," +
//       "-2.203187942504883 53.691726603500705," +
//       "-2.2043681144714355 53.691726603500705," +
//       "-2.2043681144714355 53.692260240428965))";

//     return chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
//       .to.be.fulfilled
//       .and.eventually.be.an("array").that.is.empty;
//   });

//   it("should not validate an ivalid WKT footprint", () => {
//     let footprint =
//       "POLYGON((-2.2043681144714355 53.692260240428965," +
//       "-2.203187942504883 53.692260240428965," +
//       "-2.203187942504883 53.691726603500705," +
//       "-2.2043681144714355 53.691726603500705," +
//       "-2.2043681144714355))";

//     return chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
//       .to.be.rejected
//       .and.eventually.have.lengthOf(1)
//       .and.contain("footprint | is not valid WKT");
//   });

//   it("should not validate a WKT footprint that is not a closed polygon", () => {
//     let footprint =
//       "POLYGON((-2.2043681144714355 53.692260240428965," +
//       "-2.203187942504883 53.692260240428965," +
//       "-2.203187942504883 53.691726603500705," +
//       "-2.2043681144714355 53.691726603500705))";

//     return chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
//       .to.be.rejected
//       .and.eventually.have.lengthOf(1)
//       .and.contain("footprint | is not a closed polygon");
//   });
// });
