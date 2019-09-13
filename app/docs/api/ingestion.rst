Data Ingestion
**************

The following API methods are used for data ingestion.

Validate Product
================

Request
-------

Validates a product without ingesting it.  Only 1 product can be submitted for validation on each call to the method.

.. csv-table::
   :header: "Method", "URL"
   :widths: 20, 20

   "POST", "/validate/product"

Payload
^^^^^^^

A product conforming to the JSON product schema. :ref:`product_schema`

Result
------

+--------+-----------------------------------------+
| Status | Response                                |
+--------+-----------------------------------------+
| 200    | Indicates a valid product               |
|        | No data is returned                     |
+--------+-----------------------------------------+
| 400    |                                         |
|        | The product failed validation.          |
|        |                                         |
|        | A JSON object containing the following: |
|        |                                         |
|        | * productName - product name            |
|        | * collectionName - collection name      |
|        | * errors - an array of validation errors|
+--------+-----------------------------------------+

* All properties of the input payload are validated where possible
* Multiple errors may be returned for the same property
* Nested properties are delimited by a dot, eg metadata.title.

Add Product
===========

Request
-------

Validates a product and ingests the product into the collection specified in the collectionName field. Only 1 product can be submitted for ingestion on each call to the method.

.. csv-table::
   :header: "Method", "URL"
   :widths: 20, 20

   "POST", "/add/product"

Payload
^^^^^^^

A product conforming to the JSON product schema. :ref:`product_schema`

Result
------

+--------+-----------------------------------------+
| Status | Response                                |
+--------+-----------------------------------------+
| 200    | Indicates a valid product               |
|        | No data is returned                     |
+--------+-----------------------------------------+
| 400    |                                         |
|        | The product failed validation.          |
|        |                                         |
|        | A JSON object containing the following: |
|        |                                         |
|        | * productName - product name            |
|        | * collectionName - collection name      |
|        | * errors - an array of validation errors|
+--------+-----------------------------------------+

* All properties of the input payload are validated where possible
* Multiple errors may be returned for the same property
* Nested properties are delimited by a dot, ie metadata.title.
