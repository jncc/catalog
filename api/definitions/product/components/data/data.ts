import { s3file, s3fileTyped, ftp, ftpTyped } from "./files";
import { wms, wfs } from "./services";

export interface fileGroup<T, X> {
    data: T,
    preview?: T,
    metadata?: T,
    other?: X[]
}

export interface Data {
    files?: {
        s3?: fileGroup<s3file, s3fileTyped>
        ftp?: fileGroup<ftp, ftpTyped>
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
                            },
                            "preview": {
                                "$ref": "#/definitions/files/s3file"
                            },
                            "metadata": {
                                "$ref": "#/definitions/files/s3file"
                            },
                            "other": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/files/s3file"
                                },
                                "minItems": 1
                            }
                        },
                        "required": ["data"]
                    },
                    "ftp": {
                        "type": "object",
                        "properties": {
                            "data": {
                                "$ref": "#/definitions/files/ftp"
                            },
                            "preview": {
                                "$ref": "#/definitions/files/ftp"
                            },
                            "metadata": {
                                "$ref": "#/definitions/files/ftp"
                            },
                            "other": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/files/ftp"
                                },
                                "minItems": 1
                            }
                        },
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