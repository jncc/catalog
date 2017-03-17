import { Product } from "../product/product"
import { Database } from "./database";


export class CatalogRepository {

    storeProduct(product: Product): Promise<string> {

        return Database.instance.connection.task(t => {
            return t.one('select id from collection where name = $1', product.collectionName, x => x && x.id)
                .then(collectionId => {
                    return t.one('INSERT INTO product(collection_id, metadata, properties, data, footprint, name) \
                    VALUES ($1, $2, $3, $4, ST_GeomFromGeoJSON($5), $6) \
                    RETURNING id', 
                        [collectionId, product.metadata, product.properties, product.data, product.footprint, product.name], x => x.id);
                }); 
        });
    }
}
