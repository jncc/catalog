
import * as express from "express";
import * as bodyParser from "body-parser"
import * as ajv from 'ajv';

import { getEnvironmentSettings } from "./settings";
import { validateProduct } from "./product/validateProduct"
import { CatalogRepository } from "./repository/catalogRepository"
import { Product, Schema } from "./definitions/product/product"

let app = express();
let env = getEnvironmentSettings(app.settings.env);
let catalogRepository = new CatalogRepository();

process.on('unhandledRejection', r => console.log(r));

// parse json body requests
app.use(bodyParser.json());

app.get(`/test`, async (req, res) => {
  res.send('fooo thing wibbl')
})

app.get(`/search/*?`, async (req, res) => {

  res.json({
    "term" : req.params[0],
    "params": req.query

  });
});

app.get(`/product/*?`, async (req, res) => {

  let raw:string = req.params[0];
  let collection = raw.substring(0, raw.lastIndexOf('/'))
  let product = raw.substring(raw.lastIndexOf('/') + 1)

  res.json({
    "term" : req.params[0],
    "params": req.query,
    "collection": collection,
    "product": product

  });
});

app.post(`/validate`, async (req, res) => {
  let product: Product = req.body;
  let validate = ajv({allErrors: true}).compile(Schema)
  let result = validate(product);
  console.log(result)
  console.log(validate.errors)
  res.send(result)
});

// store the query and give me a key for it
app.post(`/add/product`, async (req, res) => {
  let product: Product = req.body;

  try
  {
    validateProduct(product);
  }
  catch (e)
  { 
    res.statusCode = 400
    res.send("Product validation error: " + e);
    throw new Error(e);
  }
  

  try {
    let productId = await catalogRepository.storeProduct(product);
    res.json({ productId: productId });
  }
  catch (e) {
      res.sendStatus(500)
  }
  
});


// start the express web server
app.listen(env.port, () => {
  console.log(`it's ` + new Date().toISOString());
  console.log(`app.server is listening on: http://localhost:${env.port}`);
  console.log(`node environment is ${env.name}`);
});

