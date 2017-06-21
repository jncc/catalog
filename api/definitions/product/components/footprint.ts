import geojsonhint = require("@mapbox/geojsonhint/lib/object")

export interface Footprint {

};

export function fixCommonIssues(footprint: any) {
     // If CRS does not exist then push in default so it can be added to database
    if (footprint.crs == undefined) {
        //errors.push("footprint.crs | CRS must be specified")
        footprint['crs'] = {
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            },
            "type": "name"
        }
    }

    return footprint
}

export function nonSchemaValidation(footprint: any, errors: string[]) {
    let result = geojsonhint.hint(footprint, {
        precisionWarning: false
    });

    result.forEach(e => {
        if (e.message != 'old-style crs member is not recommended' &&
            e.message != 'old-style crs member is not recommended, this object is equivalent to the default and should be removed') {
            errors.push("footprint | " + e.message);
        }
    });

    if (footprint.type != 'MultiPolygon') {
        errors.push("footprint.type | should be 'MultiPolygon'");
    }

    // If CRS does not exist we should throw an error (it should always exist and is fixed in fixCommonIssues function)
    if (footprint.crs == undefined) {
        errors.push("footprint.crs | CRS must be specified")
    }

    if (footprint.crs != undefined &&
        footprint.crs.properties != undefined &&
        footprint.crs.properties.name != 'EPSG:4326' &&
        footprint.crs.properties.name != 'urn:ogc:def:crs:OGC:1.3:CRS84' &&
        footprint.crs.properties.name != 'urn:ogc:def:crs:EPSG::4326') {
        errors.push("footprint.crs.properties.name | should be 'EPSG:4326' / 'urn:ogc:def:crs:OGC:1.3:CRS84' / 'urn:ogc:def:crs:EPSG::4326'");
    }

    return errors;
};

export const Schema = {
    "type": "object"
};