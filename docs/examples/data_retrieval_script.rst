Data retrieval script
*********************

This example python script uses the catalog to identify a set of products and retrieve preview images

The selection criteria are defined in the query object

* All products in the collection **sentinel/1/ard/backscatter/osgb**
* With a begin date >= 2016-08-04
* And an end date =< 2016-08-05

There are two parameters to configure

* CATALOG_URL: The url of the catalog api.
* OUTPUT_FOLDER: The folder into which the downloaded files should be deposited.

.. literalinclude:: /../export/export.py
   :language: python

