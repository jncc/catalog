export interface IS3file {
  key: string;
  bucket: string;
  region: string;
  size?: number;
  type?: string;
}

export interface IFTP {
  server: string;
  path: string;
  size?: number;
  type?: string;
}

export interface IHTTP {
  url: string;
  size?: number;
  type?: string;
}

export const Schema = {
  s3file: {
    type: "object",
    additionalProperties: false,
    properties: {
      key: {
        type: "string",
        minLength: 1
      },
      bucket: {
        type: "string",
        minLength: 1
      },
      region: {
        type: "string",
        minLength: 1
      },
      size: {
        type: "integer",
        minimum: 1
      },
      type: {
        type: "string",
        minLength: 1
      }
    },
    required: ["key", "bucket", "region"]
  },
  ftp: {
    type: "object",
    additionalProperties: false,
    properties: {
      server: {
        type: "string",
        oneOf: [
          { format: "hostname" },
          { format: "ipv6" },
          { format: "uri" }
        ]
      },
      path: {
        type: "string",
        minLength: 1
      },
      size: {
        type: "integer",
        minimum: 1
      },
      type: {
        type: "string",
        minLength: 1
      }
    },
    required: ["server", "path"]
  },
  http: {
    type: "object",
    additionalProperties: false,
    properties: {
      url: {
        type: "string",
        format: "url"
      },
      size: {
        type: "integer",
        minimum: 1
      },
      type: {
        type: "string",
        minLength: 1
      }
    },
    required: ["url"]
  }
};
