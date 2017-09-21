import * as chai from "chai"; // test reqs
import * as chaiAsPromised from "chai-as-promised";
import "mocha"; // test reqs

import { Query } from "../../query";
import { CatalogRepository } from "../../repository/catalogRepository";
import { Fixtures } from "../../test/fixtures";
import { QueryValidator } from "../queryValidator";
import { RequestValidator } from "./requestValidator";

export class ProductRequestValidator extends RequestValidator {
  public static validate(query: Query, catalogRepository: CatalogRepository): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let errors: string[] = [];

      if (!query.collection.match(/^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$/)) {
        // tslint:disable-next-line:max-line-length
        errors.push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"');
      }
      if (query.footprint !== "") {
        this.validateFootprint(query.footprint, errors);
      }
      if (query.spatialop !== "") {
        this.validateSpatialOp(query.spatialop, errors);
      }

      if (query.terms.length > 0) {
        catalogRepository.getCollection(query.collection).then((collection) => {
          if (collection !== undefined) {
            query.types = QueryValidator.extractQueryDataTypes(collection.productsSchema, query);
            QueryValidator.validateQueryParams(collection.productsSchema, query.terms).then((x) => {
              resolve(errors);
            }).catch((err) => {
              reject(errors.concat(err));
            });
          } else {
            reject(["searchParam | collection must exist"]);
          }
        });
      } else {
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve(errors);
        }
      }
    });
  }
}

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
    ["within", "intersects", "overlaps"].forEach((x) => {
      return chai.expect(ProductRequestValidator.validate(new Query(p, { spatialop: x }), mockRepo))
        .to.be.fulfilled
        .and.eventually.an("array").that.is.empty;
    });
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
});
