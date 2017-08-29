import { FTP, S3File } from "./files";
import { WFS, WMS  } from "./services";

export interface Data {
  product: DataGroup;
  [x: string]: DataGroup;
}

export interface DataGroup {
  files?: {
    s3?: S3File,
    ftp?: FTP
  };
  services?: {
    wms?: WMS,
    wfs?: WFS
  };
}

export const Schema = {
  "data": {
    "type": "object",
    "additionalProperties": false,
    "patternProperties": {
      "^[A-Za-z0-9]+$": {
        "$ref": "#/definitions/data/datagroup"
      }
    },
    "required": ["product"]
  },
  "datagroup": {
    "type": "object",
    "additionalProperties": false,
    "minProperties": 1,
    "properties": {
      "files": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "s3": {
            "$ref": "#/definitions/files/s3file"
          },
          "ftp": {
            "$ref": "#/definitions/files/ftp"
          }
        }
      },
      "services": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "wms": {
            "$ref": "#/definitions/services/wms"
          },
          "wfs": {
            "$ref": "#/definitions/services/wfs"
          }
        }
      }
    }
  },
};
