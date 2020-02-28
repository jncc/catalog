# Scottish LIDAR generator example code

The `scotland-lidar-json-generator.py` script generates the JSON required for the importer by crawling the lidar data files on S3.

It needs the relevant list of OSGB grid references, which are in GeoJSON (10k, 5k or 1k) grid files. These can be unzipped inside `app\import\grids\scotland-os-grids-wgs84`.
However, the Phase 3 data included gridsquares which aren't included in these files. 

We found some here https://github.com/charlesroper/OSGB_Grids which appear to be more comprehensive. The files are very similar, but the property name for the tile is `TILE_NAME` not `id` - so we changed the script to use `TILE_NAME` and **it would need changing back to `id` to use the zipped grid files in this repo**.

To run the script you just need to provide the following arguments;

- `-b` - S3 bucket to scan
- `-r` - S3 bucket region
- `-p` - AWS profile to use to provide permissions (optional)
- `-g` - Appropriate GeoJSON file for this collection i.e. 10k / 5k / 1k
- `--path` - The S3 bucket prefix to scan over i.e. folder containing collection
- `-c` - The collection name for this run (Must exist)
- `-t` - A title used for the collections (used to compsite the product names i.e. `Scotland Lidar Phase 1`)
- `-o` - The output file path / filename

The Phase 1 and 2 DSM / DTM collections use a 10k grid, while phase-1-laz uses 1k and phase-2-laz uses 5k.
Phase 3 DSM / DTM use a 5k grid, and the laz uses 1k.

To run just adapt the following example:

    python3 scotland-lidar-json-generator.py -b bucketname -r eu-west-1 -p scanProfile -g ./grids/osgb.10k.generated.geojson --path /phase/1/dsm -c scotland-gov/lidar/phase/1/dsm -i guid -t "Scotland Lidar Phase 1" -o phase-1-dsm.json

## Examples for the existing Scotland LIDAR data

### LAZ Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.1k.grid.scotland.geojson --path phase-1/laz/27700/gridded -c scotland-gov/lidar/phase-1/laz -t "Scotland Lidar Phase 1" -o ./data/lidar-1-laz.json

### DSM Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-1/dsm/27700/gridded -c scotland-gov/lidar/phase-1/dsm -t "Scotland Lidar Phase 1" -o ./data/lidar-1-dsm.json

### DTM Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-1/dtm/27700/gridded -c scotland-gov/lidar/phase-1/dtm -t "Scotland Lidar Phase 1" -o ./data/lidar-1-dtm.json

### LAZ Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.5k.grid.scotland.geojson --path phase-2/laz/27700/gridded -c scotland-gov/lidar/phase-2/laz -t "Scotland Lidar Phase 2" -o ./data/lidar-2-laz.json

### DSM Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-2/dsm/27700/gridded -c scotland-gov/lidar/phase-2/dsm -t "Scotland Lidar Phase 2" -o ./data/lidar-2-dsm.json

### DTM Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-2/dtm/27700/gridded -c scotland-gov/lidar/phase-2/dtm -t "Scotland Lidar Phase 2" -o ./data/lidar-2-dtm.json

### DSM Phase 3

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.5k.grid.scotland.geojson --path phase-3/dsm/27700/gridded -c scotland-gov/lidar/phase-3/dsm -t "Scotland Lidar Phase 3" -o ./data/lidar-3-dsm.json

Removed the previously-uploaded 1k (I think!) squares using a glob.
    aws s3 rm --dryrun --recursive --exclude "*" --include "*_1M_*" s3://scotland-gov-lidar-beta/phase-3/dsm/27700/gridded
Removed all the NX square because there is no gridsquare for them.
    aws s3 rm --dryrun --recursive --exclude "*" --include "NX*" s3://scotland-gov-lidar-beta/phase-3/dsm/27700/gridded/

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/OSGB_Grid_5km.geojson --path phase-3/dsm/27700/gridded -c scotland-gov/lidar/phase-3/dsm -t "Scotland Lidar Phase 3" -o ./data/lidar-3-dsm.json

### DTM Phase 3

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.5k.grid.scotland.geojson --path phase-3/dtm/27700/gridded -c scotland-gov/lidar/phase-3/dtm -t "Scotland Lidar Phase 3" -o ./data/lidar-3-dtm.json

Removed the previously-uploaded 1k (I think!) squares using a glob.
    aws s3 rm  --dryrun --recursive --exclude "*" --include "*_1M_*" s3://scotland-gov-lidar-beta/phase-3/dtm/27700/gridded
Removed all the NX square because there is no gridsquare for them.
    aws s3 rm --dryrun --recursive --exclude "*" --include "NX*" s3://scotland-gov-lidar-beta/phase-3/dtm/27700/gridded/

### LAZ Phase 3

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.1k.grid.scotland.geojson --path phase-3/laz/27700/gridded -c scotland-gov/lidar/phase-3/laz -t "Scotland Lidar Phase 3" -o ./data/lidar-3-laz.json

I deleted:
  nx1429_4PPM_LAS_PHASE3.laz
  nx1529_4PPM_LAS_PHASE3.laz
  nx1629_4PPM_LAS_PHASE3.laz
Because they caused the script to fail. Interestingly they were lowercase `nx` not `NX` - but renaming them to uppercase still didn't work. There are no NX gridsqaure in the grid file!

## Importing the JSON files into a catalog

Refer to the Importer README.md under `app/import`.

You need to run the importer, probably locally with `yarn dev`, setting the .env variables to point to the database that you want to write to. Then, run the importer.

For example;

    python importer.py -p -a http://localhost:8081 -i ./scotland-gov-lidar/scotland-gov-lidar-ogc.json
    python importer.py -p -a http://localhost:8081 -i ./scotland-gov-lidar/scotland-gov-lidar-ogc-phase3.json
    python importer.py -p -a http://localhost:8081 -i ./scotland-gov-lidar/data/lidar-3-dsm.json
    python importer.py -p -a http://localhost:8081 -i ./scotland-gov-lidar/data/lidar-3-dtm.json
    python importer.py -p -a http://localhost:8081 -i ./scotland-gov-lidar/data/lidar-3-laz.json
