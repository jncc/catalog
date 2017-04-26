
import * as express from "express";
import * as bodyParser from "body-parser"
import * as ajv from 'ajv';
import * as ValidationHelper from "./validation/validationHelper";
import * as Product from "./definitions/product/product";
import { getEnvironmentSettings } from "./settings";
import { validateProduct } from "./product/validateProduct"
import { CatalogRepository } from "./repository/catalogRepository"
//import { Product, validate, Schema } from "./definitions/product/product"

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
  let pattern = /^(([A-Za-z0-9\-\_\.]+)(\/))+([A-Za-z0-9\-\_\.])+/
  let param: string = req.params[0];
  let matches = param.match(pattern)

  console.log(param)
  console.log(matches)

  if (matches === null || matches === undefined) {
    res.status(400)
    res.json({ "error": "Search term must be provided as a valid path" })
  } else {
    catalogRepository.getProducts(param, 50, 0).then(results => {
      res.json({
        "term": req.params[0],
        "params": req.query,
        "results": results
      })
    }).catch(errors => {
      res.status(500)
      res.json({
        "errors": errors 
      });
    });

  }
});

app.get(`/product/*?`, async (req, res) => {

  let raw: string = req.params[0];
  let collection = raw.substring(0, raw.lastIndexOf('/'))
  let product = raw.substring(raw.lastIndexOf('/') + 1)

  res.json({
    "term": req.params[0],
    "params": req.query,
    "collection": collection,
    "product": product

  });
});

app.post(`/validate`, async (req, res) => {
  let product: Product.Product = req.body;
  Product.validate(product).then(result => {
    res.send(result)
  }).catch(result => {
    res.send(result)
  });
});

// store the query and give me a key for it
app.post(`/add/product`, async (req, res) => {
  let product: Product.Product = req.body;
  Product.validate(product).then(result => {
    res.send(result)
    try {
      catalogRepository.storeProduct(product).then(productId => {
        res.json({ productId: productId });
      }).catch(error => {
        res.status(500);
        res.send(error);
      })
    }
    catch (e) {
      res.sendStatus(500);
    }
  }).catch(result => {
    res.statusCode = 400
    res.send("Product validation error: " + result);
  });
});


// start the express web server
app.listen(env.port, () => {
  console.log(`it's ` + new Date().toISOString());
  console.log(`app.server is listening on: http://localhost:${env.port}`);
  console.log(`node environment is ${env.name}`);
});

