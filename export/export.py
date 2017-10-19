import requests
import pprint
import sys
import os

pp = pprint.PrettyPrinter()

CATALOG_URL = 'http://172.31.6.72/'
OUTPUT_FOLDER = './output/'


def getProducts(query):
    queryUrl = CATALOG_URL + 'search/product'
    products = []

    try:
        offset = 0
        limit = 50

        getNextPage = True

        # Iterate though each page of results until no results are returned
        while getNextPage:
            query["offset"] = offset
            query["limit"] = limit

            r = requests.post(queryUrl, json=query)

            # A json payload is returned, convert to python dictionary
            body = r.json()

            # The array of products results is in the result key
            p = r.json()['result']

            if p:
                products = products + [x for x in p if x not in products]
                offset = offset + limit
            else:
                getNextPage = False

        return products
    except requests.exceptions.RequestException as e:
        print(e)
        sys.exit(1)


def downloadProducts(products):
    # Create the output folder
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    for product in products:
        s3Preview = product['data']['preview']['s3']

        bucket = s3Preview['bucket']
        key = s3Preview['key']
        region = s3Preview['region']
        fileType = s3Preview['type']

        # These products are available direct from the bucket for public download. We can get them with a url.
        # Otherwise we would use the Amazon boto library to authenticate and connect to the bucket.
        downloadUrl = 'https://s3-' + region + '.amazonaws.com/' + bucket + '/' + key
        file = downloadUrl.rsplit('/', 1)[-1]
        outputPath = OUTPUT_FOLDER + file

        try:
            print('Downloading: ' + file)
            r = requests.get(downloadUrl, stream=True)
            with open(outputPath, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
        except requests.exceptions.RequestException as e:
            print('Could not download: ' + downloadUrl)
            pp.pprint(e)


if __name__ == '__main__':
    # Construct a query object that:
    # - Requests all items in the 'sentinel/1/ard/backscatter/osgb' collection
    # - that have a begin date >= 2016-08-04
    # - and an end date =< 2016-08-05
    query = {
        'collection': 'sentinel/1/ard/backscatter/osgb',
        'terms': [
            {
                'property': 'begin',
                'operation': '>=',
                'value': '2016-08-04T00:00:00Z'
            },
            {
                'property': 'end',
                'operation': '=<',
                'value': '2016-08-05T00:00:00Z'
            }]
    }

    products = getProducts(query)
    downloadProducts(products)
