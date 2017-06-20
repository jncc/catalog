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
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as TypeMoq from "typemoq";
import { Fixtures } from "../test/fixtures";

//test setup
require('mocha-inline')();
chai.use(chaiAsPromised);

export class ProductValidator {
    constructor(private repository: CatalogRepository) { }

    private nonSchemaValidation(product: Product, errors: string[]): Promise<string[]> {
        errors = Footprint.nonSchemaValidation(product.footprint, errors)
        errors = Metadata.nonSchemaValidation(product.metadata, errors)
        return this.repository.checkCollectionNameExists(errors, product.collectionName);
    }

    validate(product: Product): Promise<string[]> {
        let validator = ajv({ allErrors: true, formats: 'full' })
        let asyncValidator = ajvasync(validator)

        let productSchemaValidator = asyncValidator.compile(Schema)
        let errors: string[] = new Array<string>();

        let promise = new Promise((resolve, reject) => {

            productSchemaValidator(product)
                .then(e => this.nonSchemaValidation(product, errors))
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
    let validator = new ProductValidator(mockRepo.object);

    it('should validate a valid product', () => {
        let p = Fixtures.GetTestProduct();

        return chai.expect(validator.validate(p)).to.not.be.rejected;
    });

    it('should not validate if no product name', () => {
        let p = Fixtures.GetTestProduct();
        p.name = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.lengthOf(1)
            .and.include('name | should match pattern "^([A-Za-z0-9-_.])+$"');
    })

    it('should not validate if no collection name', () => {
        let p = Fixtures.GetTestProduct();

        p.collectionName = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('collectionName | should match pattern "^\/(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"')
    })

    it('should not validate and invalid collection name', () => {
        let p = Fixtures.GetTestProduct();

        p.collectionName = '\\\\';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('collectionName | should match pattern "^\/(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"')
    })

    // https://stackoverflow.com/questions/44520775/mock-and-string-array-parameter-in-typemoq
    // it('should not validate a product with an invalid collection name', () =>{
    //     let mr = TypeMoq.Mock.ofType(CatalogRepository);
    //     mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAnyString()[], TypeMoq.It.isAnyString())).returns((x, y) => {
    //         return Promise.resolve(x);
    //     })

    //     let v2 = new ProductValidator(mr.object)

    //     const product = Fixtures.GetTestProduct();

    //     return chai.expect(v2.validate(product)).to.be.rejected;
    // });
})

describe('Metadata validator', () => {

    let mockRepo = TypeMoq.Mock.ofType(CatalogRepository);
    let validator = new ProductValidator(mockRepo.object);

    it('should not validate a missing metadata title', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.title = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('metadata.title | should NOT be shorter than 1 characters')
    })

    it('should not validate a missing metadata abstract', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.abstract = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('metadata.abstract | should NOT be shorter than 1 characters')
    })

    it('should not validate a missing metadata topicCategory', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.topicCategory = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('metadata.topicCategory | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with an empty keywords array', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.keywords = [];

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('metadata.keywords | should NOT have less than 1 items')
    })

    it('should not validate metadata keyword with no value', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.keywords = [{
            'value': '',
            'vocab': 'vocab'
        }];

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('metadata.keywords[0].value | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata keyword with a defined vocab but with no value', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.keywords = [{
            'value': 'value',
            'vocab': ''
        }];

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.include('metadata.keywords[0].vocab | should NOT be shorter than 1 characters')
    })

    // TODO: Vocab can be null, but not when setting it this way, needs to be nullable
    // it('should validate metadata keyword with a value and no vocab', () => {
    //     let p = Fixtures.GetTestProduct();
    //     p.metadata.keywords = [{
    //         "value": "value"
    //     }];

    //     return chai.expect(validator.validate(p)).to.be.rejected
    //     .and.eventually.have.length(1)
    //     .and.include('metadata.keywords[0].vocab | should NOT be shorter than 1 characters')        
    // })        

    it('should validate metadata keyword with a value and vocab', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.keywords = [{
            'value': 'value',
            'vocab': 'vocab'
        }];

        return chai.expect(validator.validate(p)).to.be.fulfilled
    })

    it('should not validate metadata temporalExtent without a valid begin and end date-time', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.temporalExtent = {
            "begin": "not-date",
            "end": "not-date"
        }

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(2)
            .and.contain('metadata.temporalExtent.begin | should match format \"date-time\"')
            .and.contain('metadata.temporalExtent.end | should match format \"date-time\"')
    })

    it('should not validate metadata datasetReferenceDate that is not a date-time or a date', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.datasetReferenceDate = 'not-a-date-string'

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(3)
            .and.contain('metadata.datasetReferenceDate | should match format \"date-time\"')
            .and.contain('metadata.datasetReferenceDate | should match format \"date\"')
            .and.contain('metadata.datasetReferenceDate | should match exactly one schema in oneOf')
    })

    it('should validate metadata datasetReferenceDate as a date string', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.datasetReferenceDate = '2017-01-01'

        return chai.expect(validator.validate(p)).to.be.fulfilled
    })

    it('should validate metadata datasetRefernceDate as a date-time string', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.datasetReferenceDate = '2017-01-01T00:00:00Z'

        return chai.expect(validator.validate(p)).to.be.fulfilled
    })

    it('should not validate metadata with an empty lineage string', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.lineage = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.lineage | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with a non uri resourceLocator string', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.resourceLocator = 'should-fail'

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.resourceLocator | should match format \"uri\"')
    })

    it('should not validate metadata with an empty additionalInformationSource', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.additionalInformationSource = '';

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.additionalInformationSource | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata without a valid responsibleOrganisation, name, email and role (email minimum)', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.responsibleOrganisation = {
            'name': '',
            'email': 'not-an-email',
            'role': ''
        }

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(3)
            .and.contain('metadata.responsibleOrganisation.name | should NOT be shorter than 1 characters')
            .and.contain('metadata.responsibleOrganisation.email | should match format \"email\"')
            .and.contain('metadata.responsibleOrganisation.role | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with empty limitationsOnPublicAccess', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.limitationsOnPublicAccess = ''

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.limitationsOnPublicAccess | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with empty useConstraints', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.useConstraints = ''

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.useConstraints | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with empty spatialReferenceSystem', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.spatialReferenceSystem = ''

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.spatialReferenceSystem | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with a metadataDate that is not a date-time or a date', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.metadataDate = 'not-a-date-string'

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(3)
            .and.contain('metadata.metadataDate | should match format \"date-time\"')
            .and.contain('metadata.metadataDate | should match format \"date\"')
            .and.contain('metadata.metadataDate | should match exactly one schema in oneOf')
    })

    it('should validate metadata with metadataDate as a date string', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.datasetReferenceDate = '2017-01-01'

        return chai.expect(validator.validate(p)).to.be.fulfilled
    })

    it('should validate metadata with a metadataDate as a date-time string', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.metadataDate = '2017-01-01T00:00:00Z'

        return chai.expect(validator.validate(p)).to.be.fulfilled
    })

    it('should not validate metadata without a valid metadataPointOfContact, name, email and role (email minimum)', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.metadataPointOfContact = {
            'name': '',
            'email': 'not-an-email',
            'role': ''
        }

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(3)
            .and.contain('metadata.metadataPointOfContact.name | should NOT be shorter than 1 characters')
            .and.contain('metadata.metadataPointOfContact.email | should match format \"email\"')
            .and.contain('metadata.metadataPointOfContact.role | should match pattern "^metadataPointOfContact$"')
    })

    it('should not validate metadata with empty resourceType', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.resourceType = ''

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(1)
            .and.contain('metadata.resourceType | should NOT be shorter than 1 characters')
    })

    it('should not validate metadata with an invalid boundingBox', () => {
        let p = Fixtures.GetTestProduct();
        p.metadata.boundingBox = {
            'north': 57.7062934711795,
            'south': 57.7960680443262,
            'east': -4.0203233299185,
            'west': -3.85220733512446
        }

        return chai.expect(validator.validate(p)).to.be.rejected
            .and.eventually.have.length(2)
            .and.contain('metadata.boundingBox | north should be greater than south')
            .and.contain('metadata.boundingBox | east should be greater than west')
    })
})

describe('Data Validator', () => {
    let mockRepo = TypeMoq.Mock.ofType(CatalogRepository);
    let validator = new ProductValidator(mockRepo.object);

    it('should not validate a data group with missing required elements or invalid optional elements', () => {
        let p = Fixtures.GetTestProduct();
        p.data.groups = [
            {
                description: "test",
                files: {
                    s3: [
                        {
                            region: '',
                            bucket: 'missing-region',
                            key: '/test.tif',
                            type: 'data'
                        },
                        {
                            region: 'missing-bucket',
                            bucket: '',
                            key: '/test.png',
                            type: 'preview'
                        },
                        {
                            region: 'missing-key',
                            bucket: 'missing-key',
                            key: '',
                            type: 'metadata'
                        },
                        {
                            region: 'invalid-type',
                            bucket: 'invalid-type',
                            key: '/invalid/type.file',
                            type: ''
                        }
                    ],
                    ftp: [
                        {
                            server: '',
                            path: '/no/server/uri',
                            type: 'data'
                        },
                        {
                            server: 'no-path.com',
                            path: '',
                            type: 'preview'
                        },
                        {
                            server: 'invalid-type.com',
                            path: '/invalid/type.file',
                            type: ''
                        },
                    ]
                },
                services: [

                ]
            }
        ]
    })
})