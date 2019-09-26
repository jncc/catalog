export interface IOGC {
  url: string;
  name: string;
}

export interface IWMS extends IOGC { }
export interface IWFS extends IOGC { }

export interface ICatalog {
  collection: string;
  product?: string;
}

export const Schema = {
  wms: {
    $ref: "#/definitions/services/ogc"
  },
  wfs: {
    $ref: "#/definitions/services/ogc"
  },
  ogc: {
    type: "object",
    additionalProperties: false,
    properties: {
      url: {
        type: "string",
        format: "uri"
      },
      name: {
        type: "string",
        minLength: 1
      }
    },
    required: ["url", "name"]
  },
  catalog: {
    type: "object",
    additionalProperties: false,
    properties: {
      collection: {
        type: "string",
        pattern: "^(([A-Za-z0-9\-\_\.]+)(\/))*([A-Za-z0-9\-\_\.])+$",
        minLength: 1
      },
      product: {
        type: "string",
        minLength: 1
      }
    },
    required: ["collection"]
  }
};
