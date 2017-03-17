import { Product } from "./product";

/* Throws an exception if the query isn't good. */
export function validateProduct(p: Product) {
    //collection name
        //defined
        //exists
    //name 
        //defined
        //is unique
    //metadata
        //defined
        //TODO: pinch petes metadata validation logic from TC
    //footprint
        //defined
        //valid geojason
        //4326 CRS defined
        //multipolygon
    //properties
        //defined
    //data
        //defined
        //has at least one valid entry
        
    if (!p.name || p.name.length === 0) {
        throw "Product name not specified";
    }

    // if (!o.collections || o.collections.length === 0) {
    //     throw "Query validation failed. No collection specified.";
    // }

    // if (!o.bbox) {
    //     throw "Query validation failed. No bbox specified.";
    // }

    // if (!Array.isArray(o.bbox)) {
    //     throw "Query validation failed. Bbox not array.";
    // }

    // if (o.bbox.length !== 4) {
    //     throw "Query validation failed. Bbox wrong length.";
    // }

    // todo.... more validations
}