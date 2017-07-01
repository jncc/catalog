import { s3file, ftp } from "./files";
import { wms, wfs } from "./services";

export interface Data {
  product: DataGroup,
  [x: string]: DataGroup
}

export interface DataGroup {
    s3?: s3file,
    ftp?: ftp
    wms?: wms,
    wfs?: wfs
};

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
      "s3": {
        "$ref": "#/definitions/files/s3file"
      },
      "ftp": {
        "$ref": "#/definitions/files/ftp"
      },
      "wms": {
        "$ref": "#/definitions/services/wms"
      },
      "wfs": {
        "$ref": "#/definitions/services/wfs"
      }
    }
  },
}
