export interface Metadata {
    title: string,
    abstract: string,
    topicCategory: string,
    keywords: Keyword[],
    temporalExtent: TemporalExtent,
    datasetReferenceDate: string,
    lineage: string,
    resourceLocator: string,
    additionalInformationSource: string,
    dataFormat: string,
    responsibleOrganisation: ResponsibleParty,
    limitationsOnPublicAccess: string,
    useConstraints: string,
    copyright: string,
    spatialReferenceSystem: string,
    extent: Extent[],
    metadataDate: string,
    metadataPointOfContact: ResponsibleParty,
    resourceType: string,
    boundingBox: BoundingBox
};

export interface Keyword {
    value: string,
    vocab: string
};

export interface TemporalExtent {
    begin: string,
    end: string
};

export interface ResponsibleParty {
    name: string,
    email: string,
    role: string
};

export interface Extent {
    value: string,
    authority: string
};

export interface BoundingBox {
    north: number,
    south: number,
    east: number,
    west: number
};

export function validate(metadata, errors) {
    if (metadata.boundingBox.north <= metadata.boundingBox.south) {
        errors.push("metadata | boundingBox | north should be greater than south");
    }
    if (metadata.boundingBox.east <= metadata.boundingBox.west) {
        errors.push("metadata | boundingBox | east should be greater than west");
    }

    return errors;
};

export const Schema = {
    "metadata": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "minLength": 1
            },
            "abstract": {
                "type": "string",
                "minLength": 1
            },
            "topicCategory": {
                "type": "string",
                "minLength": 1
            },
            "keywords": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/metadata/keyword"
                }
            },
            "temporalExtent": {
                "$ref": "#/definitions/metadata/temporalExtent"
            },
            "datasetReferenceDate": {
                "type": "string",
                "oneOf": [
                    { "format": "date-time" },
                    { "format": "date" }
                ]
            },
            "lineage": {
                "type": "string",
                "minLength": 1
            },
            "resourceLocator": {
                "type": "string",
                "format": "uri"
            },
            "additionalInformationSource": {
                "type": "string",
                "minLength": 1
            },
            "dataFormat": {
                "type": "string",
                "minLength": 1
            },
            "responsibleOrganisation": {
                "$ref": "#/definitions/metadata/responsibleParty"
            },
            "limitationsOnPublicAccess": {
                "type": "string",
                "minLength": 1
            },
            "useConstraints": {
                "type": "string",
                "minLength": 1
            },
            "copyright": {
                "type": "string",
                "minLength": 1
            },
            "spatialReferenceSystem": {
                "type": "string",
                "minLength": 1
            },
            "extent": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/metadata/extent"
                }
            },
            "metadataDate": {
                "type": "string",
                "oneOf": [
                    { "format": "date-time" },
                    { "format": "date" }
                ]
            },
            "metadataPointOfContact": {
                "$ref": "#/definitions/metadata/responsibleParty"
            },
            "resourceType": {
                "type": "string",
                "minLength": "1"
            },
            "boundingBox": {
                "$ref": "#/definitions/metadata/boundingBox"
            }
        },
        "required": ["title", "abstract", "topicCategory", "keywords", "temporalExtent", "datasetReferenceDate", "lineage", "resourceLocator", "additionalInformationSource", "dataFormat", "responsibleOrganisation", "limitationsOnPublicAccess", "useConstraints", "copyright", "spatialReferenceSystem", "extent", "metadataDate", "metadataPointOfContact", "resourceType", "boundingBox"]
    },
    "keyword": {
        "type": "object",
        "properties": {
            "value": {
                "type": "string",
                "minLength": 1
            },
            "vocab": {
                "type": "string",
                "minLength": 1
            }
        },
        "required": ["value", "vocab"]
    },
    "temporalExtent": {
        "type": "object",
        "properties": {
            "begin": {
                "type": "string",
                "format": "date-time"
            },
            "end": {
                "type": "string",
                "format": "date-time"
            }
        },
        "required": ["begin", "end"]
    },
    "responsibleParty": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "minLength": 1
            },
            "email": {
                "type": "string",
                "format": "email"
            },
            "role": {
                "type": "string",
                "minLength": 1
            }
        },
        "required": ["name", "email", "role"]
    },
    "extent": {
        "type": "object",
        "properties": {
            "value": {
                "type": "string",
                "minLength": 1
            },
            "authority": {
                "type": "string",
                "minLength": 1
            }
        },
        "required": ["value", "authority"]
    },
    "boundingBox": {
        "type": "object",
        "properties": {
            "north": {
                "type": "number",
            },
            "south": {
                "type": "number",
            },
            "east": {
                "type": "number",
            },
            "west": {
                "type": "number",
            }
        },
        "required": ["north", "south", "east", "west"]
    }
};