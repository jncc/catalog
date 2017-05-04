import { Product } from "../definitions/product/product";
import * as fs from 'fs'

import { expect } from 'chai';
import 'mocha';
require('mocha-inline')();

export class Fixtures {
    public static GetTestProduct():Product{
        var content =  fs.readFileSync('./api/test/product.json', 'utf8');
        return JSON.parse(content);
    }
}

describe('Fixtures.GetTestProduct', () => {
  it('should return the product from ./api/test/product.json', () => {
    const result = Fixtures.GetTestProduct();
    expect(result.id).to.equal('cdc1c5c4-0940-457e-8583-e1cd45b0a5a3');
  });
});