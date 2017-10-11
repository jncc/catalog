.. _product_schema:

Product schema
**************

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "id", "An internally generated ID. Do not supply this", "Internally Generated"
   "name", "The product name", "Yes"
   "collectionName", "The full collection name to which the product belongs", "Yes"
   "metadata", "Gemini metadata related to the product. See: `Product Metadata`_", "Yes"
   "properties", "An object containing the identifying properties of the product. These properties are used for identifying the product in a search. See `Product Properties`_", "Determined by the configuration of the collection"
   "data", "A collection of links to files and services that make up the product data. See `Product Data`_", "Yes"
   "footprint", "The footprint of the product in GeoJSON format. |geoJson|", "Yes"

* The product name must be unique within the collection.
* There is a minimum requirement for Gemini metadata to be included with the product.
* The product footprint is expected to be the most accurate boundary available for the product"

Product Metadata
================

Gemini metadata for the product.

See :ref:`metadata_schema`

.. _product_properties:

Product Properties
==================

The defining properties of the product, other then it's footprint. For example the temporal range the product covers. All properties in a collection should have the same property schema and requirements. The schema of the properties is defined at the collection level. See :ref:`product_property_schema`.

The properties are used when searching for products using the /search/product API end point. Searchable properties should be simple scaler attributes such as a string, number or date. See :ref:`search_product`.

There is no reason why the properties of a product cannot also contain complex elements. However such property elements cannot be searched on and would only serve to hold additional data about the product.

Example
-------

The following example property element contains three searchable properties, externalId, osgbGridRef and publishedDate. None of the properties in the complex property publisher are searchable. If the structure of a complex element must be preserved but some of the data is required to be searchable it must be duplicated as publishedDate is in the following example.

.. code-block:: javascript

  {
    ..
    "properties": {
      "externalId": "DTM_NH87.tif",
      "osgbGridRef": "NH87",
      "publishedDate": "2016-08-04T00:00:00Z",
      "publicationInfo": {
        "publisher": "JNCC"
        "date": "2016-08-04T00:00:00Z"
      }
    },
  }

Product Data
============

The data section contains links to the data related to the product. A simple example would be a shapefile or a wms link. A product may have one or more data sources. For example a shape file, a WMS link or some related documents.

Links are organised into groups. The default product group must always exist. Each group can contain one of the following link types.

S3
---

A link to an file stored in Amazon S3 storage.

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "key", "The S3 Key that uniquely identifies the file in the bucket", "Yes"
   "bucket", "The S3 bucket in which the file is stored", "Yes"
   "region", "The bucket region", "Yes"
   "type", "The MIME type of the file", "No"

FTP
---

A link to a file stored on an FTP server.

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "server", "The url of the server", "Yes"
   "path", "The full path to the file", "Yes"
   "type", "The MIME type of the file", "No"

WMS
---

A link to a WMS service serving up the product data.

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "url", "The full URL to the product data including any parameters required to select it", "Yes"
   "name", "The name of the layer", "Yes"

WFS
---

A link to a WFS service serving up the product data.

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "url", "The full URL to the product data including any parameters required to select it", "Yes"
   "name", "The name of the layer", "Yes"

Examples
--------

.. code-block:: javascript

  "data": {
    "product": {
      "s3": {
        "key": "/processed/DTM/gridded/27700/10000/DTM_NH87.tif",
        "bucket": "lidar-1",
        "region": "eu-west-1"
      }
    }
  }

Product Footprint
=================

The geospatial footprint of the product in |geoJson|. This should be as detailed as possible to enable accurate geospatial searches.

**Note** All footprints should be in EPSG:4326. This can be specified by adding a crs element to the geojson. If it is omitted it will be added automatically. If the data is in the wrong projection it may cause ingestion or errors or anomalies when searching.

.. code-block:: javascript

    "crs": {
      "properties": {
        "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
      },
      "type": "name"
    }

Example Product
===============

The following is a example of a valid product.

.. literalinclude:: /../api/test/product.json
   :language: javascript
