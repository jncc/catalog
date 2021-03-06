# Importer Readme

The `importer.py` imports a json file into a running Catalog.

## Requirements

    pip install -r requirements.txt

## Running

To run the importer you can run with the `-h` flag to get the most upto-date options but at the time of writing the following options exst;

- `-i` - The path to the input json file you wish to import
- `-a` - The url of the catalog instance we are running against
- `-p` - If this is a product import into an existing collection or not
- `--dbhost` - The host of the local db to do some polygon fixing magic against
- `--dpport` - The port of the local db
- `--dbuser` - A username for the local db user
- `--dbpass` - The password for the local db user

An example of running the service against a live catalog is as follows;

    python3 importer.py -i input.json -a http://local-catalog.com:8081 -p --dbhost localhost --dbport 5432 --dbuser postgres --dbpass postgres --dbname somedb

## Scottish LIDAR generator

There is a existing `scotland-lidar-json-generator.py` script that generates the json required for this import process by crawling the data files on S3. For more information see the README.md under `app/import/scotland-gov-lidar`.

## JSON file format

The JSON file format is essentially an array of individual items to be ingested;

```
[
  {
    "id": "GUID", // ID for product
    "collectionName": "collection/name", // Full collection name to import this product under (MUST EXIST)
    "metadata": {
      // Loosely based on the GEMINI2 format detailed below
    },
    "properties": {
      // A collection of non GEMINI2 metadata (validated at collection level) 
      // i.e.
      "osgbGridRef": "NY27",
      ...
    },
    "data": {
      // A collection of data objects which detail how to consume the service / 
      // download the data associated with this metadata record, must include a 
      // "product" but all other names are up to the end user to define
      "product": {
        "title": "Human friendly title for this file / service",
        // Full list of available file / service types are outlined elsewhere
        "http": { ... },
        "s3": { ... },
        "wms": { ... }
      },
      "footprint": {
        // GeoJSON Multipolygon in WGS84 
      }
    }
  }
]
```

### Metadata Format

```
{
  "title": "Product Title",
  "abstract": "Product Abstract",
  "topicCategory": "Product Topic Category",
  "keyword": [{
      "value": "Keyword 1",
      "vocab": "vocab.test.com"
    },
    {
      "value": "Keyword 2",
      "vocab": "vocab.other.com"
    },
    ...
  ],
  "lineage": "Product Lineage",
  "accessLimitations": "Any constraints on product access",
  "useConstraints": "Any constraints on product use i.e. Open Government Licence Version 3",
  "additionalInformationSource": "www.metadata.com/this-record",
  "temporalExtent": {
    "begin": "ISO formatted datetime i.e. 2018-01-01T00:00:00z",
    "end": "ISO formatted datetime i.e. 2018-01-01T00:00:00z"
  },
  "resourceType": "Resource Type i.e. Dataset",
  "dataFormat": "Format for the data attached to this metadata record i.e. GeoTIFF",
  "resourceLocator": "Alternative resource locator (service or location)",
  "boundingBox": {
    // WGS84 Bounding box
    "east": -0.71,
    "west": -8.8,
    "north": 60.87,
    "south": 54.63
  },
  "metadataDate": "YYYY-mm-DD", // Metadata last updated date
  "datasetReferenceDate": "YYYY-mm-DD", // Dataset reference date (specific to the dataset for any meaning)
  "metadataPointOfContact": { // Metadata point of contact
    "name": "Contact / Dept. Name",
    "role": "metadataPointOfContact",
    "email": "Email address for contact",
    "address": {
      "city": "City Name",
      "country": "Country Name",
      "postalCode": "Postal code",
      "deliveryPoint": "Building name / number and Road"
    }
  },
  "responsibleOrganisation": { // Responsible organisation for this data
    "name": "Contact / Dept. Name",
    "role": "metadataPointOfContact",
    "email": "Email address for contact",
    "address": {
      "city": "City Name",
      "country": "Country Name",
      "postalCode": "Postal code",
      "deliveryPoint": "Building name / number and Road"
    },
    "spatialReferenceSystem": "EPSG:27700" // Spatial reference info of data, EPSG code preferred but not forced
  }
```

### Data Types

#### File storage

##### HTTP

```
{
  "product": {
    "title": ...,
    "http": {
      "url": "download url",
      "size": 1234, // filesize in bytes (Optional)
      "type": "file type, typically a mime-type, but not necessarily (Optional)"
    }
  }
}
```

##### FTP

```
{
  "product": {
    "title": ...,
    "ftp": {
      "server": "FTP server host",
      "path": "path/to/download"
      "size": 1234, // filesize in bytes (Optional)
      "type": "file type, typically a mime-type, but not necessarily (Optional)"
    }
  }
}
```

##### S3

```
{
  "product": {
    "title": ...,
    "s3": {
      "bucket": "s3 bucket name",
      "key": "s3 key/path",
      "region": "s3 region for bucket",
      "size": 1234, // filesize in bytes (Optional)
      "type": "file type, typically a mime-type, but not necessarily (Optional)"
    }
  }
}
```

#### Services

##### OGC web services

```
{
  "product": {
    "title": ...,
    "wms|wfs": {
      "url": "Base url to OGC service i.e. base of GetCapabilities link including workspace, etc...",
      "name": "full:layer-name"
    }
  }
}
```

##### Catalog service

This is a more abstract link, to allow products to link with other collections / products directly (not currently enforcing referential integrity) i.e. wms service linked to collection of individual tile downloads

```
{
  "product":{
    "title": ...,
    "catalog": {
      "collection": "collection-name to associate with this record",
      "product": "product name to assocatiate with this record (Optional)"
    }
  }
}
```
