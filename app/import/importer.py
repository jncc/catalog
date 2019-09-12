#pylint: disable=C0111
from urllib.parse import urljoin
import argparse
import json
import uuid
import requests
import psycopg2

from shapely import geometry


class Importer:
    """
    Basic Importer for the file catalog

    Keyword arguments:
    api_base_url        -- The base URL of the API supporting this catalog
    input_file_path     -- The path for the input JSON blob
    product_import      -- If this is a product or collection import
    multi_polygon       -- Set to force product footprints to MutliPolygon, true by default
    """

    def __init__(self, api_base_url, input_file_path, cursor, product_import=False, multi_polygon=True):
        self.api_base_url = api_base_url
        self.input_file_path = input_file_path
        self.cursor = cursor
        self.product_import = product_import
        self.multi_polygon = multi_polygon

    @staticmethod
    def uuid_str_valid(uuid_str):
        """
        Validates a uuid string, returns true or false

        Keyword arguments:
        uuid_str            -- UUID string to validate

        """
        try:
            uuid.UUID(uuid_str)
            return True
        except ValueError:
            return False

    def import_product(self, product):
        """
        Import a single product from a JSON blob

        Keyword arguments:
        product         -- A JSON blob to import as a product
        """
        ###
        # General footprint fixing stuff
        ###
        footprint = json.dumps(product['footprint'])
        geom = geometry.shape(product['footprint'])

        # Use PostGIS to force Multipolygon if needed
        if self.multi_polygon and geom.type != 'MultiPolygon':
            self.cursor.execute(
                'SELECT ST_AsGeoJSON(ST_Multi(ST_GeomFromGeojson(%s)))', (footprint,))
            footprint = self.cursor.fetchone()[0]

        # Use PostGIS to force Right Hand Rule on polygons as GeoJSON defines it (PostGIS
        # ST_ForceRHR produces exterior rings as CW, we need CCW so need to ST_Reverse as
        # well). Also force 2D to prevent people supplying 3D polygons randomly to the
        # service
        self.cursor.execute(
            'SELECT ST_AsGeoJSON(ST_Force2D(ST_Reverse(ST_ForceRHR(ST_GeomFromGeojson(%s)))))', (footprint,))
        footprint = self.cursor.fetchone()[0]

        product['footprint'] = json.loads(footprint)

        ###
        # Push product to import API
        ###
        resp = requests.post('%s/add/product' %
                             self.api_base_url, json=product)
        # resp = requests.post('%s/validate' %
        #                      self.api_base_url, json=product)

        if not resp.ok:
            raise ValueError('Product %s was not imported, error returned from API: %s'
                             % (product['name'], resp.text))
        else:
          print('New id %s' % resp.text)


    # Not yet implemented.
    # def import_collection(self, collection):
    #     """
    #     Import a collection from a JSON blob

    #     Keyword arguments:
    #     collection      -- A JSON blob to import as a collection
    #     """
    #     products = collection['products']
    #     del collection['products']

    #     resp = requests.post(
    #         urljoin(self.api_base_url, '/add/collection'), data=collection)
    #     if not resp.ok:
    #         raise ValueError('Product %s was not imported, error returned from API: %s'
    #                          % (collection['metadata']['title'], resp.text()))

    #     json_resp = json.loads(resp.text)

    #     for product in products:
    #         product['collectionName'] = json_resp['name']
    #         self.import_product(product)

    def do_import(self):
        """
        Perform an import using the config information supplied to this importer from the
        __init__ method
        """
        with open(self.input_file_path, 'r') as input_file_stream:
            inputs = json.load(input_file_stream)

        if self.product_import:
            for product in inputs:
                self.import_product(product)
        else:
            raise NotImplementedError()


if __name__ == '__main__':
    PARSER = argparse.ArgumentParser(
        description='Imports a JSON blob into the catalog')
    PARSER.add_argument('-i', '--input', type=str,
                        required=True, help='Path to json input file')
    PARSER.add_argument('-a', '--api', type=str, required=True,
                        help='URL to the base catalog API')
    PARSER.add_argument('-p', '--product', required=False, action='store_true',
                        help='Tell the importer that we are importing a product / array of \
                        products [append to existing collection]')
    PARSER.add_argument('--dbhost', type=str, required=True,
                        help='PostGIS DB hostname - fixing polygons')
    PARSER.add_argument('--dbport', type=int, required=False, default=5432,
                        help='PostGIS DB port - fixing polygons')
    PARSER.add_argument('--dbname', type=str, required=True,
                        help='PostGIS DB name - fixing polygons')
    PARSER.add_argument('--dbuser', type=str, required=True,
                        help='PostGIS DB user - fixing polygons')
    PARSER.add_argument('--dbpass', type=str, required=True,
                        help='PostGIS DB password - fixing polygons')

    ARGS = PARSER.parse_args()

    CONN = psycopg2.connect(dbname=ARGS.dbname, host=ARGS.dbhost,
                            port=ARGS.dbport, user=ARGS.dbuser, password=ARGS.dbpass)
    CURSOR = CONN.cursor()

    try:
        IMPORTER = Importer(ARGS.api, ARGS.input, CURSOR, ARGS.product)
        IMPORTER.do_import()
    finally:
        CURSOR.close()
        CONN.close()
