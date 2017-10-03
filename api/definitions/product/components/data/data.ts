import { IFTP, IS3file } from "./files";
import { IWFS, IWMS } from "./services";

export interface IData {
  product: IDataGroup;
  [x: string]: IDataGroup;
}

export interface IDataGroup {
    s3?: IS3file;
    ftp?: IFTP;
    wms?: IWMS;
    wfs?: IWFS;
}

export const Schema = {
  data: {
    type: "object",
    additionalProperties: false,
    patternProperties: {
      "^[A-Za-z0-9]+$": {
        $ref: "#/definitions/data/datagroup"
      }
    },
    required: ["product"]
  },
  datagroup: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      s3: {
        $ref: "#/definitions/files/s3file"
      },
      ftp: {
        $ref: "#/definitions/files/ftp"
      },
      wms: {
        $ref: "#/definitions/services/wms"
      },
      wfs: {
        $ref: "#/definitions/services/wfs"
      }
    }
  },
};
