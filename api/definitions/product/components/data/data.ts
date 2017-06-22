import { s3file, s3fileTyped, ftp, ftpTyped } from "./files";
import { wms, wfs } from "./services";

export interface fileGroup<T> {
    data: T
}

export interface Data {
    files?: {
        s3?: fileGroup<s3file>,
        ftp?: fileGroup<ftp>
    },
    services?: {
        wms?: wms,
        wfs?: wfs
    }
};

export const Schema = {
    "data": {
        "type": "object",
        "properties": {
            "files": {
                "type": "object",
                "properties": {
                    "s3": {
                        "type": "object",
                        "properties": {
                            "data": {
                                "$ref": "#/definitions/files/s3file"
                            }
                        },
                        "patternProperties": {
                            "^.*data$": {
                                "$ref": "#/definitions/files/s3file"
                            }
                        },
                        "additionalProperties": false,
                        "required": ["data"]
                    },
                    "ftp": {
                        "type": "object",
                        "properties": {
                            "data": {
                                "$ref": "#/definitions/files/ftp"
                            }
                        },
                        "patternProperties": {
                            "^.*data$": {
                                "$ref": "#/definitions/files/ftp"
                            }
                        },
                        "additionalProperties": false,
                        "required": ["data"]
                    },
                    "minItems": 1
                }
            },
            "services": {
                "type": "object",
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
    }
}