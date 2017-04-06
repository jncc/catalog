#pylint: disable=C0111
from urllib.parse import urljoin
import argparse
import json
import uuid
import shapely
import requests

class Importer:
    """
    Basic Importer for the file catalog

    Keyword arguments:
    api_base_url        -- The base URL of the API supporting this catalog
    input_file_path     -- The path for the input JSON blob
    product_import      -- If this is a product or collection import
    multi_polygon       -- Set to force product footprints to MutliPolygon, true by default
    """
    def __init__(self, api_base_url, input_file_path, product_import=False, multi_polygon=True):
        self.api_base_url = api_base_url
        self.input_file_path = input_file_path
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
        geom = shapely.geometry.shape(json.loads(product['footprint']))
        if self.multi_polygon and geom.type != 'MultiPolygon':
            ## Looking for multipolygons in the product and the product is not MultiPolygon
            if geom.type == 'Polygon':
                multipolygon_geom = shapely.geometry.multipolygon.MultiPolygon([geom])
            else:
                raise NotImplementedError('Geometry Type %s is not currently supported for import \
                                           use Polygon or MultiPolygon' % geom.type)
            # Have to remove the non array elements produced via shapely
            product['footprint'] = json.loads(json.dumps(multipolygon_geom))

        resp = requests.post(urljoin(self.api_base_url, 'add/product'), json=product)
        if not resp.ok:
            raise ValueError('Product %s was not imported, error returned from API: %s'
                             % (product['name'], resp.text))

    def import_collection(self, collection):
        """
        Import a collection from a JSON blob

        Keyword arguments:
        collection      -- A JSON blob to import as a collection
        """
        products = collection['products']
        del collection['products']

        resp = requests.post(urljoin(self.api_base_url, 'collection/add'), data=collection)
        if not resp.ok:
            raise ValueError('Product %s was not imported, error returned from API: %s'
                             % (collection['metadata']['title'], resp.text()))

        json_resp = json.loads(resp.text)

        for product in products:
            product['collectionName'] = json_resp['name']
            self.import_product(product)

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
    PARSER = argparse.ArgumentParser(description='Imports a JSON blob into the catalog')
    PARSER.add_argument('-i', '--input', type=str, required=True, help='Path to json input file')
    PARSER.add_argument('-a', '--api', type=str, required=True, help='URL to the base catalog API')
    PARSER.add_argument('-p', '--product', required=False, action='store_true',
                        help='Tell the importer that we are importing a product / array of \
                        products [append to existing collection]')

    ARGS = PARSER.parse_args()

    print(ARGS)

    IMPORTER = Importer(ARGS.api, ARGS.input, ARGS.product)
    IMPORTER.do_import()
