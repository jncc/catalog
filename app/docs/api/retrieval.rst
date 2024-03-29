﻿Data retrieval
**************

The following api methods are used to retrieve data from the catalog.

Search Collections
==================

Request
-------

Search the collections.

.. csv-table::
   :header: "Method", "URL"
   :widths: 20, 20

   "GET", "/search/collection/{collection pattern}"

The collection pattern can be a specific collection name or a pattern containing the `*` wild-card.

Example
"""""""

This URL returns a collection objects for the 'sentinel/1/ard/backscatter/osgb'

  |siteProtocol|://|siteUrl|/search/collection/sentinel/1/ard/backscatter/osgb

This URL returns a array of collection objects for all collections that begin with sentinel and contain /backscatter/

  |siteProtocol|://|siteUrl|/search/collection/sentinel/\*/backscatter/\*

Result
------

.. csv-table::
   :header: "Status", "Response"
   :widths: 20, 70

   "200", "Success. An array of products. See :ref:`collection_schema`"
   "400", "Failure. The query was invalid, an array of query validation errors is returned"

.. _search_product:

Search Products
===============

Returns a list of products matching the supplied criteria.

Request
-------

Search the products.

.. csv-table::
   :header: "Method", "URL"
   :widths: 20, 20

   "POST", "/search/product/"

.. _product-search-payload:

Payload
"""""""

The payload consists of a json query object with the following fields:

.. csv-table::
   :header: "Field Name", "Description", "Required"
   :widths: 20, 70, 40

   "collections", "An array of properly formatted collection names :ref:`collection_schema`", "Yes"
   "productName", "A pattern for the product name. Can include the * wildcard", No
   "footprint", "A geospatial search filter in |geoJson| format and WSG84 projection", "No"
   "spatialOp", "The spatial operation to perform with the footprint (within | intersects | overlaps)", "No, defaults to intersects"
   "terms", "An array of property term filters", "No"
   "limit", "The total number of products to return. For paging", "No, defaults to 50"
   "offset", "For paging results. For example to exclude the first 50 results set this value to 50", "No, defaults to 0, i.e. the first page of results."

Property filter terms
"""""""""""""""""""""

A property filter term consists of the following fields:

.. csv-table::
   :header: "Field Name", "Description", "Required"
   :widths: 20, 70, 40

   "property", "The product property to filter on", "yes"
   "value", "The value to filter by", "yes"
   "operation", "The logical test to perform, ie =, > etc.", "yes"

See :ref:`product_properties`.

Notes
"""""

* Where possible, all query properties are validated before returning any results.
* The values in each term must be of the valid for the data type of the property being evaluated in the term. The data type of a property is specified in the productsSchema property of the collection. See :ref:`product_property_schema`.
* All collections must have exactly the same product schema.

Example
"""""""

The following example payload will return:

* Products from the `sentinel/1/ard/backscatter/osgb` collection
* Where the name begins with `S1A_`
* And the begin date is >= 2016-08-04T00:00:00Z
* And the end date is <= 2016-08-05T00:00:00Z


.. code-block:: javascript

  {
    "collections": ["sentinel/1/ard/backscatter/osgb"],
    "productName": "S1A_*",
    "terms": [{
        "property": "begin",
        "operation": ">=",
        "value": "2016-08-04T00:00:00Z"
      },
      {
        "property": "end",
        "operation": "<=",
        "value": "2016-08-05T00:00:00Z"
      }]
  }

Result
------

.. csv-table::
   :header: "Status", "Response"
   :widths: 20, 70

   "200", "Success. An array of products. See :ref:`product_schema`"
   "400", "Failure. The query was invalid, an array of query validation errors is returned"

Notes
"""""

* The data is paged, by default the first 50 results are returned. This is determined by the limit and offset properties of the query. See `product-search-payload`_.

Search Product Count
====================

Returns a count of products matching the supplied criteria.

Request
-------

Count the products.

.. csv-table::
   :header: "Method", "URL"
   :widths: 20, 20

   "POST", "/search/product/count"

Payload
"""""""
Takes the same payload as product search, the criteria for a valid query are exactly the same. See :ref:`product-search-payload`

Result
------

.. csv-table::
   :header: "Status", "Response"
   :widths: 20, 70

   "200", "Success. An count of the products is returned"
   "400", "Failure. The query was invalid, an array of query validation errors is returned"

Search Product Count by Collection
==================================

Returns a count of products matching the supplied criteria in each of the collections defined in the query.

Request
-------

Count the products in each collection.

.. csv-table::
   :header: "Method", "URL"
   :widths: 20, 20

   "POST", "/search/product/countByCollection"

Payload
"""""""
Takes the same payload as product search, the criteria for a valid query are exactly the same. See :ref:`product-search-payload`

Result
------

.. csv-table::
   :header: "Status", "Response"
   :widths: 20, 70

   "200", "Success. An count of the products by collection is returned"
   "400", "Failure. The query was invalid, an array of query validation errors is returned"
