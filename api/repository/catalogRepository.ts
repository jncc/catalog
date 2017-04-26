import { Product } from "../product/product"
import { Database } from "./database";


export class CatalogRepository {

    getProducts(name: string, limit: number, offset: number): Promise<Array<Product>> {
        return Database.instance.connection.task(t => {
            name = name + '%';
            return t.any('SELECT p.id, p.name, collection_id as "collectionId", c.name as "collectionName", p.metadata, p.properties, p.data, ST_ASGeoJSON(p.footprint) as "footprint" FROM product p INNER JOIN collection c ON p.collection_id = c.id WHERE c.name LIKE $1 ORDER BY c.name, p.name LIMIT $2 OFFSET $3', [name, limit, offset]);
        }).catch(error => {
            console.log("database error : " + error)
            throw new Error(error)
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
}
