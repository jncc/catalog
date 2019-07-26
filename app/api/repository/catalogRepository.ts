import * as squel from "squel";
import * as Query from "../query";

import { ICollection } from "../definitions/collection/collection";
import { IProduct } from "../definitions/product/product";

import { Database } from "./database";
import * as winston from "winston";

// todo: handle database errors nicely

export class CatalogRepository {
  logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  public getCollections(query: Query.Query, limit: number, offset: number): Promise<ICollection[]> {
    return Database.instance.connection.task((t) => {
      let baseQuery = squel.select({ numberedParameters: true })
        .from("collection")
        .field("id").field("name").field("metadata").field("products_schema", "productsSchema")
        .field("ST_AsGeoJSON(footprint)", "footprint")
        .order("name")
        .limit(limit)
        .offset(offset);

      baseQuery = this.buildLikeQuery(baseQuery, "name", query.collection);

      baseQuery = this.buildQuery(baseQuery, query);

      return t.any(baseQuery.toParam());
    }).catch((error) => {
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
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
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
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
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
    });
  }

  public getProductsTotal(query: Query.Query): Promise<number> {
    return Database.instance.connection.task((t) => {
      // Build base query
      let baseQuery = squel.select({ numberedParameters: true })
        .from("product_view")
        .field("count(*)", 'total')
        // .where("full_name LIKE ?", collectionName)
        .where("collection_name = ?", query.collection)

      // Add like query for name if applicable
      baseQuery = this.buildLikeQuery(baseQuery, "name", query.productName);
      // Add optional arguments and filters
      baseQuery = this.buildQuery(baseQuery, query);
      // Run and return results
      return t.any(baseQuery.toParam());
    }).catch((error) => {
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
    });
  }

  public getProducts(query: Query.Query): Promise<IProduct[]> {
    return Database.instance.connection.task((t) => {
      // Build base query
      let baseQuery = squel.select({ numberedParameters: true })
        .from("product_view")
        .field("id").field("name").field("collection_name", "collectionName").field("metadata")
        .field("properties").field("data").field("ST_AsGeoJSON(footprint)", "footprint")
        // .where("full_name LIKE ?", collectionName) <--Don't do this, it leads to ambiguous results as the diversity of collctions increases
        .where("collection_name = ?", query.collection)
        .order("full_name")
        .limit(query.limit)
        .offset(query.offset);

      // Add like query on product name
      baseQuery = this.buildLikeQuery(baseQuery,"name", query.productName)

      // Add optional arguments and filters
      baseQuery = this.buildQuery(baseQuery, query);
      // Run and return results
      return t.any(baseQuery.toParam());
    }).catch((error) => {
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
    });
  }

  public storeProduct(product: IProduct): Promise<string> {
    return Database.instance.connection.task((t) => {
      let squelPostgres = squel.useFlavour('postgres');
      return t.one("select id from collection where name = $1", product.collectionName, (x) => x && x.id)
        .then((collectionId) => {
          return t.one(squelPostgres.insert()
            .into("product")
            .set("collection_id", collectionId)
            .set("metadata", JSON.stringify(product.metadata))
            .set("properties", JSON.stringify(product.properties))
            .set("data", JSON.stringify(product.data))
            .set("footprint", squelPostgres.str("ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)", JSON.stringify(product.footprint)))
            .set("name", product.name).returning("id")
            .toString(), null, (x) => x.id);
        });
    }).catch((error) => {
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
    });
  }

  /**
   * Build a like condition if required for a named field determined by
   * the test value containing a *
   *
   * @param baseQuery The base SQUEL query to build upon
   * @param propName The fieldName to create the condition for
   * @param term The value to test for wildcards
   */
  public buildLikeQuery(baseQuery: any, propName: string, term: string) {
    if (term.indexOf("*") > -1) {
      let likeTerm = term.replace(/\*/g, "%");
      baseQuery.where(propName + " LIKE ?", likeTerm)
    } else {
      baseQuery.where(propName + " = ?", term)
    }

    return baseQuery
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
        baseQuery.where("ST_Within(ST_GeomFromText(?, 4326), footprint)", query.footprint);
      } else if (query.spatialop === "overlaps") {
        baseQuery.where("ST_Overlaps(ST_GeomFromText(?, 4326), footprint)", query.footprint);
      } else {
        baseQuery.where("ST_Intersects(ST_GeomFromText(?, 4326), footprint)", query.footprint);
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
      this.logger.error("database error : " + error);
      throw this.createDatabaseError(error);
    });
  }

  private createDatabaseError(error: any): Error {
    return new Error("A database error has occurred");
  }
}
