.. _product_schema:

Product schema
**************
A product defines a

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "id", "An internally generated ID. Do not supply this", "Internally Generated"
   "name", "The product name", "Yes"
   "collectionName", "The full collection name to which the product belongs", "Yes"
   "metadata", "Gemini metadata related to the product. See: `Product Metadata`_", "Yes"
   "properties", "An object containing the identifying properties of the product. These properties are used for identifying the product in a search. See `Product Properties`_", "Determined by the configuration of the collection"
   "data", "A collection of links to files and services that make up the product data. See `Product Data`_", "Yes"
   "footprint", "The footprint of the product in GeoJSON format. `GeoJSON <http://geojson.org/>`_", "Yes"

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

The defining properties of the product, other then it's footprint. For example the temporal range the product covers. All properties in a collection should have the same property schema and requiremnts. The schema of the properties is defined at the collection level. See :ref:`product_property_schema`.

The properties are used when searching for products using the /search/product api end point. Searchable properties should be simple scaler attributes such as a string, number or date. See :ref:`search_product`.

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

The data section contains links to the data related to the product. A product may have one or more files. A simple example would be a shapefile or a wms link. Some products may have more then one associated file or many files

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
  },

Product Footprint
=================

The product

Example Product
===============

.. literalinclude:: /../api/test/product.json
   :language: javascript
