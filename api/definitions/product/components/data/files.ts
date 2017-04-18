export interface s3file {
    key: string,
    bucket: string,
    region: string
};

export interface ftp {
    server: string,
    path: string
};

export const Schema = {
    "s3file": {
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
        "properties": {
            "server": {
                "type": "string",
                "format": "uri"
            },
            "path": {
                "type": "string",
                "minLength": 1
            }
        },
        "required": ["server", "path"]
    }
};