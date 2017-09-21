import * as chai from "chai"; // test reqs
import * as chaiAsPromised from "chai-as-promised";
import "mocha"; // test reqs

import { Query } from "../../query";
import { CatalogRepository } from "../../repository/catalogRepository";
import { Fixtures } from "../../test/fixtures";
import { RequestValidator } from "./requestValidator";

export class CollectionRequestValidator extends RequestValidator {
  public static validate(query: Query, catalogRepository: CatalogRepository): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let errors: string[] = [];

      if (!query.collection.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
        reject(['searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"']);
      }
      if (query.footprint !== "") {
        this.validateFootprint(query.footprint, errors);
      }
      if (query.spatialop !== "") {
        this.validateSpatialOp(query.spatialop, errors);
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve(errors);
      }
    });
  }
}

describe("Collection Request Validator", () => {
  let p = "*test/valid/pat*h/1/2/345aa*";
  let mockRepo = Fixtures.GetMockRepo().object;

  it("should validate a valid search path", () => {
    return chai.expect(CollectionRequestValidator.validate(new Query(p, {}), mockRepo))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });

  it("should not validate an invalid search path", () => {
    let reqParam = "\\\\test/inv%%alid/path/1/2/345aa";
    return chai.expect(CollectionRequestValidator.validate(new Query(reqParam, {}), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain(
      'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
  });

  it("should validate a valid spatialOp", () => {
    ["within", "intersects", "overlaps"].forEach((x) => {
      return chai.expect(CollectionRequestValidator.validate(new Query(p, { spatialop: x }), mockRepo))
        .to.be.fulfilled
        .and.eventually.be.an("array").that.is.empty;
    });
  });

  it("should not validate an invalid spatialOp", () => {
    return chai.expect(CollectionRequestValidator.validate(new Query(p, { spatialop: "bobbins" }), mockRepo))
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

    return chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
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

    return chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
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

    return chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.contain("footprint | is not a closed polygon");
  });

  // it("should validate a valid fromCaptureDate", () => {
  //   ["2014-01-04",
  //     "2014-01-05T06:34:23Z"].forEach((x) => {
  //       chai.expect(
  //         CollectionRequestValidator.validate(new Query(p, { fromCaptureDate: x, toCaptureDate: "2017-01-01" }), mockRepo))
  //         .to.be.empty;
  //     });
  // });

  // it("should validate a valid toCaptureDate", () => {
  //   ["2014-01-04",
  //     "2014-01-05T06:34:23Z"].forEach((x) => {
  //       chai.expect(
  //         RequestValidator.validate(new Query(p, { fromCaptureDate: "2010-01-01", toCaptureDate: x }), mockRepo))
  //         .to.be.empty;
  //     });
  // });

  // it("should not validate and improperly formated capture date", () => {
  //   chai.expect(
  //     RequestValidator.validate(new Query(p, { fromCaptureDate: "01-01-2012", toCaptureDate: "2016-01-01" }), mockRepo))
  //     .to.have.length(1)
  //     .and.contain("fromCaptureDate | is not a valid date time format");
  // });

  // it("should not validate an invalid date", () => {
  //   chai.expect(
  //     RequestValidator.validate(new Query(p, { fromCaptureDate: "2015-02-29", toCaptureDate: "2016-01-01" }), mockRepo))
  //     .to.have.length(1)
  //     .and.contain("fromCaptureDate | is not a valid date");
  // });

  // it("should not validate a fromCaptureDate without a toCaptureDate", () => {
  //   chai.expect(RequestValidator.validate(new Query(p, { fromCaptureDate: "2016-01-01" }), mockRepo))
  //     .to.have.length(1)
  //     .and.contain("toCaptureDate | both a from and to capture date must be specified");
  // });

  // it("should not validate a toCaptureDate without a fromCaptureDate", () => {
  //   chai.expect(RequestValidator.validate(new Query(p, { toCaptureDate: "2016-01-01" }), mockRepo))
  //     .to.have.length(1)
  //     .and.contain("fromCaptureDate | both a from and to capture date must be specified");
  // });

  // it("should not validate a toCaptureDate before a fromCaptureDate", () => {
  //   chai.expect(
  //     RequestValidator.validate(new Query(p, { toCaptureDate: "2016-01-01", fromCaptureDate: "2017-01-01" }), mockRepo))
  //     .to.have.length(1)
  //     .and.contain("fromCaptureDate | toCaptureDate must be greater than or equal to fromCaptureDate");
  // });
});
