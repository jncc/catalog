import { s3file, ftp } from "./files";
import { wms, wfs } from "./services";

export interface DataGroup {
    description: string,
    files?: {
        s3?: s3file[]
        ftp?: ftp[]
    },
    services?: {
        wms?: wms[],
        wfs?: wfs[]
    }
};

export interface Data {
    groups: DataGroup[]
};

export const Schema = {
    "data": {
        "type": "object",
        "properties": {
            "groups": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/data/dataGroup"
                },
                "minItems": 1
            }
        },
        "required": ["groups"]
    },
    "dataGroup": {
        "type": "object",
        "properties": {
            "description": {
                "type": "string"
            },
            "files": {
                "type": "object",
                "properties": {
                    "s3": {
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/files/s3file"
                        }
                    },
                    "ftp": {
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/files/ftp"
                        }
                    }
                }
            },
            "services": {
                "type": "object",
                "properties": {
                    "wms": {
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/services/wms"
                        }
                    },
                    "wfs": {
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/services/wfs"
                        }
                    }
                }
            }
        },
        "required": ["description"]
    }
}