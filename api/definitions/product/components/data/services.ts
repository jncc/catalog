export interface ogc {
    url: string,
    name: string
};

export interface wms extends ogc { };
export interface wfs extends ogc { };

export const Schema = {
    "wms": {
        "$ref": "#/definitions/services/ogc"
    },
    "wfs": {
        "$ref": "#/definitions/services/ogc"
    },
    "ogc": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "url": {
                "type": "string",
                "format": "uri"
            },
            "name": {
                "type": "string",
                "minLength": 1
            }
        },
        "required": ["url", "name"]
    }
};
