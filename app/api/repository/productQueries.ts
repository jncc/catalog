import * as knex from 'knex';
import * as query from "../query";
import { Database } from  "./database"
import { IProduct } from "../definitions/product/product";

export class ProductQueries {

  public getCountOfProductsByCollection(query: query.Query): Promise<any> {
    let dbQuery = this.getBaseQuery(query)
      .select("collectionName")
      .count("*", {as: 'products'})
      .groupBy("collectionName")

    return dbQuery;
  }


  // Todo - Convert to new knex query
  public getProductsTotal(query: query.Query): Promise<number> {
    throw new Error("Not implmented")
  }

  public getProducts(query: query.Query): Promise<IProduct[]> {
    let qb = Database.instance.queryBuilder;

    let dbQuery = this.getBaseQuery(query)
      .column('id',
        'name',
        {collectionName: 'collection_name'},
        'metadata',
        'properties',
        'data',
        {footprint: qb.raw('ST_AsGeoJSON(footprint)') })
      .orderBy('full_name')
      .limit(query.limit)
      .offset(query.offset)
      .select();

    return dbQuery;
  }

  private getBaseQuery(query: query.Query): knex.QueryBuilder<IProduct, any> {
    let qb = Database.instance.queryBuilder;

    let baseQuery = qb<IProduct>("product_view")
      .modify(qb => {
        if (query.collections.length = 1) {
          qb.where("collection_name", query.collections[0]);
        } else if (query.collections.length > 1) {
          qb.whereIn("collection_name", query.collections);
        }
      })
      .modify(qb => {
        if (query.productName.indexOf("*") > -1) {
          let likeTerm = query.productName.replace(/\*/g, "%");
          qb.where("name", "LIKE", likeTerm)
        } else {
          qb.where("name", query.productName)
        }
      })
      .modify(qb => {
        if (query.footprint !== "") {
          if (query.spatialop === "within") {
            qb.whereRaw("ST_Within(ST_GeomFromText(?, 4326), footprint)", [query.footprint]);
          } else if (query.spatialop === "overlaps") {
            qb.whereRaw("ST_Overlaps(ST_GeomFromText(?, 4326), footprint)", [query.footprint]);
          } else {
            qb.whereRaw("ST_Intersects(ST_GeomFromText(?, 4326), footprint)", [query.footprint]);
          }
        }
      })
      .modify(qb => {
        if (query.terms.length > 0) {
          query.terms.forEach((term) => {
            let op = [">","<","=",">=","<="].find(x => x === term.operation)

            if (op == undefined) throw Error("Invalid operation")

            if (query.types[term.property] === "date-time") {
              qb.whereRaw(`(properties->>?)::TIMESTAMP ${op} ?`, [term.property, term.value]);
            } else if (query.types[term.property] === "date") {
              qb.whereRaw(`to_date(properties->>?, 'YYYY-MM-DD') ${op} ?`, [term.property, term.value]);
            } else if (query.types[term.property] === "int") {
              qb.whereRaw(`(properties->>?)::INT ${op} ?`, [term.property, term.value]);
            } else if (query.types[term.property] === "double") {
              qb.whereRaw(`(properties->>?)::DOUBLE ${op} ?`, [term.property, term.value]);
            } else if (op === "="){
              qb.where("(properties->>?) = ?", [term.property, term.value]);
            } else {
              throw new Error("Invalid operation")
            }
          });
        }
      })

    return baseQuery;
  }
}

