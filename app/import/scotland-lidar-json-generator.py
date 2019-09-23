import boto3
import json
import os
import uuid
import argparse

def get_bbox(item):
    west = item['geometry']['coordinates'][0][0][0]
    south = item['geometry']['coordinates'][0][0][1]
    east = item['geometry']['coordinates'][0][0][0]
    north = item['geometry']['coordinates'][0][0][1]

    for coord in item['geometry']['coordinates'][0]:
        if west > coord[0]:
            west = coord[0]
        if south > coord[1]:
            south = coord[1]
        if east < coord[0]:
            east = coord[0]
        if north < coord[1]:
            north = coord[1]
    return {
		'north': north,
		'east': east,
		'south': south,
		'west': west
	}

def get_products(bucket, region, s3_path, wgs84_grid_path, collection_id, collection_name, collection_title, profile):
	
    session = boto3.Session(profile_name=profile)
    resource = session.resource('s3')
    remote_bucket = resource.Bucket(bucket)

    grids = {}

    with open(wgs84_grid_path) as wgs84_grid_file:
        wgs84_grid_json = json.load(wgs84_grid_file)
        for item in wgs84_grid_json['features']:
            grids[item['properties']['id']] = {'wgs84': {'geojson': item['geometry'], 'bbox': get_bbox(item)}}

    #with open(osgb_grid_path) as osgb_grid_file:
    #    osgb_grid_json = json.load(osgb_grid_file)
    #    for item in osgb_grid_json['features']:
    #        print(grids[item['properties']['id']])
    #        grids[item['properties']['id']]['osgb'] = {'geojson': item['geometry'], 'bbox': get_bbox(item)}

    products = []

    for key in remote_bucket.objects.filter(Prefix=s3_path):
        #GRID_50CM_DSM_CONTRACTNAME.TIFF
        #Scotland Lidar-1 %s %s
        (productName, fileType) = os.path.basename(key.key).split('.')
        (grid, resolution, productType, collectionIdentifier) = productName.split('_')

        products.append({
            'id': str(uuid.uuid4()),
            'name': productName.lower(),
            'collectionId': collection_id,
            'collectionName': collection_name,
				'metadata': {
					'title': '%s %s %s' % (collection_title, productType, grid),
					'boundingBox': grids[grid]['wgs84']['bbox']
				},
				'properties': {
					'osgbGridRef': grid
				},
				'footprint': grids[grid]['wgs84']['geojson'],
				'data': {
					'product': {
						'title': '%s %s %s' % (collection_title, productType, grid),
						'http': {
							'url': 'https://s3-%s.amazonaws.com/%s/%s' % (region, bucket, key.key),
							'size': key.size,
							'type': getFileType(fileType)
						},
						's3': {
							'key': key.key,
							'bucket': bucket,
							'region': region,
							'size': key.size,
							'type': getFileType(fileType)
						}
					}
				}
            })

    return products

def getFileType(fileType):
    if (fileType == 'tif'):
        return 'image/tiff'
    return 'application/octet-stream'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scans a bucket and produces a consumeable json file for import into the catalog project.')
    
    parser.add_argument('-b', '--bucket', help='S3 Bucket to scan', required=True)
    parser.add_argument('-r', '--region', help='S3 bucket region', required=True)
    parser.add_argument('-p', '--profile', help='AWS profile to use for authentication', required=True)
    parser.add_argument('-g', '--geojson', help='GeoJSON file containing grid system to add to scanned files metadata', required=True)
    
    parser.add_argument('--path', help='Prefix path to scan for files on', required=True)
    parser.add_argument('-c', '--collection', help='Catalog Collection name to associate with the scanned files', required=True)
    parser.add_argument('-i', '--collectionid', help='Catalog Collection ID to associate with the scanned files', required=True)
    parser.add_argument('-t', '--collectiontitle', help='Collection Title to use in creating titles for the scanned files', required=True)
    parser.add_argument('-o', '--output', help='Full output json file path', required=True)

    args = parser.parse_args()
    
    with open(args.output, 'w') as output:
        json.dump(get_products(args.bucket, args.region, args.path, args.geojson, args.collectionid, args.collection, args.collectiontitle, args.profile), output)
