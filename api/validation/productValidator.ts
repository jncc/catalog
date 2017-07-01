import { CatalogRepository } from "../repository/catalogRepository";
import * as Product from "../definitions/product/product";
import * as Collection from "../definitions/collection/collection";
import * as ajv from 'ajv';
import * as ajvasync from 'ajv-async';
import * as Footprint from "../definitions/components/footprint";
import * as Metadata from "../definitions/components/metadata";
import * as Properties from "../definitions/product/components/properties";
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

  private validateProductProperties(collection: Collection.Collection, product: Product.Product, errors: string[]): Promise<string[]> {
    let validator = ajv({ allErrors: true, formats: 'full' });
    let asyncValidator = ajvasync(validator);

    let propertiesSchemaValidator = asyncValidator.compile(collection.productsSchema);

    let promise = new Promise((resolve, reject) => {
      propertiesSchemaValidator(product.properties)
        .then(e => {
          resolve();
        }).catch(e => {
          errors = errors.concat(ValidationHelper.reduceErrors(e.errors, 'properties'));
          reject(errors);
        })
    });

    return promise;
  }

  private nonSchemaValidation(product: Product.Product, errors: string[]): Promise<string[]> {
    // Fix common issues with footprint and validate it
    product.footprint = Footprint.fixCommonIssues(product.footprint);
    errors = Footprint.nonSchemaValidation(product.footprint, errors);
    // Run additional validation on metadata
    errors = Metadata.nonSchemaValidation(product.metadata, errors);
    // Validate product properties according to its collection properties_schema
    return this.repository.checkCollectionNameExists(errors, product.collectionName).then(check => {
      return this.repository.getCollection(product.collectionName).then(c => {
        return this.validateProductProperties(c, product, errors);
      })
    });
  }

  validate(product: Product.Product): Promise<string[]> {
    let validator = ajv({ allErrors: true, formats: 'full' });
    let asyncValidator = ajvasync(validator);

    let productSchemaValidator = asyncValidator.compile(Product.Schema);
    let errors: string[] = new Array<string>();

    let promise = new Promise((resolve, reject) => {
      productSchemaValidator(product)
        .then(e => this.nonSchemaValidation(product, errors))
        .then(e => {
          if (errors.length == 0) {
            resolve(errors);
          } else {
            reject(errors);
          }
        })
        .catch(e => {
          if ('errors' in e) {
            // Return from an AJV promise
            errors = errors.concat(ValidationHelper.reduceErrors(e.errors));
          } else {
            // Return from a nonSchemaValidation promise
            errors = errors.concat(e);
          }
          reject(errors);
        })
    });

    return promise;
  };
};

// Tests

describe('Product validator', () => {

  let mockRepo = Fixtures.GetMockRepo();
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
  });

  it('should not validate if no collection name', () => {
    let p = Fixtures.GetTestProduct();

    p.collectionName = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('collectionName | should match pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"');
  });

  it('should not validate and invalid collection name', () => {
    let p = Fixtures.GetTestProduct();

    p.collectionName = '\\\\';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('collectionName | should match pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"');
  });

  // https://stackoverflow.com/questions/44520775/mock-and-string-array-parameter-in-typemoq
  // TODO: Using isAny but really should be an array if we can figure it out
  it('should not validate a product with an invalid collection name', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.reject(x);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();

    return chai.expect(v2.validate(product)).to.be.rejected;
  });
});

describe('Metadata validator', () => {

  let mockRepo = Fixtures.GetMockRepo();
  let validator = new ProductValidator(mockRepo.object);

  it('should not validate a missing metadata title', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.title = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('metadata.title | should NOT be shorter than 1 characters');
  });

  it('should not validate a missing metadata abstract', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.abstract = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('metadata.abstract | should NOT be shorter than 1 characters');
  });

  it('should not validate a missing metadata topicCategory', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.topicCategory = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('metadata.topicCategory | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with an empty keywords array', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [];

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('metadata.keywords | should NOT have less than 1 items');
  });

  it('should not validate metadata keyword with no value', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      'value': '',
      'vocab': 'vocab'
    }];

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('metadata.keywords[0].value | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata keyword with a defined vocab but with no value', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      'value': 'value',
      'vocab': ''
    }];

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('metadata.keywords[0].vocab | should NOT be shorter than 1 characters');
  });

  it('should validate metadata keyword with a value and no vocab', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      "value": "value"
    }];

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate metadata keyword with a value and vocab', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      'value': 'value',
      'vocab': 'vocab'
    }];

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should not validate metadata temporalExtent without a valid begin and end date-time', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.temporalExtent = {
      "begin": "not-date",
      "end": "not-date"
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(2)
      .and.contain('metadata.temporalExtent.begin | should match format \"date-time\"')
      .and.contain('metadata.temporalExtent.end | should match format \"date-time\"');
  });

  it('should not validate metadata datasetReferenceDate that is not a date-time or a date', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = 'not-a-date-string';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3)
      .and.contain('metadata.datasetReferenceDate | should match format \"date-time\"')
      .and.contain('metadata.datasetReferenceDate | should match format \"date\"')
      .and.contain('metadata.datasetReferenceDate | should match exactly one schema in oneOf');
  });

  it('should validate metadata datasetReferenceDate as a date string', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = '2017-01-01';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate metadata datasetRefernceDate as a date-time string', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = '2017-01-01T00:00:00Z';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should not validate metadata with an empty lineage string', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.lineage = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.lineage | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with a non uri resourceLocator string', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.resourceLocator = 'should-fail';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.resourceLocator | should match format \"uri\"');
  });

  it('should not validate metadata with an empty additionalInformationSource', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.additionalInformationSource = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.additionalInformationSource | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata without a valid responsibleOrganisation, name, email and role (email minimum)', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.responsibleOrganisation = {
      'name': '',
      'email': 'not-an-email',
      'role': ''
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3)
      .and.contain('metadata.responsibleOrganisation.name | should NOT be shorter than 1 characters')
      .and.contain('metadata.responsibleOrganisation.email | should match format \"email\"')
      .and.contain('metadata.responsibleOrganisation.role | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with empty limitationsOnPublicAccess', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.limitationsOnPublicAccess = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.limitationsOnPublicAccess | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with empty useConstraints', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.useConstraints = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.useConstraints | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with empty spatialReferenceSystem', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.spatialReferenceSystem = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.spatialReferenceSystem | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with a metadataDate that is not a date-time or a date', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.metadataDate = 'not-a-date-string';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3)
      .and.contain('metadata.metadataDate | should match format \"date-time\"')
      .and.contain('metadata.metadataDate | should match format \"date\"')
      .and.contain('metadata.metadataDate | should match exactly one schema in oneOf');
  });

  it('should validate metadata with metadataDate as a date string', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = '2017-01-01';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate metadata with a metadataDate as a date-time string', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.metadataDate = '2017-01-01T00:00:00Z';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should not validate metadata without a valid metadataPointOfContact, name, email and role (email minimum)', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.metadataPointOfContact = {
      'name': '',
      'email': 'not-an-email',
      'role': ''
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3)
      .and.contain('metadata.metadataPointOfContact.name | should NOT be shorter than 1 characters')
      .and.contain('metadata.metadataPointOfContact.email | should match format \"email\"')
      .and.contain('metadata.metadataPointOfContact.role | should match pattern "^metadataPointOfContact$"');
  });

  it('should not validate metadata with empty resourceType', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.resourceType = '';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.resourceType | should NOT be shorter than 1 characters');
  });

  it('should not validate metadata with an invalid boundingBox', () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.boundingBox = {
      'north': 57.7062934711795,
      'south': 57.7960680443262,
      'east': -4.0203233299185,
      'west': -3.85220733512446
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(2)
      .and.contain('metadata.boundingBox | north should be greater than south')
      .and.contain('metadata.boundingBox | east should be greater than west');
  });
});

describe('Data Validator', () => {
  let mockRepo = Fixtures.GetMockRepo();
  let validator = new ProductValidator(mockRepo.object);

  it('should not validate an s3 data group with missing region', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        s3: {
          region: '',
          bucket: 'missing-region',
          key: '/test.tif'
        }
      }
    };

    console.log(validator.validate(p))

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].s3.region | should NOT be shorter than 1 characters');
  });

  it('should not validate an s3 data group with missing bucket', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        s3: {
          region: 'missing-bucket',
          bucket: '',
          key: '/test.tif'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].s3.bucket | should NOT be shorter than 1 characters');
  });

  it('should not validate an s3 data group with missing key', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        s3: {
          region: 'missing-key',
          bucket: 'missing-key',
          key: ''
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].s3.key | should NOT be shorter than 1 characters');
  });

  it('should validate an s3 data group with additonal ^.*data$ properties', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        s3: {
          region: 'test',
          bucket: 'test',
          key: 'test'
        }
      },
      preview: {
        s3: {
          region: 'test',
          bucket: 'test',
          key: 'test'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  // it('should not validate an s3 data group with additonal ^.*data$ properties that does not match the s3file type', () => {
  //     let p = Fixtures.GetTestProduct();
  //     p.data = {
  //         files: {
  //             s3: {
  //                 data: {
  //                     region: 'test',
  //                     bucket: 'test',
  //                     key: 'test'
  //                 },
  //                 preview_data: {
  //                     bobbins: 'should-fail'
  //                 }
  //             }
  //         }
  //     };

  //     return chai.expect(validator.validate(p)).to.be.fulfilled;
  // })

  it('should not validate an ftp data group with an invalid server URI', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        ftp: {
          server: '',
          path: '/mising/server.file'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(4)
      .and.contain('data[\'product\'].ftp.server | should match format \"hostname\"')
      .and.contain('data[\'product\'].ftp.server | should match format \"ipv6\"')
      .and.contain('data[\'product\'].ftp.server | should match format \"uri\"')
      .and.contain('data[\'product\'].ftp.server | should match exactly one schema in oneOf');
  });

  it('should not validate an ftp data group with missing path', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        ftp: {
          server: 'missing.path.com',
          path: ''
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].ftp.path | should NOT be shorter than 1 characters');
  });

  it('should validate an ftp data group with a server as a hostname', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        ftp: {
          server: 'hostname.present',
          path: 'path/to/file.txt'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate an ftp data group with a server as a uri', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        ftp: {
          server: 'ftp://hostname.present:24',
          path: 'path/to/file.txt'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate an ftp data group with a server as a ipv4', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        ftp: {
          server: '192.168.1.1',
          path: 'path/to/file.txt'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate an ftp data group with a server as a ipv6', () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        ftp: {
          server: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          path: 'path/to/file.txt'
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });
});

describe('Footprint Validator', () => {
  let mockRepo = Fixtures.GetMockRepo();
  let validator = new ProductValidator(mockRepo.object);

  it('should not validate a invalid GeoJSON blob', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = {
      "type": "Bobbins",
      "coordinates": [
        [-3.252708444643698, 55.01808601299337],
        [-3.096345813599173, 55.01959554822891],
        [-3.098805121795129, 55.1094396249146],
        [-3.25551820944467, 55.10792506925024],
        [-3.252708444643698, 55.01808601299337]
      ],
      "crs": {
        "properties": {
          "name": "mine"
        },
        "type": "name"
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3);
  });

  it('should not validate a non Multipolygon footprint', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = {
      "type": "Polygon",
      "coordinates": [[
        [-3.252708444643698, 55.01808601299337],
        [-3.096345813599173, 55.01959554822891],
        [-3.098805121795129, 55.1094396249146],
        [-3.25551820944467, 55.10792506925024],
        [-3.252708444643698, 55.01808601299337]
      ]],
      "crs": {
        "properties": {
          "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        },
        "type": "name"
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("footprint.type | should be 'MultiPolygon'");
  });

  it('should validate a missing CRS, replacing it with default for pushing into Postgres', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    delete p.footprint['crs'];

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should not validate a non WGS84 CRS', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint['crs']['properties']['name'] = 'EPSG:27700';

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("footprint.crs.properties.name | should be 'EPSG:4326' / 'urn:ogc:def:crs:OGC:1.3:CRS84' / 'urn:ogc:def:crs:EPSG::4326'");
  });

  it('should validate a CRS as EPSG:4326', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint['crs']['properties']['name'] = 'EPSG:4326';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate a CRS as urn:ogc:def:crs:OGC:1.3:CRS84', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint['crs']['properties']['name'] = 'urn:ogc:def:crs:OGC:1.3:CRS84';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it('should validate a CRS as urn:ogc:def:crs:EPSG::4326', () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint['crs']['properties']['name'] = 'urn:ogc:def:crs:EPSG::4326';

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });
});

describe('Product Properties Validator', () => {
  let mockRepo = Fixtures.GetMockRepo();
  let validator = new ProductValidator(mockRepo.object);

  it('should validate a product with an valid properties collection', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(x);
    });
    mr.setup(x => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.Collection = Fixtures.GetCollection();
      c.productsSchema = {
        "type": "object",
        "title": "Properties",
        "$async": true,
        "$schema": "http://json-schema.org/draft-04/schema#",
        "required": ["externalId"],
        "properties": {
          "externalId": {
            "type": "integer"
          }
        },
        "additionalProperties": false
      };
      return Promise.resolve(c);
    })

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      'externalId': 1145234
    };

    return chai.expect(v2.validate(product)).to.be.fulfilled;
  });

  it('should validate a product with an valid properties collection - formatted string types', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(x);
    });
    mr.setup(x => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.Collection = Fixtures.GetCollection();
      c.productsSchema = {
        "type": "object",
        "title": "Properties",
        "$async": true,
        "$schema": "http://json-schema.org/draft-04/schema#",
        "required": ["externalId"],
        "properties": {
          "externalId": {
            "type": "string",
            "format": "uuid"
          },
          "datetime": {
            "type": "string",
            "format": "date-time"
          }
        },
        "additionalProperties": false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      'externalId': 'cdc1c5c4-0940-457e-8583-e1cd45b0a5a3',
      'datetime': '2017-06-28T00:00:00Z'
    };

    return chai.expect(v2.validate(product)).to.be.fulfilled;
  });

  it('should not validate a product with an invalid properties collection - non-matching definitions', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(x);
    });
    mr.setup(x => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.Collection = Fixtures.GetCollection();
      c.productsSchema = {
        "type": "object",
        "title": "Properties",
        "$async": true,
        "$schema": "http://json-schema.org/draft-04/schema#",
        "required": ["externalId"],
        "properties": {
          "externalId": {
            "type": "string",
            "minLength": 1
          }
        },
        "additionalProperties": false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object)

    const product = Fixtures.GetTestProduct();
    product.properties = {
      'externalId': 1145234
    }

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('properties.externalId | should be string');
  });

  it('should not validate a product with an bad properties collection - formatted string types', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(x);
    });
    mr.setup(x => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.Collection = Fixtures.GetCollection();
      c.productsSchema = {
        "type": "object",
        "title": "Properties",
        "$async": true,
        "$schema": "http://json-schema.org/draft-04/schema#",
        "required": ["externalId"],
        "properties": {
          "externalId": {
            "type": "string",
            "format": "uuid"
          },
          "datetime": {
            "type": "string",
            "format": "date-time"
          }
        },
        "additionalProperties": false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      'externalId': 'not-a-uuid',
      'datetime': '2017-06-28'
    };

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(2)
      .and.contain('properties.externalId | should match format "uuid"')
      .and.contain('properties.datetime | should match format "date-time"');;
  });

  it('should not validate a product with an invalid properties collection - missing definitions', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(x);
    });
    mr.setup(x => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.Collection = Fixtures.GetCollection();
      c.productsSchema = {
        "type": "object",
        "title": "Properties",
        "$async": true,
        "$schema": "http://json-schema.org/draft-04/schema#",
        "required": ["externalId"],
        "properties": {
          "externalId": {
            "type": "string",
            "minLength": 1
          }
        },
        "additionalProperties": false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {};

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('properties | should have required property \'externalId\'');
  });

  it('should not validate a product with an invalid properties collection - additional definitions', () => {
    let mr = TypeMoq.Mock.ofType(CatalogRepository);
    mr.setup(x => x.checkCollectionNameExists(TypeMoq.It.isAny(), TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(x);
    });
    mr.setup(x => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.Collection = Fixtures.GetCollection();
      c.productsSchema = {
        "type": "object",
        "title": "Properties",
        "$async": true,
        "$schema": "http://json-schema.org/draft-04/schema#",
        "required": ["externalId"],
        "properties": {
          "externalId": {
            "type": "string",
            "minLength": 1
          }
        },
        "additionalProperties": false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      externalId: 'external-id-string',
      rogue: 'should-not-be-here'
    };

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('properties | should NOT have additional properties');
  });
})
