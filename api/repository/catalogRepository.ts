import { Product } from "../definitions/product/product"
import { Database } from "./database";
import * as squel from "squel";

export class CatalogRepository {

    buildQuery(baseQuery: any, footprint: string | undefined, spatialop: string | undefined, properties: any) {
        if (footprint !== undefined) {
            // Do spatial search
            if (spatialop !== undefined && spatialop === 'within') {
                baseQuery.where('ST_Within(ST_GeomFromText($2, 4326), footprint)');
            } else {
                baseQuery.where('ST_Overlaps(ST_GeomFromText($2, 4326), footprint)');
            }
        }

        if (Object.keys(properties).length > 0) {
            baseQuery.where('properties @> $3');
        }

        return baseQuery;
    }

    getProducts(name: string, limit: number, offset: number, footprint: string | undefined, spatialop: string | undefined, properties: any): Promise<Array<Product>> {
        // Replace wildcard characters in the name
        name = name.replace('*', '%');
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
            baseQuery = this.buildQuery(baseQuery, footprint, spatialop, properties);
            // Run and return results
            console.log(baseQuery.toString());
            return t.any(baseQuery.toString(), [name, footprint, properties]);
        }).catch(error => {
            console.log("database error : " + error)
            throw new Error(error)
        })
    }

    getProduct(collection: string, name: string): Promise<Product> {
        return Database.instance.connection.task(t => {
            return t.one('SELECT product.* FROM product INNER JOIN collection ON collection.id = product.collection_id WHERE collection.name = $1 AND product.name = $2', [collection, name], x => x);
        }).catch(error => {
            console.log("database error : " + error);
            throw new Error(error);
        })
    }

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

    checkCollectionNameExists(errors: Array<string>, collectionName: string) {
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
