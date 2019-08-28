import { Database } from  "./database"
import { ICollection } from "../definitions/collection/collection"
import { CollectionQuery } from "../query/collectionQuery";

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
