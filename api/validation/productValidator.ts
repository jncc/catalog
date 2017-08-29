import * as ajv from "ajv";
import * as ajvasync from "ajv-async";
import * as Collection from "../definitions/collection/collection";
import * as Footprint from "../definitions/components/footprint";
import * as Metadata from "../definitions/components/metadata";
import * as Data from "../definitions/product/components/data/data";
import * as DataFiles from "../definitions/product/components/data/files";
import * as DataServices from "../definitions/product/components/data/services";
import * as Properties from "../definitions/product/components/properties";
import * as Product from "../definitions/product/product";
import { CatalogRepository } from "../repository/catalogRepository";
import * as ValidationHelper from "./validationHelper";

export class ProductValidator {
  constructor(private repository: CatalogRepository) { }

  private validateProductProperties(collection: Collection.Collection, product: Product.Product, errors: string[]): Promise<string[]> {
    let validator = ajv({ allErrors: true, formats: "full" });
    let asyncValidator = ajvasync(validator);

    let propertiesSchemaValidator = asyncValidator.compile(collection.productsSchema);

    let promise = new Promise((resolve, reject) => {
      propertiesSchemaValidator(product.properties)
        .then((e) => {
          resolve();
        }).catch((e) => {
          errors = errors.concat(ValidationHelper.reduceErrors(e.errors, "properties"));
          reject(errors);
        });
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
    return this.repository.checkCollectionNameExists(errors, product.collectionName).then((check) => {
      return this.repository.getCollection(product.collectionName).then((c) => {
        return this.validateProductProperties(c, product, errors);
      });
    });
  }

  validate(product: Product.Product): Promise<string[]> {
    let validator = ajv({ allErrors: true, formats: "full" });
    let asyncValidator = ajvasync(validator);

    let productSchemaValidator = asyncValidator.compile(Product.Schema);
    let errors: string[] = new Array<string>();

    let promise = new Promise((resolve, reject) => {
      productSchemaValidator(product)
        .then((e) => this.nonSchemaValidation(product, errors))
        .then((e) => {
          if (errors.length === 0) {
            resolve(errors);
          } else {
            reject(errors);
          }
        })
        .catch((e) => {
          if ("errors" in e) {
            // Return from an AJV promise
            errors = errors.concat(ValidationHelper.reduceErrors(e.errors));
          } else {
            // Return from a nonSchemaValidation promise
            errors = errors.concat(e);
          }
          reject(errors);
        });
    });

    return promise;
  }
}
