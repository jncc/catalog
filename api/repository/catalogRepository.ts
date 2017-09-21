import * as squel from "squel";
import * as Query from "../query";
import * as QueryValidator from "../validation/queryValidator";

import { ICollection } from "../definitions/collection/collection";
import { IProduct } from "../definitions/product/product";

import { Database } from "./database";

// todo: handle database errors nicely

export class CatalogRepository {
  public getCollections(query: Query.Query, limit: number, offset: number): Promise<ICollection[]> {
    let collectionName = query.collection.replace(/\*/g, "%");
    return Database.instance.connection.task((t) => {
      let baseQuery = squel.select({ numberedParameters: true })
        .from("collection")
        .field("id").field("name").field("metadata").field("products_schema", "productsSchema")
        .field("ST_AsGeoJSON(footprint)", "footprint")
        .where("name LIKE ?", collectionName)
        .order("name")
        .limit(limit)
        .offset(offset);

      baseQuery = this.buildQuery(baseQuery, query);
      return t.any(baseQuery.toParam());
    }).catch((error) => {
      throw new Error(error);
    });
  }

  public getCollection(name: string): Promise<ICollection> {
    return Database.instance.connection.task((t) => {
      let baseQuery = squel.select({ numberedParameters: true })
        .from("collection")
        .field("id").field("name").field("metadata").field("products_schema", "productsSchema")
        .field("ST_AsGeoJSON(footprint)", "footprint")
        .where("name = ?", name);

      return t.oneOrNone(baseQuery.toParam());
    }).catch((error) => {
      console.log("database error : " + error);
      throw new Error(error);
    });
  }

  public checkCollectionNameExists(errors: string[], collectionName: string): Promise<string[]> {
    return Database.instance.connection.task((t) => {
      return t.oneOrNone("select name from collection where name = $1", [collectionName], (x) => x && x.name)
        .then((name) => {
          if (name === null || name === undefined) {
            errors.push(" | collection name does not exist in the database");
          }
          return errors;
        });
    }).catch((error) => {
      console.log("database error : " + error);
      throw new Error(error);
    });
  }

  public getProducts(query: Query.Query): Promise<IProduct[]> {
    // Replace wildcard characters in the name
    let productName = query.productName.replace(/\*/g, "%");

    return Database.instance.connection.task((t) => {
      // Build base query
      let baseQuery = squel.select({ numberedParameters: true })
        .from("product_view")
        .field("id").field("name").field("collection_name", "collectionName").field("metadata")
        .field("properties").field("data").field("ST_AsGeoJSON(footprint)", "footprint")
        // .where("full_name LIKE ?", collectionName)
        .where("collection_name = ?", query.collection)
        .where("name LIKE ?", productName)
        .order("full_name")
        .limit(query.limit)
        .offset(query.offset);

      // Add optional arguments and filters
      baseQuery = this.buildQuery(baseQuery, query);
      // Run and return results
      console.log(baseQuery.toParam());
      return t.any(baseQuery.toParam());
    }).catch((error) => {
      console.log("database error : " + error);
      throw new Error(error);
    });
  }

  public storeProduct(product: IProduct): Promise<string> {
    return Database.instance.connection.task((t) => {
      return t.one("select id from collection where name = $1", product.collectionName, (x) => x && x.id)
        .then((collectionId) => {
          return t.one(squel.insert({ numberedParameters: true })
            .into("product")
            .set("collection_id", collectionId)
            .set("metadata", product.metadata)
            .set("properties", product.properties)
            .set("data", product.data)
            .set("footprint", squel.str("ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)", product.footprint))
            .set("name", product.name).toParam(), (x) => x.id);
          // return t.one("INSERT INTO product(collection_id, metadata, properties, data, footprint, name) \
          //           VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromGeoJSON($5), 4326), $6) \
          //           RETURNING id",
          //   [collectionId, product.metadata, product.properties, product.data, product.footprint, product.name],
          //   (x) => x.id);
        });
    }).catch((error) => {
      console.log("database error : " + error);
      throw new Error(error);
    });
  }

  /**
   * Build a date time query for a property with a given name
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propName The property name to search on
   * @param term The term to search on (must be a UTC timestamp)
   * @param operation The operation to search with (must be one of the following; >=,>,=,<,<=)
   */
  private buildDateTimeQuery(baseQuery: any, propName: string, term: string, operation: string) {
    if (operation === ">") {
      baseQuery.where("(properties->>?)::TIMESTAMP > ?", propName, term);
    } else if (operation === ">=") {
      baseQuery.where("(properties->>?)::TIMESTAMP >= ?", propName, term);
    } else if (operation === "=") {
      baseQuery.where("(properties->>?)::TIMESTAMP = ?", propName, term);
    } else if (operation === "<=") {
      baseQuery.where("(properties->>?)::TIMESTAMP <= ?", propName, term);
    } else if (operation === ">") {
      baseQuery.where("(properties->>?)::TIMESTAMP > ?", propName, term);
    }

    return baseQuery;
  }

  /**
   * Build a date query for a property with a given name
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propName The property name to search on
   * @param term The term to search on (must be a YYYY-MM-DD formatted string)
   * @param operation The operation to search with (must be one of the following; >=,>,=,<,<=)
   */
  private buildDateQuery(baseQuery: any, propName: string, term: string, operation: string) {
    if (operation === ">") {
      baseQuery.where("to_date(properties->>?, 'YYYY-MM-DD') > ?", propName, term);
    } else if (operation === ">=") {
      baseQuery.where("to_date(properties->>?, 'YYYY-MM-DD') >= ?", propName, term);
    } else if (operation === "=") {
      baseQuery.where("to_date(properties->>?, 'YYYY-MM-DD') = ?", propName, term);
    } else if (operation === "<=") {
      baseQuery.where("to_date(properties->>?, 'YYYY-MM-DD') <= ?", propName, term);
    } else if (operation === ">") {
      baseQuery.where("to_date(properties->>?, 'YYYY-MM-DD') > ?", propName, term);
    }

    return baseQuery;
  }

  /**
   * Build an integer query for a property with a given name
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propName The property name to search on
   * @param term The term to search on (must be an integer)
   * @param operation The operation to search with (must be one of the following; >=,>,=,<,<=)
   */
  private buildIntegerQuery(baseQuery: any, propName: string, term: number, operation: string) {
    if (operation === ">") {
      baseQuery.where("(properties->>?)::INT > ?", propName, term);
    } else if (operation === ">=") {
      baseQuery.where("(properties->>?)::INT >= ?", propName, term);
    } else if (operation === "=") {
      baseQuery.where("(properties->>?)::INT = ?", propName, term);
    } else if (operation === "<=") {
      baseQuery.where("(properties->>?)::INT <= ?", propName, term);
    } else if (operation === ">") {
      baseQuery.where("(properties->>?)::INT > ?", propName, term);
    }

    return baseQuery;
  }

  /**
   * Build a double / float query for a property with a given name
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propName The property name to search on
   * @param term The term to search on (must be a double or floating point number)
   * @param operation The operation to search with (must be one of the following; >=,>,=,<,<=)
   */
  private buildDoubleQuery(baseQuery: any, propName: string, term: number, operation: string) {
    if (operation === ">") {
      baseQuery.where("(properties->>?)::DOUBLE > ?", propName, term);
    } else if (operation === ">=") {
      baseQuery.where("(properties->>?)::DOUBLE >= ?", propName, term);
    } else if (operation === "=") {
      baseQuery.where("(properties->>?)::DOUBLE = ?", propName, term);
    } else if (operation === "<=") {
      baseQuery.where("(properties->>?)::DOUBLE <= ?", propName, term);
    } else if (operation === ">") {
      baseQuery.where("(properties->>?)::DOUBLE > ?", propName, term);
    }

    return baseQuery;
  }

  /**
   * Build a basic string query for a property with a given name, currently only equality is
   * handled, more advanced searching may happen later on
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propName The property name to search on
   * @param term The term to search on (must be a string)
   * @param operation The operation to search with (must be on of hte following; =)
   */
  private buildStringQuery(baseQuery: any, propName: string, term: string, operation: string) {
    if (operation === "=") {
      baseQuery.where("(properties->>?) = ?", propName, term);
    }

    return baseQuery;
  }

  /**
   * Build a spatial query
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propNameString The property name to search on (generally footprint)
   * @param spatialop The spatial operation to carry out when searching (within or overlaps, defaults to intersects)
   * @param geom The geometry defined in WKT in EPSG:4326
   */
  private buildSpatialQuery(baseQuery: any, propNameString: string, query: Query.Query) {
    // Do spatial search
    if (query.spatialop !== "") {
      if (query.spatialop === "within") {
        baseQuery.where("ST_Within(ST_GeomFromText(?, 4326), ?)", query.footprint, propNameString);
      } else if (query.spatialop === "overlaps") {
        baseQuery.where("ST_Overlaps(ST_GeomFromText(?, 4326), ?)", query.footprint, propNameString);
      } else {
        baseQuery.where("ST_Intersects(ST_GeomFromText(?, 4326), ?)", query.footprint, propNameString);
      }
    }

    return baseQuery;
  }

  private buildQuery(baseQuery: any, query: Query.Query) {
    // Build footprint query element
    if (query.footprint !== "") {
      baseQuery = this.buildSpatialQuery(baseQuery, "footprint", query);
    }
    // Build property query elements
    query.terms.forEach((term) => {
      if (query.types[term.property] === "date-time") {
        baseQuery = this.buildDateTimeQuery(baseQuery, term.property, term.value, term.operation);
      } else if (query.types[term.property] === "date") {
        baseQuery = this.buildDateQuery(baseQuery, term.property, term.value, term.operation);
      } else if (query.types[term.property] === "int") {
        baseQuery = this.buildIntegerQuery(baseQuery, term.property, Number(term.value), term.operation);
      } else if (query.types[term.property] === "double") {
        baseQuery = this.buildDoubleQuery(baseQuery, term.property, Number(term.value), term.operation);
      } else {
        baseQuery = this.buildStringQuery(baseQuery, term.property, term.value, term.operation);
      }
    });

    return baseQuery;
  }

  private geometryForceRHR(geojson: any): Promise<string> {
    return Database.instance.connection.task((t) => {
      return t.one("select st_asgeojson(st_forcerhr(st_geomfromgeojson($1)))", [geojson]);
    }).catch((error) => {
      console.log("database error : " + error);
      throw new Error(error);
    });
  }
}
