import { Product } from "../definitions/product/product";
import * as fs from 'fs'

import * as chai from 'chai';
import 'mocha';
require('mocha-inline')();

export class Fixtures {
  public static GetTestProduct(): Product {
    var content = fs.readFileSync('./api/test/product.json', 'utf8');
    return JSON.parse(content);
  }

  public static GetFootprint(): any {
    return {
      "type": "MultiPolygon",
      "coordinates": [[[
        [-3.252708444643698, 55.01808601299337],
        [-3.096345813599173, 55.01959554822891],
        [-3.098805121795129, 55.1094396249146],
        [-3.25551820944467, 55.10792506925024],
        [-3.252708444643698, 55.01808601299337]
      ]]],
      "crs": {
        "properties": {
          "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        },
        "type": "name"
      }
    } 
  }
}

describe('Test fixtures', () => {
  it('GetTestProduct should return the product from ./api/test/product.json', () => {
    const result = Fixtures.GetTestProduct();
    chai.expect(result.id).to.equal('cdc1c5c4-0940-457e-8583-e1cd45b0a5a3');
  });
});