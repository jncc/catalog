export interface ProductProperties {
    externalId : string
}

export interface s3file {
    key: string,
    bucket: string,
    region: string
}

export interface ftp {
    server: string,
    path: string
}

export interface wms {
    url: string,
    name: string
}

export interface wfs {
    url: string,
    name: string,
}

export interface ProductDataGroup {
    description?: string,
    files?: {
        s3?: s3file[]
        ftp?: ftp[]
    },
    services?: {
        wms?: wms[],
        wfs?: wfs[]
    }
}

export interface ProductData {
    groups: ProductDataGroup[]
}

export interface Product {
    id?: string,
    name: string,
    collectionId?: string,
    collectionName: string,
    metadata: {},
    properties: ProductProperties,
    data: ProductData,
    footprint: {}
}

