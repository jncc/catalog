import * as express from "express";
import * as bodyParser from "body-parser"
import * as ajv from 'ajv';
import * as ValidationHelper from "./validation/validationHelper";
import { ProductValidator } from "./validation/productValidator"
import * as Product from "./definitions/product/product";
import * as Collection from "./definitions/collection/collection";
import { getEnvironmentSettings } from "./settings";
import { CatalogRepository } from "./repository/catalogRepository";

import { Fixtures } from "./test/fixtures"

let app = express();
let env = getEnvironmentSettings(app.settings.env);
let catalogRepository = new CatalogRepository();

process.on('unhandledRejection', r => console.log(r));

// parse json body requests
app.use(bodyParser.json());

function getRespObj(param: string, footprint: string | undefined, spatialop: string | undefined, properties: any) {
  let respObj: any = {
    "term": param,
    "params": {}
  };

  if (footprint != undefined) {
    respObj['params']['footprint'] = footprint;
  }

  if (spatialop != undefined) {
    respObj['params']['spatialop'] = spatialop;
  }

  if (Object.keys(properties).length > 0) {
    respObj['params']['properties'] = properties;
  }

  return respObj;
}

function extractQueryParams(param: string, queryParams: any) {
  let footprint: string | undefined = undefined;
  let spatialop: string | undefined = undefined;
  let properties: any = {}

  for (let query in queryParams) {
    if (query === 'footprint') {
      footprint = queryParams[query];
    } else if (query === 'spatialop') {
      spatialop = queryParams[query];
    } else {
      properties[query] = queryParams[query];
    }
  }

  return [footprint, spatialop, properties]
}

app.get(`/collection/search/*?`, async (req, res) => {
  let param: string = req.params[0];
  let extracted = extractQueryParams(param, req.query)

  let footprint: string | undefined = extracted[0];
  let spatialop: string | undefined = extracted[1];
  // properties should be ignored in this instance
  //let properties: any = extracted[2];
  let properties: any = {}

  let respObj: any = getRespObj(param, footprint, spatialop, properties)

  if (param.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
    catalogRepository.getCollections(param, 50, 0, footprint, spatialop, properties).then(results => {
      respObj['results'] = results;
      res.json(respObj);
    }).catch(errors => {
      respObj['errors'] = errors;
      res.status(500);
      res.json(respObj);
    });
  } else {
    respObj['errors'].push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
    res.status(400);
    res.json(respObj);
  }
});

app.get(`/product/search/*?`, async (req, res) => {
  let param: string = req.params[0];

  let extracted = extractQueryParams(param, req.query)

  let respObj: any = extracted[0]
  let footprint: string | undefined = extracted[1];
  let spatialop: string | undefined = extracted[2];
  let properties: any = extracted[3];

  if (param.match(/^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$/)) {
    catalogRepository.getProducts(param, 50, 0, footprint, spatialop, properties).then(results => {
      respObj['results'] = results;
      res.json(respObj);
    }).catch(errors => {
      respObj['errors'] = errors;
      res.status(500);
      res.json(respObj);
    });
  } else {
    respObj['errors'].push('searchParam | should be a path matching the pattern "^(([A-Za-z0-9\-\_\.\*]+)(\/))*([A-Za-z0-9\-\_\.\*])+$"');
    res.status(400);
    res.json(respObj);
  }
});

app.post(`/validate`, async (req, res) => {
  let product: Product.Product = req.body;
  let productValidtor = new ProductValidator(catalogRepository)

  productValidtor.validate(product)
    .then(result => {
      res.sendStatus(200)
    }).catch(result => {
      console.log(result)
      res.statusCode = 400
      res.send(result)
    });
});

// store the query and give me a key for it
app.post(`/add/product`, async (req, res) => {
  let product: Product.Product = req.body;
  let productValidtor = new ProductValidator(catalogRepository)

  productValidtor.validate(product).then(result => {
    try {
      catalogRepository.storeProduct(product).then(productId => {
        res.json({ productId: productId });
      }).catch(error => {
        res.status(500);
      })
    }
    catch (e) {
      res.sendStatus(500);
    }
  }).catch(result => {
    res.statusCode = 400
    res.send(result);
  });
});


// start the express web server
app.listen(env.port, () => {
  console.log(`it's ` + new Date().toISOString());
  console.log(`app.server is listening on: http://localhost:${env.port}`);
  console.log(`node environment is ${env.name}`);
});



