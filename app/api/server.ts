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

let app = express();
let env = getEnvironmentSettings(app.settings.env);
let productStore = new ProductStore();
let collectionStore = new CollectionStore();
let productRequestValidator = new ProductRequestValidator(collectionStore);
let logger = Logger.Logger();

process.on("unhandledRejection", (r) => logger.warn(r));

// parse json body requests
app.use(bodyParser.json());
app.use('/docs', express.static('./built/docs'))

app.get('/alive', async (req, res) => {
  res.send('Hello from catalog')
})

app.get(`/search/collection/*?`, async (req, res) => {
  let query: CollectionQuery;

  try {
    query = new CollectionQuery({collection: req.params[0]});
  } catch (error) {
    logger.error(error)

    res.json({
      errors: "error parsing query"
    });

    return;
  }

  let errors = CollectionRequestValidator.validate(query);

  if (errors.length > 0) {
    res.status(500);
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

      logger.error(error);

      res.status(500);

      res.json({
        query: query,
        errors: "An error has occured"
      });
    };

  }
});

app.post(`/search/product/count`, async (req, res) => {
  let query: ProductQuery;

  try {
    query = new ProductQuery(req.body);
  } catch (error) {
    logger.error(error)

    res.json({
      errors: "error parsing query"
    });

    return;
  }

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
    logger.error(error);

    res.status(500);
    res.json({
      query: query,
      errors: "An error has occurred"
    });
  }

});

app.post(`/search/product/countByCollection`, async (req, res) => {
  let query: ProductQuery;

  try {
    query = new ProductQuery(req.body);
  } catch (error) {
    logger.error(error)

    res.json({
      errors: "error parsing query"
    });

    return;
  }

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
    logger.error(error);

    res.status(500);
    res.json({
      query: query,
      errors: "An error has occurred"
    });
  }

});

app.post(`/search/product`, async (req, res) => {
  let query: ProductQuery;

  try {
    query = new ProductQuery(req.body);
  } catch (error) {
    logger.error(error)

    res.json({
      errors: "error parsing query"
    });

    return;
  }

  try {
    await productRequestValidator.validate(query)
  } catch (errors) {
    res.status(400);
    res.json({
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
    logger.error(error);

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

  try {
    await productValidtor.validate(product)
    res.sendStatus(200);
  } catch (errors) {
    res.status(400);
    res.send(errors);
  }

});

// store the query and give me a key for it
app.post(`/add/product`, async (req, res) => {
  let product: Product.IProduct = req.body;
  let productValidtor = new ProductValidator(collectionStore);

  // todo check product exists

  throw new Error("Not implemented")

  try {
    await productValidtor.validate(product);
  } catch (result) {
    res.statusCode = 400;
    res.send(result);
    return;
  };


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


