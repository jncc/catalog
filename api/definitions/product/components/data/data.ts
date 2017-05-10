import { s3file, ftp } from "./files";
import { wms, wfs } from "./services";

export interface Data {
    files?: {
        s3?: s3file[]
        ftp?: ftp[]
    },
    services?: {
        wms?: wms[],
        wfs?: wfs[]
    }
};

export const Schema = {
    "data": {
        "type": "object",
        "properties": {
            "anyOf": [
                {
                    "files": {
                        "type": "object",
                        "properties": {
                            "anyOf": [
                                {
                                    "s3": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/definitions/files/s3file"
                                        },
                                        "minItems": 1
                                    }
                                },
                                {
                                    "ftp": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/definitions/files/ftp"
                                        },
                                        "minItems": 1
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "services": {
                        "type": "object",
                        "properties": {
                            "anyOf": [
                                {
                                    "wms": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/definitions/services/wms"
                                        },
                                        "minItems": 1
                                    }
                                },
                                {
                                    "wfs": {
                                        "type": "array",
                                        "items": {
                                            "$ref": "#/definitions/services/wfs"
                                        },
                                        "minItems": 1
                                    }
                                }
                            ]
                        }
                    }
                }]
        },
    }
}