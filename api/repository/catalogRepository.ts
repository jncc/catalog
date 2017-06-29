import { Product } from "../definitions/product/product"
import { Collection } from "../definitions/collection/collection"
import { Database } from "./database";
import { Query } from "../query"
import * as squel from "squel";

export class CatalogRepository {

    buildQuery(baseQuery: any, footprint: string | undefined, spatialop: string | undefined, fromCaptureDate: Date | undefined, toCaptureDate: Date | undefined, properties: any | undefined) {
        if (footprint !== '') {
            // Do spatial search
            if (spatialop !== '') {
                if (spatialop === 'within') {
                    baseQuery.where('ST_Within(ST_GeomFromText($2, 4326), footprint)');
                } else if (spatialop === 'overlaps') {
                    baseQuery.where('ST_Overlaps(ST_GeomFromText($2, 4326), footprint)');
                } else {
                    baseQuery.where('ST_Intersects(ST_GeomFromText($2, 4326), footprint)');
                }
            }
        }

        if (fromCaptureDate && toCaptureDate) {
          baseQuery.where('to_date(properties->>\'capturedate\', \'YYYY-MM-DD\') BETWEEN $4 AND $5')
        }
        if (Object.keys(properties).length > 0) {
            baseQuery.where('properties @> $3');
        }

        return baseQuery;
    }

    getCollections(query: Query, limit: number, offset: number): Promise<Array<Collection>> {
        let collectionName = query.collection.replace('*', '%')
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


    getCollection(name: string):Promise<Collection> {
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
        let collectionName = query.collection.replace('*', '%')

        return Database.instance.connection.task(t => {
            // Build base query
            let baseQuery = squel.select()
                .from('product_view')
                .field('id').field('name').field('collection_name', 'collectionName').field('metadata').field('properties').field('data').field('ST_AsGeoJSON(footprint)', 'footprint')
                .where('full_name LIKE $1')
                .order('full_name')
                .limit(limit)
                .offset(offset)
            // Add optional arguments and filters
            baseQuery = this.buildQuery(baseQuery, query.footprint, query.spatialop, query.fromCaptureDate, query.toCaptureDate, query.productProperties);
            // Run and return results
            return t.any(baseQuery.toString(), [collectionName, query.footprint, query.productProperties, query.fromCaptureDate, query.toCaptureDate]);
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
                    VALUES ($1, $2, $3, $4, ST_GeomFromGeoJSON($5), $6) \
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
}
