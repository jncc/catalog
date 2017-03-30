import { Product } from "./product";
//import { GeoJSON } from "geojson";

//geoJson hint without json validation.
import geojsonhint = require("@mapbox/geojsonhint/lib/object")


function validateFootprint(f, errors:string[]){

    let result = geojsonhint.hint(f,{
        precisionWarning:false
    });

    result.forEach(e => {
        errors.push("footprint: " + e.message)
    });
    //TODO check valid CRS definition. EPSG:4326

}

/* Throws an exception if the query isn't good. */
export function validateProduct(p: Product): string[] {
    let errors:string[] = []

    //collection name
    if (!p.collectionName || p.collectionName.length === 0) {
        errors.push("collectionName not specified");
    }
        //exists

    //name 
    if (!p.name || p.name.length === 0) {
        errors.push("name not specified");
    }
        //is unique
    //metadata
    if (!p.metadata) {
        errors.push("metadata not specified");
    }
        //TODO: pinch petes metadata validation logic from TC
    //footprint
    if (!p.footprint) {
        errors.push("footprint not defined");
    }
    else {
        validateFootprint(p.footprint, errors);
    }

        //valid geojason
        //4326 CRS defined
        //multipolygon
    //properties
    if (!p.properties) {
        errors.push("properties not specified");
    }
        //defined

    //data  
    if (!p.data) {
        errors.push("data not specified");
    }
        //has at least one valid entry
    return errors;
}