export interface s3file {
    key: string,
    bucket: string,
    region: string,
    type?: string
};

export interface s3fileTyped extends s3file {
    type?: string
};

export interface ftp {
    server: string,
    path: string,
    type?: string
};

export interface ftpTyped extends ftp {
    type?: string
}

export const Schema = {
    "s3file": {
        "type": "object",
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
        "properties": {
            "server": {
                "type": "string",
                "format": "uri"
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