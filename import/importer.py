#pylint: disable=C0111
from urllib.parse import urljoin
import json
import argparse
import uuid
import requests

class Importer:
    """
    Basic Importer for the file catalog

    Keyword arguments:
    api_base_url        -- The base URL of the API supporting this catalog
    input_file_path     -- The path for the input JSON blob
    product_import      -- If this is a product or collection import
    collection_id       -- The collection ID for a product import
    """
    def __init__(self, api_base_url, input_file_path, product_import=False, collection_id=None):
        self.api_base_url = api_base_url
        self.input_file_path = input_file_path
        self.product_import = product_import
        if self.uuid_str_valid(collection_id):
            self.collection_id = collection_id

    @staticmethod
    def uuid_str_valid(uuid_str):
        """
        Validates a uuid string, returns true or false

        Keyword arguments:
        uuid_str            -- UUID string to validate

        """
        try:
            val = uuid.UUID(uuid_str, version=4)
        except ValueError:
            return False

        # Check for validity of input, hex should match input if valid
        return val.hex == uuid_str

    def import_product(self, product, collection_id):
        """
        Import a single product from a JSON blob

        Keyword arguments:
        product         -- A JSON blob to import as a product
        """
        product['collection_id'] = collection_id

        resp = requests.post(urljoin(self.api_base_url, 'product/add'), data=product)
        if not resp.ok():
            raise ValueError('Product %s was not imported, error returned from API: %s'
                             % (product['metadata']['title'], resp.text()))

    def import_collection(self, collection):
        """
        Import a collection from a JSON blob

        Keyword arguments:
        collection      -- A JSON blob to import as a collection
        """
        products = collection['products']
        del collection['products']

        resp = requests.post(urljoin(self.api_base_url, 'collection/add'), data=collection)
        if not resp.ok():
            raise ValueError('Product %s was not imported, error returned from API: %s'
                             % (collection['metadata']['title'], resp.text()))

        json_resp = json.loads(resp.text)

        for product in products:
            self.import_product(product, json_resp['id'])

    def do_import(self):
        """
        Perform an import using the config information supplied to this importer from the
        __init__ method
        """
        with open(self.input_file_path, 'r') as input_file_stream:
            inputs = json.loads(input_file_stream)

        if self.product_import:
            for product in inputs:
                self.import_product(product, self.collection_id)
        else:
            raise NotImplementedError()

if __name__ == '__main__':
    PARSER = argparse.ArgumentParser(description='Imports a JSON blob into the catalog')
    PARSER.add_argument('-i', '--input', type=str, required=True, help='Path to json input file')
    PARSER.add_argument('-a', '--api', type=str, required=True, help='URL to the base catalog API')
    PARSER.add_argument('-p', '--product', required=False, action='store_true',
                        help='Tell the importer that we are importing a product / array of \
                        products [append to existing collection]')
    PARSER.add_argument('-c', '--collection', type=str, required=True, help='Collection ID to \
                        import into when doing a product import')

    ARGS = PARSER.parse_args()

    IMPORTER = Importer(ARGS.api, ARGS.input)
    IMPORTER.do_import()
