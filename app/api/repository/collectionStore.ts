import { Database } from  "./database"
import { ICollection } from "../definitions/collection/collection"
import { CollectionQuery } from "../query/collectionQuery";

// Test reqs
import "mocha";
import "mocha-inline";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as TypeMoq from "typemoq";
import { Fixtures } from "../test/fixtures";
import { doesNotReject } from "assert";
import * as dotenv from 'dotenv';

export class CollectionStore {

  public checkMatchingProductSchema(collections:string[]) {
    let qb = Database.instance.queryBuilder;

    let schemaQuery =  qb("collection")
    .select("products_schema")
    .where("name", collections[0]);

    let query = qb<{count: number}>("collection")
    .count("*", {as: 'exceptions'})
    .whereIn("name", collections)
    .where("products_schema", "!=", schemaQuery);

    return query;
  }

  public getCollection(name: string): Promise<ICollection | undefined> {
    let qb = Database.instance.queryBuilder;

    let dbQuery =  qb<ICollection>("collection")
      .columns(
        "id",
        "name",
        "metadata",
        {productsSchema: "products_schema"},
        {footprint: qb.raw("ST_AsGeoJSON(footprint)")}
      )
      .where("name", name)
      .first();

    return dbQuery;
  }

  public getCollections(query: CollectionQuery): Promise<ICollection[]> {
    let qb = Database.instance.queryBuilder;

    let dbQuery = qb<ICollection>("collection")
      .column(
        "id",
        "name",
        "metadata",
        {productsSchema: "products_schema"},
        {footprint: qb.raw("ST_AsGeoJSON(footprint)")}
      )
      .modify(qb => {
        if (query.collection.indexOf("*") > -1) {
          let likeTerm = query.collection.replace(/\*/g, "%");
          qb.where("name", "LIKE", likeTerm)
        } else {
          qb.where("name", query.collection)
        }
      })
      .select();

      return dbQuery;

    }
}

//requires a database
describe.skip("Collection store", () => {
  dotenv.config({path: '../.env'});

  let c = new CollectionStore();

  it("should return a collection from the database", () => {
    return chai.expect(c.getCollection("scotland-gov/lidar/phase-2/dsm"))
      .to.be.fulfilled
      .and.eventually.be.an("object")
      .that.has.deep.property("name", "scotland-gov/lidar/phase-2/dsm")
  });

  it("should not return a collection that does not exist", () => {
    return chai.expect(c.getCollection("not/real"))
      .to.be.fulfilled
      .and.eventually.equal(undefined);
  });

});

