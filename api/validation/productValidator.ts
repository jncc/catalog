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
import * as TypeMoq from "typemoq";

export class ProductValidator{
    constructor(private repository: CatalogRepository) {}

    private nonSchemaValidation(product: Product, errors: string[]): Promise<string[]> {
        errors = Footprint.nonSchemaValidation(product.footprint, errors)
        errors = Metadata.nonSchemaValidation(product.metadata, errors)
        return this.repository.checkCollectionNameExists(errors, product.collectionName);
    }

    validate(product: Product): Promise<string[]> {
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
};

// Tests
describe('Product validator', () => {
    
    let mockRepo = TypeMoq.Mock.ofType(CatalogRepository);
    let validator =  new ProductValidator(mockRepo.object);

    it('should validate a valid product', () => {
        const product = Fixtures.GetTestProduct();
    
        return chai.expect(validator.validate(product)).to.not.be.rejected;
    });

    it('should not validate a product with no product name', () => {
        let p = Fixtures.GetTestProduct();
        p.name = '';

        return chai.expect(validator.validate(p)).to.be.rejected
        .and.eventually.have.lengthOf(1)
        .and.include('name | should match pattern "^([A-Za-z0-9-_.])+$"');
    })
    
    // https://stackoverflow.com/questions/44520775/mock-and-string-array-parameter-in-typemoq
    // it('should not validate a product with an invalid collection name', () =>{
    //     let mr = TypeMoq.Mock.ofType(CatalogRepository);
    //     mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.is<string[]>(), TypeMoq.It.isAnyString())).returns((x, y) => {
    //         return Promise.resolve(x);
    //     })

    //     let v2 = new ProductValidator(mr.object)

    //     const product = Fixtures.GetTestProduct();

    //     return chai.expect(v2.validate(product)).to.be.rejected;
    // });
})
