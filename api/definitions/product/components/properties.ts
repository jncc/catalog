export interface Properties {
    externalId: string
};

export const Schema = {
    "type": "object",
    "properties": {
        "externalId": {
            "type": "string"
        }
    },
    "required": ["externalId"]
};
