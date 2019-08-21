import { IProduct } from "../definitions/product/product";
import { ICollection } from "../definitions/collection/collection";
import { Database } from  "./database"
import { Logger } from "../logging/logger";
import winston = require('winston');
import { CollectionQueries } from "./collectionQueries";

export class ProductStore {
  private logger: winston.Logger

  constructor() {
    this.logger = Logger.Logger()
  }

  public async storeProduct(product: IProduct): Promise<any[]> {
    let qb = Database.instance.queryBuilder;

    let collection = await qb<ICollection>("collection").where("name", product.collectionName).first("id")

    if (collection === undefined) {
      throw new Error("error retriving collection")
    } else {
      let x = qb("product").insert({
        collection_id: collection.id,
        metadata: JSON.stringify(product.metadata),
        properties: JSON.stringify(product.properties),
        data: JSON.stringify(product.data),
        footprint: qb.raw("ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)", JSON.stringify(product.footprint)),
        name: product.name
      }).returning("id")

      return x;
    }
  }

}
