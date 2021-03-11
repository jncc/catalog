# Scottish LIDAR generator example code

The `scotland-lidar-json-generator.py` script generates the JSON required for the importer by reading the lidar data files on S3.

It needs the relevant list of OSGB grid references, which are in GeoJSON (10k, 5k or 1k) grid files.

These can be unzipped in `grids/scotland-os-grids-wgs84`. However, the Phase 3 data included gridsquares which aren't included in these files. We found some here https://github.com/charlesroper/OSGB_Grids which appear to be more comprehensive. The files are very similar, but the property name for the tile is `TILE_NAME` or `PLAN_NO`, not `id` **The script obviously needs the correct property names for the grid file you are running the script against. (For example, it would need changing back to `id` to use the zipped grid files in this repo.)**.

*****************************************************
Tip: Just see the full list of historical examples below.
*****************************************************

## Arguments

- `-b` - S3 bucket to scan
- `-r` - S3 bucket region
- `-p` - AWS profile to use to provide permissions (optional)
- `-g` - Appropriate GeoJSON file for this collection i.e. 10k / 5k / 1k
- `--path` - The S3 bucket prefix to scan over i.e. folder containing collection
- `-c` - The collection name for this run (Must exist)
- `-t` - A title used for the collections (used to compsite the product names i.e. `Scotland Lidar Phase 1`)
- `-o` - The output file path / filename

- The Phase 1 and 2 DSM / DTM collections use a 10k grid, while phase-1-laz uses 1k and phase-2-laz uses 5k.
- Phase 3 DSM / DTM use a 5k grid, and the laz uses 1k.
- Phase 4 DSM / DTM use a 5k grid, and the laz uses 1k.

## Historical examples for Scotland LIDAR data

You obviously need a working *Python environment*. For example:

    pwd                        # /mnt/c/Work/catalog/app/import/scotland-gov-lidar
    python3 -m venv .venv      # make a python virtual env in a dir called `.venv`
    source .venv/bin/activate  # activate the venv
    pip install -r ./scotland-lidar-json-generator-requirements.txt

### Phase 1

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.1k.grid.scotland.geojson --path phase-1/laz/27700/gridded -c scotland-gov/lidar/phase-1/laz -t "Scotland Lidar Phase 1" -o ./data/lidar-1-laz.json

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-1/dsm/27700/gridded -c scotland-gov/lidar/phase-1/dsm -t "Scotland Lidar Phase 1" -o ./data/lidar-1-dsm.json


    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-1/dtm/27700/gridded -c scotland-gov/lidar/phase-1/dtm -t "Scotland Lidar Phase 1" -o ./data/lidar-1-dtm.json

### Phase 2

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.5k.grid.scotland.geojson --path phase-2/laz/27700/gridded -c scotland-gov/lidar/phase-2/laz -t "Scotland Lidar Phase 2" -o ./data/lidar-2-laz.json

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-2/dsm/27700/gridded -c scotland-gov/lidar/phase-2/dsm -t "Scotland Lidar Phase 2" -o ./data/lidar-2-dsm.json

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/scotland-os-grids-wgs84/wgs84.10k.grid.uk.geojson --path phase-2/dtm/27700/gridded -c scotland-gov/lidar/phase-2/dtm -t "Scotland Lidar Phase 2" -o ./data/lidar-2-dtm.json

### Phase 3

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/OSGB_Grid_5km.geojson --path phase-3/dsm/27700/gridded -c scotland-gov/lidar/phase-3/dsm -t "Scotland Lidar Phase 3" -o ./data/lidar-3-dsm.json

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/OSGB_Grid_5km.geojson --path phase-3/dtm/27700/gridded -c scotland-gov/lidar/phase-3/dtm -t "Scotland Lidar Phase 3" -o ./data/lidar-3-dtm.json

Need to change the script to use `PLAN_NO` instead of `TILE_NAME` as that's the attribute name in the grid file.

    python ./scotland-lidar-json-generator.py -b scotland-gov-lidar-beta -r eu-west-1 -g ./data/grids/OSGB_Grid_1km.geojson --path phase-3/laz/27700/gridded -c scotland-gov/lidar/phase-3/laz -t "Scotland Lidar Phase 3" -o ./data/lidar-3-laz.json

### Phase 4

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path phase-4/dsm/27700/gridded \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_5km.geojson \
        --collection scotland-gov/lidar/phase-4/dsm \
        --collectiontitle "Scotland Lidar Phase 4" \
        --output ./data/lidar-4-dsm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path phase-4/dtm/27700/gridded \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_5km.geojson \
        --collection scotland-gov/lidar/phase-4/dtm \
        --collectiontitle "Scotland Lidar Phase 4" \
        --output ./data/lidar-4-dtm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

Need to change the script to use `PLAN_NO` instead of `TILE_NAME` as that's the attribute name in the grid file.

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path phase-4/laz/27700/gridded \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_1km.geojson \
        --collection scotland-gov/lidar/phase-4/laz \
        --collectiontitle "Scotland Lidar Phase 4" \
        --output ./data/lidar-4-laz.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

### Outer Hebrides

Need to change the script to use `PLAN_NO` instead of `TILE_NAME` as that's the attribute name in the grid file.

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path outer-hebrides/2019/dsm/25cm/27700/gridded/ \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_1km.geojson \
        --collection scotland-gov/lidar/outerheb-2019/dsm/25cm \
        --collectiontitle "Outer Hebrides 19" \
        --output ./data/outer-hebrides-2019-dsm-25cm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path outer-hebrides/2019/dtm/25cm/27700/gridded/ \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_1km.geojson \
        --collection scotland-gov/lidar/outerheb-2019/dtm/25cm \
        --collectiontitle "Outer Hebrides 19" \
        --output ./data/outer-hebrides-2019-dtm-25cm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path outer-hebrides/2019/laz/4ppm/27700/gridded/ \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_1km.geojson \
        --collection scotland-gov/lidar/outerheb-2019/laz/4ppm \
        --collectiontitle "Outer Hebrides 19" \
        --output ./data/outer-hebrides-2019-laz-4ppm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path outer-hebrides/2019/laz/16ppm/27700/gridded/ \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_1km.geojson \
        --collection scotland-gov/lidar/outerheb-2019/laz/16ppm \
        --collectiontitle "Outer Hebrides 19" \
        --output ./data/outer-hebrides-2019-laz-16ppm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

Need to change the script to use `TILE_NAME` instead of `PLAN_NO` as that's the attribute name in the grid file.

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path outer-hebrides/2019/dsm/50cm/27700/gridded/ \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_5km.geojson \
        --collection scotland-gov/lidar/outerheb-2019/dsm/50cm \
        --collectiontitle "Outer Hebrides 19" \
        --output ./data/outer-hebrides-2019-dsm-50cm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly

    python ./scotland-lidar-json-generator.py \
        --bucket scotland-gov-lidar-beta \
        --path outer-hebrides/2019/dtm/50cm/27700/gridded/ \
        --geojson ./data/grids/uk-os-grids/OSGB_Grid_5km.geojson \
        --collection scotland-gov/lidar/outerheb-2019/dtm/50cm \
        --collectiontitle "Outer Hebrides 19" \
        --output ./data/outer-hebrides-2019-dtm-50cm.json \
        --region eu-west-1 \
        --profile jncc-prod-readonly
