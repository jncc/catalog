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

app.get(`/search/*?`, async (req, res) => {
  let param: string = req.params[0];

  let footprint: string | undefined = undefined;
  let spatialop: string | undefined = undefined;
  let properties: any = {}

  for (let query in req.query) {
    if (query === 'footprint') {
      footprint = req.query[query];
    } else if (query === 'spatialop') {
      spatialop = req.query[query];
    } else {
      properties[query] = req.query[query];
    }
  }

  let respObj = {
    "term": param,
    "params": {
      "footprint": footprint,
      "spatialop": spatialop,
      "properties": properties
    }
  }

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

  productValidtor.validate(product).then(result => {
    res.sendStatus(200)
  }).catch(result => {
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



