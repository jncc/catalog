import * as express from "express";
import * as bodyParser from "body-parser"
import * as ajv from 'ajv';
import * as ValidationHelper from "./validation/validationHelper";
import { ProductValidator } from "./validation/productValidator"
import * as Product from "./definitions/product/product";
import * as Collection from "./definitions/collection/collection";
import { getEnvironmentSettings } from "./settings";
import { CatalogRepository } from "./repository/catalogRepository";
import { Query } from "./query"
import { QueryValidator } from "./validation/queryValidation"

import { Fixtures } from "./test/fixtures"

let app = express();
let env = getEnvironmentSettings(app.settings.env);
let catalogRepository = new CatalogRepository();

process.on('unhandledRejection', r => console.log(r));

// parse json body requests
app.use(bodyParser.json());


enum SearchType {
  product,
  collection
}

class Result {
  query: Query
  promisedResult: Promise<any>
}

function search(req, res, searchType: SearchType) {

  //todo validate query here

  let query = new Query(req)
  let result: Promise<any>

  if (searchType == SearchType.product) {
    result = catalogRepository.getProducts(query, 50, 0)
  } else {
    result = catalogRepository.getCollections(query, 50, 0)
  }

  result.then(x => {
    res.json({
      query: query,
      result: x
    })
  }).catch(x => {
    res.status(500);
    res.json({
      query: query,
      errors: x.message
    })
  })
}

app.get(`/collection/search/*?`, async (req, res) => {
  search(req, res, SearchType.collection)
})

app.get(`/product/search/*?`, async (req, res) => {
  search(req, res, SearchType.product)
})


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



