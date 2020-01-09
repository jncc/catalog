# Scottish LIDAR generator example code

There is a existing `scotland-lidar-json-generator.py` file that generates json as required for this import process by crawling a known file format (Scottish lidar) as used in remotesensing.scot.gov. It needs a consumable list of OSGB grid references GeoJSON (10k, 5k and 1k in this case) to generate the various json collections involved, these are not included due to file size but can be relatively easilly generated if needed.

To run the script you just need to provide the following arguments;

- `-b` - S3 bucket to scan
- `-r` - S3 bucket region
- `-p` - AWS profile to use to provide permissions
- `-g` - Appropriate GeoJSON file for this collection i.e. 10k / 5k / 1k
- `--path` - The S3 bucket prefix to scan over i.e. folder containing collection
- `-c` - The collection name for this run (Must exist)
- `-t` - A title used for the collections (used to compsite the product names i.e. `Scotland Lidar Phase 1`)
- `-o` - The output file path / filename

In this example the phase-1/2 DSM/DTM collections only require a 10k grid, while phase-1-laz requires 1k and phase-2-laz requires 5k, these are included zipped under the folder `app\import\grids\scotland-os-grids-wgs84`.

To run just adapt the following example to what you are doing;

    python3 scotland-lidar-json-generator.py -b bucketname -r eu-west-1 -p scanProfile -g ./grids/osgb.10k.generated.geojson --path /phase/1/dsm -c scotland-gov/lidar/phase/1/dsm -i guid -t "Scotland Lidar Phase 1" -o phase-1-dsm.json

## Examples for the Existing Scotland LIDAR data sources

### LAZ Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar -r eu-west-1 -p scotland-lidar-gen -g ./data/grids/scotland-os-grids-wgs84/wgs84.1k.grid.scotland.geojson --path phase-1/laz/27700/gridded -c scotland-gov/lidar/phase-1/laz -t "Scotland Lidar Phase 1" -o ./data/lidar-1-laz.json

### DSM Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar -r eu-west-1 -p scotland-lidar-gen -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-1/dsm/27700/gridded -c scotland-gov/lidar/phase-1/dsm -t "Scotland Lidar Phase 1" -o ./data/lidar-1-dsm.json

### DTM Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar -r eu-west-1 -p scotland-lidar-gen -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-1/dtm/27700/gridded -c scotland-gov/lidar/phase-1/dtm -t "Scotland Lidar Phase 1" -o ./data/lidar-1-dtm.json

### LAZ Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar -r eu-west-1 -p scotland-lidar-gen -g ./data/grids/scotland-os-grids-wgs84/wgs84.5k.grid.scotland.geojson --path phase-2/laz/27700/gridded -c scotland-gov/lidar/phase-2/laz -t "Scotland Lidar Phase 2" -o ./data/lidar-2-laz.json

### DSM Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar -r eu-west-1 -p scotland-lidar-gen -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-2/dsm/27700/gridded -c scotland-gov/lidar/phase-2/dsm -t "Scotland Lidar Phase 2" -o ./data/lidar-2-dsm.json

### DTM Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar -r eu-west-1 -p scotland-lidar-gen -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-2/dtm/27700/gridded -c scotland-gov/lidar/phase-2/dtm -t "Scotland Lidar Phase 2" -o ./data/lidar-2-dtm.json

## Importing the JSON files into a catalog

Refer to the Importer README.md under `app/import`

An example being;

    python importer.py -p -a http://localhost:8081 -i ./scotland-gov-lidar/scotland-gov-lidar-ogc.json