import * as chai from "chai"; // test reqs
import * as geojson from "geojson";
import "mocha"; // test reqs
import * as wellknown from "wellknown";

import { Query } from "../query";
import { CatalogRepository } from "../repository/catalogRepository";
import { Fixtures } from "../test/fixtures";
import { DateValidator } from "./dateValidator";
import { QueryValidator } from "./queryValidator";
import mochainline = require("mocha-inline");

export abstract class RequestValidator {
  // public static validate(query: Query, catalogRepository: CatalogRepository): string[] {
  //   let errors: string[] = [];

  //   this.validateRequestParameter(query, errors);
  //   if (query.footprint !== "") {
  //     this.validateFootprint(query.footprint, errors);
  //   }
  //   if (query.spatialop !== "") {
  //     this.validateSpatialOp(query.spatialop, errors);
  //   }

  //   if (query.properties.length > 0) {
  //     if (query.types.empty) {
  //       //
  //       catalogRepository.getCollection(query.collection).then((collection) => {
  //         if (collection !== undefined) {
  //           // extract data types from schema
  //           query.types = QueryValidator.extractQueryDataTypes(collection.productsSchema, query);
  //           let typesErrors = QueryValidator.validateExtractedDataTypes(query, query.types);

  //           // validate current operators against schema
  //           if (typesErrors.length > 0) {
  //             errors.concat(typesErrors);
  //           }

  //           QueryValidator.validateQueryParams(collection.productsSchema, query.properties).then((x) => {
  //             // query params valid for this schema
  //           }).catch((err) => {
  //             // query params not valid for this schema
  //             errors.concat(err);
  //           });
  //         } else {
  //           // do not found stuff
  //         }
  //       });
  //     }
  //     // Need to validate the properties blob
  //     // QueryValidator.extractQueryDataTypes()
  //   }

  //   // if(!dates.valueError && (dates.fromCaptureDate || dates.toCaptureDate)) this.validateCaptureDates(dates, errors)

  //   return errors;
  // }

  // private static validateCaptureDates(dates : CaptureDateRange, errors: string[]): Boolean {
  //   let isValid = true

  //   if(!dates.fromCaptureDate && dates.toCaptureDate) {
  //     errors.push('fromCaptureDate | both a from and to capture date must be specified')
  //     isValid = false
  //   } else if(dates.fromCaptureDate && !dates.toCaptureDate) {
  //     errors.push('toCaptureDate | both a from and to capture date must be specified')
  //     isValid = false
  //   } else if(dates.fromCaptureDate && dates.toCaptureDate && ! (dates.toCaptureDate >= dates.fromCaptureDate)){
  //     errors.push('fromCaptureDate | toCaptureDate must be greater than or equal to fromCaptureDate')
  //     isValid = false
  //   }

  //   return isValid
  // }

  protected static validateRequestParameter(query: Query, errors: string[]) {
    if (!query.collection.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
      errors.push(
        'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
    }
  }

  protected static validateFootprint(param: string, errors: string[]) {
    let footprint = wellknown.parse(param) as geojson.Polygon;
    if (!footprint) {
      errors.push("footprint | is not valid WKT");
    } else {
      let firstCoord = footprint.coordinates[0][0];
      let lastCoord = footprint.coordinates[0][footprint.coordinates[0].length - 1];
      if (!firstCoord.every((element, index) => element === lastCoord[index])) {
        errors.push("footprint | is not a closed polygon");
      }
    }
  }

  protected static validateSpatialOp(param: string, errors: string[]) {
    if (!["within", "intersects", "overlaps"].find((val) => val === param)) {
      errors.push("spatialop | should be one of 'within', 'intersects', 'overlaps'");
    }
  }

}
// tslint:disable-next-line:max-classes-per-file
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
      
      resolve([])
    });
  }
}

// tslint:disable-next-line:max-classes-per-file
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
              resolve();
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
          resolve();
        }
      }
    });
  }
}

describe("Product Request Validator", () => {
  let p = "test/valid/path/1/2/345aa";
  let mockRepo = Fixtures.GetMockRepo().object;

  it("should validate a valid search path", () => {
    chai.expect(ProductRequestValidator.validate(new Query(p, {}), mockRepo))
      .to.be.empty;
  });

  it("should not validate an wildcard search path", () => {
    let reqParam = "*test/valid/pat*h/1/2/345aa*";
    chai.expect(ProductRequestValidator.validate(new Query(reqParam, {}), mockRepo))
      .to.have.length(1)
      .and.contain(
      'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"');
  });

  it("should not validate an invalid search path", () => {
    let reqParam = "\\\\test/inv%%alid/path/1/2/345aa";
    chai.expect(ProductRequestValidator.validate(new Query(reqParam, {}), mockRepo))
      .to.have.length(1)
      .and.contain(
      'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$"');
  });

  it("should validate a valid spatialOp", () => {
    ["within", "intersects", "overlaps"].forEach((x) => {
      chai.expect(ProductRequestValidator.validate(new Query(p, { spatialop: x }), mockRepo))
        .to.be.empty;
    });
  });

  it("should not validate an invalid spatialOp", () => {
    chai.expect(ProductRequestValidator.validate(new Query(p, { spatialop: "bobbins" }), mockRepo))
      .to.have.length(1)
      .and.contain("spatialop | should be one of 'within', 'intersects', 'overlaps'");
  });

  it("should validate a valid WKT footprint", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705," +
      "-2.2043681144714355 53.692260240428965))";

    chai.expect(ProductRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.be.empty;
  });

  it("should not validate an ivalid WKT footprint", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705," +
      "-2.2043681144714355))";

    chai.expect(ProductRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.have.length(1)
      .and.contain("footprint | is not valid WKT");
  });

  it("should not validate a WKT footprint that is not a closed polygon", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705))";

    chai.expect(ProductRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.have.length(1)
      .and.contain("footprint | is not a closed polygon");
  });
});

describe("Collection Request Validator", () => {
  let p = "*test/valid/pat*h/1/2/345aa*";
  let mockRepo = Fixtures.GetMockRepo().object;

  it("should validate a valid search path", () => {
    chai.expect(ProductRequestValidator.validate(new Query(p, {}), mockRepo))
      .to.be.empty;
  });

  it("should not validate an invalid search path", () => {
    let reqParam = "\\\\test/inv%%alid/path/1/2/345aa";
    chai.expect(CollectionRequestValidator.validate(new Query(reqParam, {}), mockRepo))
      .to.have.length(1)
      .and.contain(
      'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
  });

  it("should validate a valid spatialOp", () => {
    ["within", "intersects", "overlaps"].forEach((x) => {
      chai.expect(CollectionRequestValidator.validate(new Query(p, { spatialop: x }), mockRepo))
        .to.be.empty;
    });
  });

  it("should not validate an invalid spatialOp", () => {
    chai.expect(CollectionRequestValidator.validate(new Query(p, { spatialop: "bobbins" }), mockRepo))
      .to.have.length(1)
      .and.contain("spatialop | should be one of 'within', 'intersects', 'overlaps'");
  });

  it("should validate a valid WKT footprint", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705," +
      "-2.2043681144714355 53.692260240428965))";

    chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.be.empty;
  });

  it("should not validate an ivalid WKT footprint", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705," +
      "-2.2043681144714355))";

    chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.have.length(1)
      .and.contain("footprint | is not valid WKT");
  });

  it("should not validate a WKT footprint that is not a closed polygon", () => {
    let footprint =
      "POLYGON((-2.2043681144714355 53.692260240428965," +
      "-2.203187942504883 53.692260240428965," +
      "-2.203187942504883 53.691726603500705," +
      "-2.2043681144714355 53.691726603500705))";

    chai.expect(CollectionRequestValidator.validate(new Query(p, { footprint: footprint }), mockRepo))
      .to.have.length(1)
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
