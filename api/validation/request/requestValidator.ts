import * as chai from "chai"; // test reqs
import * as chaiAsPromised from "chai-as-promised";
import * as geojson from "geojson";
import "mocha"; // test reqs
import * as wellknown from "wellknown";

import { Query } from "../../query";

import mochainline = require("mocha-inline");

export abstract class RequestValidator {
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
