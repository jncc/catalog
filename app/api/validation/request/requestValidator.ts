import * as geojson from "geojson";
import * as wellknown from "wellknown";

import { ProductQuery } from "../../query/productQuery";

export abstract class RequestValidator {
  protected validateRequestParameter(query: string) {
    let error = ""
    if (!query.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
      error = 'searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"';
    }
    return error
  }

  protected validateFootprint(param: string, errors: string[]) {
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

  protected validateSpatialOp(param: string, errors: string[]) {
    if (!["within", "intersects", "overlaps"].find((val) => val === param)) {
      errors.push("spatialop | should be one of 'within', 'intersects', 'overlaps'");
    }
  }
}
