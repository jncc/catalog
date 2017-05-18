import { Product } from "../definitions/product/product";
import * as fs from 'fs'

import * as chai from 'chai';
import  'mocha';
require('mocha-inline')();

export class Fixtures {
    public static GetTestProduct():Product{
        var content =  fs.readFileSync('./api/test/product.json', 'utf8');
        return JSON.parse(content);
    }
}

describe('Test fixtures', () => {
  it('GetTestProduct should return the product from ./api/test/product.json', () => {
    const result = Fixtures.GetTestProduct();
    chai.expect(result.id).to.equal('foo bar');
    //chai.expect(result.id).to.equal('cdc1c5c4-0940-457e-8583-e1cd45b0a5a3');
  });
});