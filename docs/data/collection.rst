.. _collection_schema:

Collection schema
*****************

.. csv-table::
   :header: "Field", "Description", Required
   :widths: 20, 70, 40

   "id", "An internally generated ID. Do not supply this", "Internally Generated"
   "name", "The collection name. This should be unique. See `Collection name`_", "Yes"
   "metadata", "Gemini metadata related to the product. See: `Collection Metadata`_", "Yes"
   "productsSchema", The json schema for the properties associated with the products in the collection", "Yes"
   "footprint", "The geoJson footprint of the collection. This should give a broad perspective of the the area covered by the data in the collection, for example a bounding box. See `Collection Footprint`_", "Yes"

Collection name
---------------

Collection names are arbitary strings which can consist of letters, numbers, an underscore (_) or a forward strike (/). The only constraint is that they must be unique.

However they we suggest they should represent an organisational structure as follows

**project**/**productset**/**x**/**y**/**z**/**version**

Where x/y/z are for product specific differentiation.

It's suggested that the version number is added when products are depricated.
Version numbers start at 1 except in very special cases as these are all release products.

Ie
Top level
eodip/sentinel1/ard/backscatter

Previous versions
eodip/sentinel1/ard/backscatter/v2
eodip/sentinel1/ard/backscatter/v1

Records for previous data that has expired and been deleted should be removed from the catalog

Examples:
eodip/sentinel1/ard/backscatter
scotland-gov-gi/lidar-1/processed/dsm
scotland-gov-gi/lidar-1/processed/dsm/gridded/27700/100000

Collection Metadata
===================

Gemini metadata for the collection.

See :ref:`metadata_schema`

Collection Footprint
====================

The geospatial footprint of the product in |geoJson|.


**Note** All footprints should be in EPSG:4326. This can be specified by adding a crs element to the geojson. If it is omitted it will be added automatically. If the data is in the wrong projection it may cause ingestion or errors or anomalies when searching.

.. code-block:: javascript

    "crs": {
      "properties": {
        "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
      },
      "type": "name"
    }

.. _product_property_schema:

Product property schema
=======================

The properties of a product are stored in a json element. The schema of the json should be defined for each collection where the products require searchable properties. The schema is defined as a json schema. See `JSON Schema <http://json-schema.org/>`_.

The catalog currently uses JSON Schema spec: |jsonSchemaVersion|

An example schema is illustrated below.

.. literalinclude:: /../api/test/collectionSchema.json
   :language: javascript
