export interface s3file {
  key: string,
  bucket: string,
  region: string,
  type?: string
};

export interface ftp {
  server: string,
  path: string,
  type?: string
};

export const Schema = {
  "s3file": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "key": {
        "type": "string",
        "minLength": 1
      },
      "bucket": {
        "type": "string",
        "minLength": 1
      },
      "region": {
        "type": "string",
        "minLength": 1
      },
      "type": {
        "type": "string",
        "minLength": 1
      }
    },
    "required": ["key", "bucket", "region"]
  },
  "ftp": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "server": {
        "type": "string",
        "oneOf": [
          { "format": "hostname" },
          { "format": "ipv6" },
          { "format": "uri" }
        ]
      },
      "path": {
        "type": "string",
        "minLength": 1
      },
      "type": {
        "type": "string",
        "minLength": 1
      }
    },
    "required": ["server", "path"]
  }
};
