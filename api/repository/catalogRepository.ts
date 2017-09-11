import { Product } from "../definitions/product/product"
import { Collection } from "../definitions/collection/collection"
import { Database } from "./database";
import { Query } from "../query"
import * as squel from "squel";

export class CatalogRepository {

  /**
   * Build a date time range query for a specific property in the database properties JSONB field, may build
   * a range query or a start greater than or end less than query depending on parameters
   *
   * @param baseQuery A SQUEL basequery object to build on
   * @param propNameString The property name in the JSONB field to search on
   * @param start (Optional) Start datetime to search from
   * @param end (Optional) End datetime to search to
   */
  buildDateTimeQuery(baseQuery: any, propNameString: string, start: Date | undefined, end: Date | undefined) {
    if (start && end) {
      baseQuery.where('(properties->>?)::TIMESTAMP BETWEEN ? AND ?', propNameString, start, end);
    } else if (start && !end) {
      baseQuery.where('(properties->>?)::TIMESTAMP >= ?', propNameString, start);
    } else if (!start && end) {
      baseQuery.where('(properties->>?)::TIMESTAMP <= ?', propNameString, end);
    }

    return baseQuery;
  }

  /**
   * Build a date time range query for specific properties in the database properties JSONB field, as a
   * to - from type query for individual objects
   *
   * @param baseQuery A SQUEL basequery object to build on
   * @param startPropNameString The name of the 'start' property in the JSONB field
   * @param start Start datetime to search from
   * @param endPropNameString  The name of the 'end' property in the JSONB field
   * @param end End datetime to search to
   */
  buildDateTimeRangeQuery(baseQuery: any, startPropNameString: string, start: Date | undefined, endPropNameString: string, end: Date | undefined) {
    if (start && end) {
      baseQuery.where('(properties->>?)::TIMESTAMP >= ? AND (properties->>?)::TIMESTAMP <= ?', startPropNameString, start, endPropNameString, end);
    }

    return baseQuery;
  }

  /**
   * Build a date range query for a specific property in the database properties JSONB field, may build
   * a range query or a start greater than or end less than query depending on parameters
   *
   * @param baseQuery A SQUEL basequery object to build on
   * @param propNameString The property name in the JSONB field to search on
   * @param start (Optional) Start date to search from
   * @param end (Optional) End date to search to
   */
  buildDateQuery(baseQuery: any, propNameString: string, start: Date | undefined, end: Date | undefined) {
    if (start && end) {
      baseQuery.where('to_date(properties->>?, \'YYYY-MM-DD\') BETWEEN ? AND ?', propNameString, start, end);
    } else if (start && !end) {
      baseQuery.where('to_date(properties->>?, \'YYYY-MM-DD\') >= ?', propNameString, start);
    } else if (!start && end) {
      baseQuery.where('to_date(properties->>?, \'YYYY-MM-DD\') <= ?', propNameString, end);
    }

    return baseQuery;
  }

  /**
   * Build a date range query for specific properties in the database properties JSONB field, as a
   * to - from type query for individual objects
   *
   * @param baseQuery A SQUEL basequery object to build on
   * @param startPropNameString The name of the 'start' property in the JSONB field
   * @param start Start date to search from
   * @param endPropNameString  The name of the 'end' property in the JSONB field
   * @param end End date to search to
   */
  buildDateRangeQuery(baseQuery: any, startPropNameString: string, start: Date | undefined, endPropNameString: string, end: Date | undefined) {
    if (start && end) {
      baseQuery.where('to_date(properties->>?, \'YYYY-MM-DD\') >= ? AND to_date(properties->>?, \'YYYY-MM-DD\') <= ?', startPropNameString, start, endPropNameString, end);
    }

    return baseQuery;
  }

  buildSpatialQuery(baseQuery: any, propNameString: string, spatialop: string | undefined, geom: string | undefined) {
    // Do spatial search
    if (spatialop !== '') {
      if (spatialop === 'within') {
        baseQuery.where('ST_Within(ST_GeomFromText(?, 4326), ?)', geom, propNameString);
      } else if (spatialop === 'overlaps') {
        baseQuery.where('ST_Overlaps(ST_GeomFromText(?, 4326), ?)', geom, propNameString);
      } else {
        baseQuery.where('ST_Intersects(ST_GeomFromText(?, 4326), ?)', geom, propNameString);
      }
    }

    return baseQuery;
  }


  buildQuery(baseQuery: any, footprint: string | undefined, spatialop: string | undefined, fromCaptureDate: Date | undefined, toCaptureDate: Date | undefined, properties: any | undefined) {
    if (footprint !== '') {
      baseQuery = this.buildSpatialQuery(baseQuery, 'footrpint', spatialop, footprint);
    }

    if (fromCaptureDate !== undefined || toCaptureDate !== undefined) {
      baseQuery = this.buildDateQuery(baseQuery, 'begin', fromCaptureDate, toCaptureDate);
    }

    // if (begin !== undefined || end !== undefined) {
    //   baseQuery = this.buildDateQuery(baseQuery, 'begin', toCaptureDate, fromCaptureDate);
    // }

    if (Object.keys(properties).length > 0) {
      baseQuery.where('properties @> $3');
    }

    return baseQuery;
  }

  getCollections(query: Query, limit: number, offset: number): Promise<Array<Collection>> {
    let collectionName = query.collection.replace(/\*/g, '%')
    return Database.instance.connection.task(t => {
      let baseQuery = squel.select()
        .from('collection')
        .field('id').field('name').field('metadata').field('products_schema', 'productsSchema').field('ST_AsGeoJSON(footprint)', 'footprint')
        .where('name LIKE $1')
        .order('name')
        .limit(limit)
        .offset(offset)

      baseQuery = this.buildQuery(baseQuery, query.footprint, query.spatialop, undefined, undefined, {})
      return t.any(baseQuery.toString(), [collectionName, query.footprint, query.productProperties]);
    }).catch(error => {
      console.log("database error : " + error)
      throw new Error(error)
    });
  }


  getCollection(name: string): Promise<Collection> {
    return Database.instance.connection.task(t => {
      let baseQuery = squel.select()
        .from('collection')
        .field('id').field('name').field('metadata').field('products_schema', 'productsSchema').field('ST_AsGeoJSON(footprint)', 'footprint')
        .where('name = $1')

      return t.oneOrNone(baseQuery.toString(), [name]);
    }).catch(error => {
      console.log("database error : " + error)
      throw new Error(error)
    });
  }

  getProducts(query: Query, limit: number, offset: number): Promise<Array<Product>> {
    // Replace wildcard characters in the name
    let collectionName = query.collection.replace(/\*/g, '%')

    return Database.instance.connection.task(t => {
      // Build base query
      let baseQuery = squel.select()
        .from('product_view')
        .field('id').field('name').field('collection_name', 'collectionName').field('metadata').field('properties').field('data').field('ST_AsGeoJSON(footprint)', 'footprint')
        .where('full_name LIKE ?', collectionName)
        .order('full_name')
        .limit(limit)
        .offset(offset)
      // Add optional arguments and filters
      baseQuery = this.buildQuery(baseQuery, query.footprint, query.spatialop, query.fromCaptureDate, query.toCaptureDate, query.productProperties);
      // Run and return results
      console.log(baseQuery.toParam({ numberedParameters: true }))
      return t.any(baseQuery.toParam({ numberedParameters: true }));
    }).catch(error => {
      console.log("database error : " + error)
      throw new Error(error)
    })
  }

  // getProduct(collection: string, name: string): Promise<Product> {
  //     return Database.instance.connection.task(t => {
  //         return t.one('SELECT product.* FROM product INNER JOIN collection ON collection.id = product.collection_id WHERE collection.name = $1 AND product.name = $2', [collection, name], x => x);
  //     }).catch(error => {
  //         console.log("database error : " + error);
  //         throw new Error(error);
  //     })
  // }

  storeProduct(product: Product): Promise<string> {
    return Database.instance.connection.task(t => {
      return t.one('select id from collection where name = $1', product.collectionName, x => x && x.id)
        .then(collectionId => {
          return t.one('INSERT INTO product(collection_id, metadata, properties, data, footprint, name) \
                    VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromGeoJSON($5), 4326), $6) \
                    RETURNING id',
            [collectionId, product.metadata, product.properties, product.data, product.footprint, product.name], x => x.id);
        });
    }).catch(error => {
      console.log("database error : " + error)
      throw new Error(error)
    });
  }

  checkCollectionNameExists(errors: Array<string>, collectionName: string): Promise<string[]> {
    return Database.instance.connection.task(t => {
      return t.oneOrNone('select name from collection where name = $1', [collectionName], x => x && x.name)
        .then(name => {
          if (name == null || name == undefined) {
            errors.push(' | collection name does not exist in the database')
          }
          return errors;
        });
    }).catch(error => {
      console.log("database error : " + error)
      throw new Error(error)
    });
  }

  geometryForceRHR(geojson: any): Promise<string> {
    return Database.instance.connection.task(t => {
      return t.one('select st_asgeojson(st_forcerhr(st_geomfromgeojson($1)))', [geojson])
    }).catch(error => {
      console.log("database error : " + error)
      throw new Error(error)
    });
  }
}
