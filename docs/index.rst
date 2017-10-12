.. Catalog documentation master file, created by
   sphinx-quickstart on Tue Oct  3 15:01:49 2017.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Catalog Docs
************

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   api/retrieval
   api/ingestion
   data/collection
   data/product
   data/metadata
   examples/data_upload_script
   examples/data_retrieval_script

Background
==========

The catalog spawned from the work that JNCC has been doing on cloud based processing and presentation stacks for earth observation data. This gave rise too a need for an inventory of the data on these stacks.

The catalog has developed into a general purpose inventory for any type of dataset, including ones composed of multiple files, or where the data is not stored locally but is instead available through services. It is intended for cataloguing spatial data and as such data requires a spatial footprint.

Structure
=========

Data is organised into collections which in turn contain products.

Products
--------

A product is a physical element of data. This could be a file such as a shape file or spreadsheet, a service end point such as a wms service with or without parameters or even a collection of files. A multi file product may have a shape file and a wms end point that serves up the same data or it may be a product that has text files that describe it or contain raw data.

A product has a spatial footprint, it may also have specific properties such as date stamps that can searched on. The catalog can also store metadata in the UK gemini format for each product.

See :ref:`product_schema`

Collections
-----------

Collections are logical organisations of products with the same type of properties. They follow a path style naming convention that enables multiple collections to be logically related to one another.

Collections do not necessarily correlate directly to datasets. For example a dataset may consist of products in different projections or at different resolutions. These may be sub divided into separate collections which are related by the collection naming conventions. ie **Mydataset/OSGB** and **Mydataset/OSNI** would be two collections of products within the same set of data.

Collections can also have metadata and a footprint.

See :ref:`collection_schema`


