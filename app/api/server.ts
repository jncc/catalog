import * as bodyParser from "body-parser";
import * as express from "express";
import * as Product from "./definitions/product/product";

import { Logger } from "./logging/logger";
import { Query } from "./query";
import { getEnvironmentSettings } from "./settings";
import { ProductValidator } from "./validation/productValidator";
import { CollectionRequestValidator } from "./validation/request/collectionRequestValidator";
import { ProductRequestValidator } from "./validation/request/productRequestValidator";
import { ProductQueries } from "./repository/productQueries";
import { CollectionQueries } from "./repository/collectionQueries";
import { ProductStore } from "./repository/productStore";


let app = express();
let env = getEnvironmentSettings(app.settings.env);
let logger = Logger.Logger();
// let catalogRepository = new CatalogRepository(logger);
let productQueries = new ProductQueries();
let collectionQueries = new CollectionQueries();

process.on("unhandledRejection", (r) => logger.warn(r));

// parse json body requests
app.use(bodyParser.json());
app.use('/docs', express.static('./built/docs'))

app.get('/alive', async (req, res) => {
  res.send('Hello from catalog')
})

app.get(`/search/collection/*?`, async (req, res) => {
  let query = new Query(req.params[0], req.query);
  let reqErrors = CollectionRequestValidator.validate(query).then(() => {
    collectionQueries.getCollections(query, 50, 0).then((results) => {
      res.json({
        query: query,
        result: results
      });
    }).catch((error) => {
      res.status(500);
      res.json({
        query: query,
        errors: error.message
      });
    });
  }).catch((errors) => {
    res.status(400);
    res.json({
      errors: reqErrors
    });
  });
});

app.post(`/search/product/count`, async (req, res) => {
  let query = new Query(req.body.collection, req.body);

  ProductRequestValidator.validate(query, collectionQueries).then(() => {
    productQueries.getProductCount(query)
      .then((result) => {
        res.json({
          query: query,
          result: result
        });
      }).catch((error) => {
        console.error(error.message)
        res.status(500);
        res.json({
          query: query,
          errors: "A database error has occurred"
        });
      });
  });
});

app.post(`/search/product/countByCollection`, async (req, res) => {
  let query = new Query(req.body.collection, req.body);

  ProductRequestValidator.validate(query, collectionQueries).then(() => {
    productQueries.getProductCountByCollection(query)
      .then((result) => {
        res.json({
          query: query,
          result: result
        });
      }).catch((error) => {
        console.error(error.message)
        res.status(500);
        res.json({
          query: query,
          errors: "A database error has occurred"
        });
      });
  });
});

app.post(`/search/product`, async (req, res) => {
  let requestParameter = req.params[0];
  let query = new Query(req.body.collection, req.body);

  ProductRequestValidator.validate(query, collectionQueries).then(() => {
    productQueries.getProducts(query)
      .then((result) => {
        res.json({
          query: query,
          result: result
        });
      }).catch((error) => {
        console.error(error.message)
        res.status(500);
        res.json({
          query: query,
          errors: "A database error has occurred"
        });
      })
  }).catch((errors) => {
    res.status(400);
    res.json({
      errors: errors
    });
  });
});

app.post(`/validate/product`, async (req, res) => {
  let product: Product.IProduct = req.body;
  let productValidtor = new ProductValidator(collectionQueries);

  productValidtor.validate(product)
    .then((result) => {
      res.sendStatus(200);
    }).catch((result) => {
      res.status(400);
      res.send(result);
    });
});

// store the query and give me a key for it
app.post(`/add/product`, async (req, res) => {
  let product: Product.IProduct = req.body;
  let productValidtor = new ProductValidator(collectionQueries);

  // todo check product exists

  throw new Error("Not implemented")

  // try {
  //   await productValidtor.validate(product);
  // } catch ((result) => {
  //   res.statusCode = 400;
  //   res.send(result);
  //   return;
  // });

  // let store = new ProductStore();

  // var id = await store.storeProduct(product);


  // productValidtor.validate(product).then((result) => {
  //   try {
  //     store.storeProduct(product).then((productId) => {
  //       res.json({ productId: productId });
  //     }).catch((error) => {
  //       res.status(500);
  //     });
  //   } catch (e) {
  //     res.sendStatus(500);
  //   }
  // }).catch((result) => {
  //   res.statusCode = 400;
  //   res.send(result);
  // });
});

if (!module.parent) {
  app.listen(env.port, () => {
    logger.info(`app.server is listening on: http://localhost:${env.port}`);
    logger.info(`node environment is ${env.name}`);
  });
}
