
import * as express from "express";
import * as bodyParser from "body-parser"

import { getEnvironmentSettings } from "./settings";

let app = express();
let env = getEnvironmentSettings(app.settings.env);

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

// start the express web server
app.listen(env.port, () => {
  console.log(`it's ` + new Date().toISOString());
  console.log(`app.server is listening on: http://localhost:${env.port}`);
  console.log(`node environment is ${env.name}`);
});

