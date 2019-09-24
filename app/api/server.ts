import * as bodyParser from "body-parser";
import * as express from "express";
import * as Product from "./definitions/product/product";

import { Logger } from "./logging/logger";
import { ProductQuery } from "./query/productQuery";
import { getEnvironmentSettings } from "./settings";
import { ProductValidator } from "./validation/productValidator";
import { CollectionRequestValidator } from "./validation/request/collectionRequestValidator";
import { ProductRequestValidator } from "./validation/request/productRequestValidator";
import { CollectionStore } from "./repository/collectionStore";
import { CollectionQuery } from "./query/collectionQuery";
import { ProductStore } from "./repository/productStore";
import * as Footprint from "./definitions/components/footprint";

let app = express();
let env = getEnvironmentSettings();
let productStore = new ProductStore();
let collectionStore = new CollectionStore();
let productRequestValidator = new ProductRequestValidator(collectionStore);
let log = Logger.GetLog();

process.on("unhandledRejection", (r) => log.warn(r));

// parse json body requests
app.use(bodyParser.json());
app.use('/docs', express.static('./built/docs'))

// enable CORS for all requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

// DEFINE ALL OTHER USE METHODS BEFORE THIS
app.use((err, req, res, next) => {
  log.error(err)

  if (res.headersSent) {
    next(err)
  } else {
    res.status(500);
    res.json({
      errors: "An error has occured"
    });
  }
})

app.get('/alive', async (req, res) => {
  res.send('Hello from catalog!')
})

app.get(`/search/collection/*?`, async (req, res, next) => {
  let query = new CollectionQuery({collection: req.params[0]});

  let errors = CollectionRequestValidator.validate(query);

  if (errors.length > 0) {
    res.status(400);
    res.json({
      query: query,
      errors: errors
    });

  } else {

    try {
      let collections = await collectionStore.getCollections(query);

      res.json({
        query: query,
        result: collections
      });
    } catch (error) {
      console.log("db error", error);

      log.error(error);

      res.status(500);
      res.json({
        query: query,
        errors: "An error has occured"
      });
    };
  }
});

app.post(`/search/product/count`, async (req, res) => {
  let query = new ProductQuery(req.body);

  try {
    await productRequestValidator.validate(query)
  } catch (errors) {
    res.status(400);
    res.json({
      query: query,
      errors: errors
    });

    return;
  }

  try {
    let productCount = await productStore.getProductCount(query);

    res.json({
      query: query,
      result: productCount
    })

  } catch (error) {
    log.error(error);

    res.status(500);
    res.json({
      query: query,
      errors: "An error has occurred"
    });
  }

});

app.post(`/search/product/countByCollection`, async (req, res) => {
  let query = new ProductQuery(req.body);

  try {
    await productRequestValidator.validate(query)
  } catch (errors) {
    res.status(400);
    res.json({
      query: query,
      errors: errors
    });

    return;
  }

  try {
    let countByCollection = await productStore.getProductCountByCollection(query)

    res.json({
      query: query,
      result: countByCollection
    });
  } catch (error) {
    log.error(error);

    res.status(500);
    res.json({
      query: query,
      errors: "An error has occurred"
    });
  }

});

app.post(`/search/product`, async (req, res) => {
  let query = new ProductQuery(req.body);

  try {
    await productRequestValidator.validate(query)
  } catch (errors) {
    res.status(400);
    res.json({
      query: query,
      errors: errors
    });

    return;
  }

  try {
    let products = await productStore.getProducts(query)

    res.json({
      query: query,
      result: products
    });
  } catch (error) {
    log.error(error);

    res.status(500);
    res.json({
      query: query,
      errors: "An error has occurred"
    });
  }

});

app.post(`/validate/product`, async (req, res) => {
  let product: Product.IProduct = req.body;
  let productValidtor = new ProductValidator(collectionStore);

  if ("footprint" in product) {
    product.footprint = Footprint.fixCRS(product.footprint);
  }

  try {
    await productValidtor.validate(product)
    res.status(200);
    res.json({
      productName: product.name,
      collectionName: product.collectionName,
      valid: true
    });
  } catch (errors) {
    res.status(400);
    res.json({
      productName: product.name,
      collectionName: product.collectionName,
      valid: false,
      validationErrors: errors
    });
  }

});

// store the query and give me a key for it
app.post(`/add/product`, async (req, res) => {
  if (process.env.READ_ONLY) {
    res.statusCode = 403
    return;
  }

  let product: Product.IProduct = req.body;
  let productValidtor = new ProductValidator(collectionStore);

  // todo check product exists

  if ("footprint" in product) {
    product.footprint = Footprint.fixCRS(product.footprint);
  }

  try {
    await productValidtor.validate(product);
  } catch (errors) {
    res.statusCode = 400;
    res.json({
      productName: product.name,
      collectionName: product.collectionName,
      valid: false,
      validationErrors: errors
    });
    return;
  };

  try {

    var productId = await productStore.storeProduct(product);
    res.status(200);
    res.json({
      productName: product.name,
      collectionName: product.collectionName,
      productId: productId
    });

  } catch(error) {
    log.error(error);

    res.status(500);
    res.json({
      productName: product.name,
      collectionName: product.collectionName,
      errors: "A database error occured, unable to save product"
    })
  }
});

if (!module.parent) {
  app.listen(env.port, () => {
    log.info(`app.server is listening on: http://localhost:${env.port}`);
    log.info(`node environment is ${app.settings.env}`);
    if (process.env.READ_ONLY) {
      log.info(`catalog is READ ONLY`)
    }

  });
}


