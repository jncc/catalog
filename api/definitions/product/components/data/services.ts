export interface OGC {
  url: string;
  name: string;
}

export interface WMS extends OGC { }
export interface WFS extends OGC { }

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
