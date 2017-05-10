import { CatalogRepository } from "../repository/catalogRepository";
import { Product, Schema } from "../definitions/product/product";
import * as ajv from 'ajv';
import * as ajvasync from 'ajv-async';
import * as Footprint from "../definitions/product/components/footprint";
import * as Properties from "../definitions/product/components/properties";
import * as Metadata from "../definitions/product/components/metadata";
import * as Data from "../definitions/product/components/data/data";
import * as DataServices from "../definitions/product/components/data/services";
import * as DataFiles from "../definitions/product/components/data/files";
import * as ValidationHelper from "./validationHelper";

//test reqs
import { Fixtures } from "../test/fixtures";
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import  'mocha';
import { should } from 'chai';
require('mocha-inline')();
chai.use(chaiAsPromised);

export class ProductValidator{
    constructor(private repository: CatalogRepository) {}

    private nonSchemaValidation(product: Product, errors: Array<string>): Promise<Array<string>> {
        errors = Footprint.nonSchemaValidation(product.footprint, errors)
        errors = Metadata.nonSchemaValidation(product.metadata, errors)
        
        return this.repository.checkCollectionNameExists(errors, product.collectionName);
    }

    validate(product: Product): Promise<Array<string>> {
        console.log('running validator')

        let validator = ajv({ allErrors: true, formats: 'full' })
        let asyncValidator = ajvasync(validator)
    
        let productSchemaValidator = asyncValidator.compile(Schema)
        let errors: string[] = new Array<string>();

        let promise = new Promise((resolve, reject) => {
            
            productSchemaValidator(product)
            .then(e => this.nonSchemaValidation(product, e))     
            .then(e => {
                if (errors.length == 0) {
                    resolve(errors);
                } else {
                    reject(errors)
                }
            }).catch(e => {
                errors = ValidationHelper.reduceErrors(e.errors)
                reject(errors)
            })
        });

        return promise
    };


}


//Tests
describe('validate', () => {
    it('should validate a valid product', () => {
        const product = Fixtures.GetTestProduct();
        validate(product).then(result => {
            console.log(result);
        })   
        return chai.expect(validate(product)).to.not.be.rejected;
    });
})