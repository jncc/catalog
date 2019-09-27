import * as Collection from "../definitions/collection/collection";
import * as Footprint from "../definitions/components/footprint";
import * as Metadata from "../definitions/components/metadata";
import * as Product from "../definitions/product/product";
import { CollectionStore} from "../repository/collectionStore";
import * as ValidationHelper from "./validationHelper";
import * as ValidatorFactory from "./validatorFactory";

// Test reqs
import "mocha";
import "mocha-inline";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as TypeMoq from "typemoq";
import { Fixtures } from "../test/fixtures";

//todo - Valdate that the collection has a properly defined schema if the product has properties.

export class ProductValidator {
  collectionStore: CollectionStore;

  constructor(collectionStore: CollectionStore) {
    this.collectionStore = collectionStore;
  }

  public async validate(product: Product.IProduct): Promise<string[]> {
    let asyncValidator = ValidatorFactory.getValidator(Product.Schema.$schema);
    let productSchemaValidator = asyncValidator.compile(Product.Schema);

    let errors: string[] = new Array<string>();

    return new Promise<string[]>(async (resolve, reject) => {

      await productSchemaValidator(product).catch((e) => {
        if ("errors" in e) {
          // Return from an AJV promise
          errors = errors.concat(ValidationHelper.reduceErrors(e.errors));
          reject(errors);
          return;
        } else {
          throw new Error(e);
        }
      });

      errors = Footprint.nonSchemaValidation(product.footprint, errors);
      // Run additional validation on metadata
      errors = Metadata.nonSchemaValidation(product.metadata, errors);
      // Validate product properties according to its collection properties_schema

      let collection = await this.collectionStore.getCollection(product.collectionName)

      if (collection === undefined || collection === null) {
        errors.push(`collectionName | ${product.collectionName} does not exist in the database`);

        reject(errors);
        return;
      }

      await this.validateProductProperties(collection as Collection.ICollection, product, errors)
            .catch((e) => errors = e);

      if (errors.length == 0) {
        resolve(errors);
      } else {
        reject(errors);
      }
    });
  }

  private async validateProductProperties(collection: Collection.ICollection, product: Product.IProduct, errors: string[]): Promise<string[]> {
    if (collection.productsSchema === "") {
      return Promise.resolve(errors);
    }

    let asyncValidator = ValidatorFactory.getValidator(collection.productsSchema.$schema);
    let propertiesSchemaValidator = asyncValidator.compile(collection.productsSchema);

    let propValidator = propertiesSchemaValidator(product.properties);

    //propValidator.then is sometimes a boolean not a function.?? MD discovery
    if (typeof propValidator.then === 'function') {
      return new Promise<string[]>(async (resolve, reject) => {
        propValidator.then((x) => {
          resolve();
        }).catch((e) => {
          errors = errors.concat(ValidationHelper.reduceErrors(e.errors, "properties"));
          reject(errors);
        });
      });
    } else {
      let valid = await propertiesSchemaValidator(product.properties);
      if (propertiesSchemaValidator.errors) {
        return Promise.reject(errors.concat(ValidationHelper.reduceErrors(propertiesSchemaValidator.errors, "properties")));
      }
    }
    return Promise.resolve(errors);
  }

}

// Tests
// Test setup
// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);

describe("Legacy json schema spec support", () => {
  it("should support draft-04 spec schemas", () => {
    let mockRepo = Fixtures.GetMockCollectionStore(4);
    let validator = new ProductValidator(mockRepo.object);
    return chai.expect(validator.validate(Fixtures.GetTestProduct()))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });

  it("should support draft-06 spec schemas", () => {
    let mockRepo = Fixtures.GetMockCollectionStore(6);
    let validator = new ProductValidator(mockRepo.object);
    return chai.expect(validator.validate(Fixtures.GetTestProduct()))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });
});


describe("Product validator", () => {

  let mockRepo = Fixtures.GetMockCollectionStore();
  let validator = new ProductValidator(mockRepo.object);

  it("should validate a valid product", () => {
    let p = Fixtures.GetTestProduct();

    return chai.expect(validator.validate(p))
      .to.be.fulfilled
      .and.eventually.be.an("array").that.is.empty;
  });

  it("should not validate if no product name", () => {
    let p = Fixtures.GetTestProduct();
    p.name = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.lengthOf(1)
      .and.include('name | should match pattern "^([A-Za-z0-9-_.])+$"');
  });

  it("should not validate if no collection name", () => {
    let p = Fixtures.GetTestProduct();

    p.collectionName = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('collectionName | should match pattern "^(([A-Za-z0-9\_\-]+)(\/))*([A-Za-z0-9\_\-])+$"');
  });

  it("should not validate and invalid collection name", () => {
    let p = Fixtures.GetTestProduct();

    p.collectionName = "\\\\";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include('collectionName | should match pattern "^(([A-Za-z0-9\_\-]+)(\/))*([A-Za-z0-9\_\-])+$"');
  });

  it("should not validate a product with a non existant collection name", () => {
    let mr = TypeMoq.Mock.ofType(CollectionStore);
    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      return Promise.resolve(undefined);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.be.an("array")
      .that.has.lengthOf(1)
      .and.include("collectionName | scotland-gov-gi/lidar-1/processed/dtm/gridded/27700/10000 does not exist in the database")
  });
});

describe("Metadata validator", () => {

  let mockRepo = Fixtures.GetMockCollectionStore();
  let validator = new ProductValidator(mockRepo.object);

  it("should not validate a missing metadata title", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.title = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include("metadata.title | should NOT be shorter than 1 characters");
  });

  it("should not validate a missing metadata abstract", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.abstract = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include("metadata.abstract | should NOT be shorter than 1 characters");
  });

  it("should not validate a missing metadata topicCategory", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.topicCategory = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include("metadata.topicCategory | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with an empty keywords array", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [];

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include("metadata.keywords | should NOT have fewer than 1 items");
  });

  it("should not validate metadata keyword with no value", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      value: "",
      vocab: "vocab"
    }];

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include("metadata.keywords[0].value | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata keyword with a defined vocab but with no value", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      value: "value",
      vocab: ""
    }];

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.include("metadata.keywords[0].vocab | should NOT be shorter than 1 characters");
  });

  it("should validate metadata keyword with a value and no vocab", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      value: "value"
    }];

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate metadata keyword with a value and vocab", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.keywords = [{
      value: "value",
      vocab: "vocab"
    }];

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should not validate metadata temporalExtent without a valid begin and end date-time", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.temporalExtent = {
      begin: "not-date",
      end: "not-date"
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(4)
      .and.contain('metadata.temporalExtent.begin | should match format \"date-time\"')
      .and.contain('metadata.temporalExtent.begin | should pass "fullDateValidation" keyword validation')
      .and.contain('metadata.temporalExtent.end | should match format \"date-time\"')
      .and.contain('metadata.temporalExtent.end | should pass "fullDateValidation" keyword validation');
  });

  it("should not validate metadata datasetReferenceDate that is not a date-time or a date", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = "not-a-date-string";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(4)
      .and.contain('metadata.datasetReferenceDate | should pass "fullDateValidation" keyword validation')
      .and.contain('metadata.datasetReferenceDate | should match format \"date-time\"')
      .and.contain('metadata.datasetReferenceDate | should match format \"date\"')
      .and.contain("metadata.datasetReferenceDate | should match exactly one schema in oneOf");
  });

  it("should validate metadata datasetReferenceDate as a date string", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = "2017-01-01";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate metadata datasetRefernceDate as a date-time string", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = "2017-01-01T00:00:00Z";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should not validate metadata with an empty lineage string", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.lineage = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("metadata.lineage | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with a non uri resourceLocator string", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.resourceLocator = "should-fail";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('metadata.resourceLocator | should match format \"uri\"');
  });

  it("should not validate metadata with an empty additionalInformationSource", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.additionalInformationSource = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("metadata.additionalInformationSource | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata without a valid responsibleOrganisation, name, email and role (email minimum)", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.responsibleOrganisation = {
      name: "",
      email: "not-an-email",
      role: ""
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3)
      .and.contain("metadata.responsibleOrganisation.name | should NOT be shorter than 1 characters")
      .and.contain('metadata.responsibleOrganisation.email | should match format \"email\"')
      .and.contain("metadata.responsibleOrganisation.role | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with empty limitationsOnPublicAccess", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.limitationsOnPublicAccess = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("metadata.limitationsOnPublicAccess | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with empty useConstraints", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.useConstraints = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("metadata.useConstraints | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with empty spatialReferenceSystem", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.spatialReferenceSystem = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("metadata.spatialReferenceSystem | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with a metadataDate that is not a date-time or a date", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.metadataDate = "not-a-date-string";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(4)
      .and.contain('metadata.metadataDate | should pass "fullDateValidation" keyword validation')
      .and.contain('metadata.metadataDate | should match format \"date-time\"')
      .and.contain('metadata.metadataDate | should match format \"date\"')
      .and.contain("metadata.metadataDate | should match exactly one schema in oneOf");
  });

  it("should validate metadata with metadataDate as a date string", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.datasetReferenceDate = "2017-01-01";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate metadata with a metadataDate as a date-time string", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.metadataDate = "2017-01-01T00:00:00Z";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should not validate metadata without a valid metadataPointOfContact, name, email and role (email minimum)", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.metadataPointOfContact = {
      name: "",
      email: "not-an-email",
      role: ""
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3)
      .and.contain("metadata.metadataPointOfContact.name | should NOT be shorter than 1 characters")
      .and.contain('metadata.metadataPointOfContact.email | should match format \"email\"')
      .and.contain('metadata.metadataPointOfContact.role | should match pattern "^metadataPointOfContact$"');
  });

  it("should not validate metadata with empty resourceType", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.resourceType = "";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("metadata.resourceType | should NOT be shorter than 1 characters");
  });

  it("should not validate metadata with an invalid boundingBox", () => {
    let p = Fixtures.GetTestProduct();
    p.metadata.boundingBox = {
      north: 57.7062934711795,
      south: 57.7960680443262,
      east: -4.0203233299185,
      west: -3.85220733512446
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(2)
      .and.contain("metadata.boundingBox | north should be greater than south")
      .and.contain("metadata.boundingBox | east should be greater than west");
  });
});

describe("Data Validator", () => {
  let mockRepo = Fixtures.GetMockCollectionStore();
  let validator = new ProductValidator(mockRepo.object);

  it("should not validate an s3 data group with missing region", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        s3: {
          region: "",
          bucket: "missing-region",
          key: "/test.tif"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("data['product'].s3.region | should NOT be shorter than 1 characters");
  });

  it("should not validate an s3 data group with missing bucket", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        s3: {
          region: "missing-bucket",
          bucket: "",
          key: "/test.tif"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("data['product'].s3.bucket | should NOT be shorter than 1 characters");
  });

  it("should not validate an s3 data group with missing key", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        s3: {
          region: "missing-key",
          bucket: "missing-key",
          key: ""
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("data['product'].s3.key | should NOT be shorter than 1 characters");
  });

  it("should validate an s3 data group with additonal ^.*data$ properties", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        s3: {
          region: "test",
          bucket: "test",
          key: "test"
        }
      },
      preview: {
        title: "test-title",
        s3: {
          region: "test",
          bucket: "test",
          key: "test"
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

  it("should validate a valid wfs service data group", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wfs: {
          name: "layer",
          url: "http://example.com/ogc/wfs"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  })

  it("should not validate a wfs service data group with no name", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wfs: {
          name: "",
          url: "http://example.com/ogc/wfs"
        }
      }
    };

    validator.validate(p).catch((x) => console.log(x))

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].wfs.name | should NOT be shorter than 1 characters');
  })

  it("should not validate a wfs service data group with an invalid url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wfs: {
          name: "layer",
          url: "/example.com/ogc/wfs"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].wfs.url | should match format "uri"')
  })

  it("should not validate a wfs service data group with a blank url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wfs: {
          name: "layer",
          url: ""
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].wfs.url | should match format "uri"')
  })

  //wms

  it("should validate a valid wms service data group", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wms: {
          name: "layer",
          url: "http://example.com/ogc/wfs"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  })

  it("should not validate a wms service data group with no name", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wms: {
          name: "",
          url: "http://example.com/ogc/wfs"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].wms.name | should NOT be shorter than 1 characters');
  })

  it("should not validate a wms service data group with an invalid url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wms: {
          name: "layer",
          url: "/example.com/ogc/wfs"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].wms.url | should match format "uri"')
  })

  it("should not validate a wms service data group with a blank url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        wms: {
          name: "layer",
          url: ""
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].wms.url | should match format "uri"')
  })

  it("should not validate an ftp data group with an invalid server URI", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        ftp: {
          server: "",
          path: "/mising/server.file"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(4)
      .and.contain('data[\'product\'].ftp.server | should match format \"hostname\"')
      .and.contain('data[\'product\'].ftp.server | should match format \"ipv6\"')
      .and.contain('data[\'product\'].ftp.server | should match format \"uri\"')
      .and.contain("data['product'].ftp.server | should match exactly one schema in oneOf");
  });

  it("should not validate an ftp data group with missing path", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        ftp: {
          server: "missing.path.com",
          path: ""
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("data['product'].ftp.path | should NOT be shorter than 1 characters");
  });

  it("should validate an ftp data group with a server as a hostname", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        ftp: {
          server: "hostname.present",
          path: "path/to/file.txt"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate an ftp data group with a server as a uri", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        ftp: {
          server: "ftp://hostname.present:24",
          path: "path/to/file.txt"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate an ftp data group with a server as a ipv4", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        ftp: {
          server: "192.168.1.1",
          path: "path/to/file.txt"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate an ftp data group with a server as a ipv6", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        ftp: {
          server: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
          path: "path/to/file.txt"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate a catalog data group with a valid collection", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "test/collection"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate a catalog data group with a valid collection and product", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "test/collection",
          product: "test-product"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate a catalog data group with a valid collection and url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "test/collection",
          url: "http://example.com/catalog"
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should not validate a catalog data group with a blank collection", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: ""
        }
      }
    };

    return chai.expect(validator.validate(p))
    .to.be.rejected
    .and.eventually.have.length(2)
    .and.contain('data[\'product\'].catalog.collection | should NOT be shorter than 1 characters');
  });

  it("should not validate a catalog data group with an invalid collection name", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "#####"
        }
      }
    };

    return chai.expect(validator.validate(p))
    .to.be.rejected
    .and.eventually.have.length(1)
    .and.contain('data[\'product\'].catalog.collection | should match pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"')
  });

  it("should not validate a catalog data group with a collection name containing wild cards", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "*test/valid/pat*h/1/2/345aa*"
        }
      }
    };

    return chai.expect(validator.validate(p))
    .to.be.rejected
    .and.eventually.have.length(1)
    .and.contain('data[\'product\'].catalog.collection | should match pattern "^(([A-Za-z0-9-_.]+)(/))*([A-Za-z0-9-_.])+$"')
  });

  it("should not validate a catalog data group with a blank product name", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "test/collection",
          product: ""
        }
      }
    };

    return chai.expect(validator.validate(p))
    .to.be.rejected
    .and.eventually.have.length(2)
    .and.contain('data[\'product\'].catalog.product | should NOT be shorter than 1 characters')
  });

  it("should not validate a catalog data group with an invalid product name", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "test/collection",
          product: "!#!##"
        }
      }
    };

    return chai.expect(validator.validate(p))
    .to.be.rejected
    .and.eventually.have.length(1)
    .and.contain('data[\'product\'].catalog.product | should match pattern "^([A-Za-z0-9-_.])+$"')
  });

  it("should not validate a catalog data group with an invalid url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        catalog: {
          collection: "test/collection",
          url: "!! Gibberish/.com"
        }
      }
    };

    return chai.expect(validator.validate(p))
    .to.be.rejected
    .and.eventually.have.length(1)
    .and.contain('data[\'product\'].catalog.url | should match format "uri"')
  });

  it("should validate an http data group with a valid url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        http: {
          url: "https://test.com/test.zip",
        }
      }
    };

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should not validate an http data group with an invalid url", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        http: {
          url: "IAM_BAD!",
        }
      }
    };

    return chai.expect(validator.validate(p))
      .to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].http.url | should match format "url"');
  });

  it("should validate a http data group with a valid size and type", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        http: {
          url: "http://test.com/test.zip",
          size: 1231455,
          type: "application/zip"
        }
      }
    };

    return chai.expect(validator.validate(p))
      .to.be.fulfilled;
  });

  it("should not validate a http data group with an invalid size", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        http: {
          url: "http://test.com/test.zip",
          size: -1231455,
          type: "application/zip"
        }
      }
    };

    return chai.expect(validator.validate(p))
      .to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].http.size | should be >= 1');
  });

  it("should not validate an http data group with empty type", () => {
    let p = Fixtures.GetTestProduct();
    p.data = {
      product: {
        title: "test-title",
        http: {
          url: "http://test.com/test.zip",
          size: 1231455,
          type: ""
        }
      }
    };

    return chai.expect(validator.validate(p))
      .to.be.rejected
      .and.eventually.have.length(1)
      .and.contain('data[\'product\'].http.type | should NOT be shorter than 1 characters');
  });
});

describe("Footprint Validator", () => {
  let mockRepo = Fixtures.GetMockCollectionStore();
  let validator = new ProductValidator(mockRepo.object);

  it("should not validate a invalid GeoJSON blob", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = {
      type: "Bobbins",
      coordinates: [
        [-3.252708444643698, 55.01808601299337],
        [-3.096345813599173, 55.01959554822891],
        [-3.098805121795129, 55.1094396249146],
        [-3.25551820944467, 55.10792506925024],
        [-3.252708444643698, 55.01808601299337]
      ],
      crs: {
        properties: {
          name: "mine"
        },
        type: "name"
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(3);
  });

  it("should not validate a non Multipolygon footprint", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = {
      type: "Polygon",
      coordinates: [[
        [-3.252708444643698, 55.01808601299337],
        [-3.096345813599173, 55.01959554822891],
        [-3.098805121795129, 55.1094396249146],
        [-3.25551820944467, 55.10792506925024],
        [-3.252708444643698, 55.01808601299337]
      ]],
      crs: {
        properties: {
          name: "urn:ogc:def:crs:OGC:1.3:CRS84"
        },
        type: "name"
      }
    };

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("footprint.type | should be 'MultiPolygon'");
  });

  it("should not validate a missing CRS", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    delete p.footprint.crs;

    return chai.expect(validator.validate(p)).to.be.rejected;
  });

  it("should not validate a non WGS84 CRS", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint.crs.properties.name = "EPSG:27700";

    return chai.expect(validator.validate(p)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("footprint.crs.properties.name | should be 'EPSG:4326' / 'urn:ogc:def:crs:OGC:1.3:CRS84' / 'urn:ogc:def:crs:EPSG::4326'");
  });

  it("should validate a CRS as EPSG:4326", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint.crs.properties.name = "EPSG:4326";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate a CRS as urn:ogc:def:crs:OGC:1.3:CRS84", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint.crs.properties.name = "urn:ogc:def:crs:OGC:1.3:CRS84";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });

  it("should validate a CRS as urn:ogc:def:crs:EPSG::4326", () => {
    let p = Fixtures.GetTestProduct();
    p.footprint = Fixtures.GetFootprint();
    p.footprint.crs.properties.name = "urn:ogc:def:crs:EPSG::4326";

    return chai.expect(validator.validate(p)).to.be.fulfilled;
  });
});

describe("Product Properties Validator", () => {
  let mr: TypeMoq.IMock<CollectionStore>;

  beforeEach(() => {
    mr = TypeMoq.Mock.ofType(CollectionStore);
  });

  it("should validate a product with an valid properties collection", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        required: ["externalId"],
        properties: {
          externalId: {
            type: "integer"
          }
        },
        additionalProperties: false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      externalId: 1145234
    };

    return chai.expect(v2.validate(product)).to.be.fulfilled;
  });

  it("should validate a product with an valid properties collection - formatted string types", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        required: ["externalId"],
        properties: {
          externalId: {
            type: "string",
            format: "uuid"
          },
          datetime: {
            type: "string",
            format: "date-time"
          }
        },
        additionalProperties: false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      externalId: "cdc1c5c4-0940-457e-8583-e1cd45b0a5a3",
      datetime: "2017-06-28T00:00:00Z"
    };

    return chai.expect(v2.validate(product)).to.be.fulfilled;
  });

  it("should not validate a product with an invalid properties collection - non-matching definitions", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        required: ["externalId"],
        properties: {
          externalId: {
            type: "string",
            minLength: 1
          }
        },
        additionalProperties: false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      externalId: 1145234
    };

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("properties.externalId | should be string");
  });

  it("should not validate a product with an bad properties collection - formatted string types", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        required: ["externalId"],
        properties: {
          externalId: {
            type: "string",
            format: "uuid"
          },
          datetime: {
            type: "string",
            format: "date-time"
          }
        },
        additionalProperties: false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      externalId: "not-a-uuid",
      datetime: "2017-06-28"
    };

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(2)
      .and.contain('properties.externalId | should match format "uuid"')
      .and.contain('properties.datetime | should match format "date-time"');
  });

  it("should not validate a product with an invalid properties collection - missing definitions", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        required: ["externalId"],
        properties: {
          externalId: {
            type: "string",
            minLength: 1
          }
        },
        additionalProperties: false
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {};

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(1)
      .and.contain("properties | should have required property 'externalId'");
  });

  it("Should not validate invalid dates", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        properties: {
          date: {
            type: "string",
            format: "date-time",
            fullDateValidation: true
          },
        },
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      date: "2015-02-29T00:00:00Z"
    };

    return chai.expect(v2.validate(product)).to.be.rejected
      .and.eventually.have.length(1);
  });

  it("Should validate valid dates", () => {

    mr.setup((x) => x.getCollection(TypeMoq.It.isAnyString())).returns((x, y) => {
      let c: Collection.ICollection = Fixtures.GetCollection();
      c.productsSchema = {
        type: "object",
        title: "Properties",
        $async: true,
        $schema: "http://json-schema.org/draft-07/schema#",
        properties: {
          date: {
            type: "string",
            format: "date-time",
            fullDateValidation: true
          },
        },
      };
      return Promise.resolve(c);
    });

    let v2 = new ProductValidator(mr.object);

    const product = Fixtures.GetTestProduct();
    product.properties = {
      date: "2015-02-12T00:00:00Z"
    };

    return chai.expect(v2.validate(product)).to.eventually.be.empty;
  });
});


