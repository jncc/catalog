import * as knex from 'knex';
import { Logger } from "../logging/logger";
import * as fs from 'fs';
import { ConnectionOptions } from 'tls';

export class Database {
  private static _instance: Database;
  public readonly queryBuilder: knex.Knex;

  constructor() {
    let logger = Logger.GetLog()

    logger.debug(`Using host '${process.env.PGHOST}' and database '${process.env.PGDATABASE}'`)
      
    let ssl : boolean | ConnectionOptions = false;
    if (process.env.PGSSL) {
      ssl = { 
        ca: fs.readFileSync('built/certs/global-bundle.pem').toString()
      }
      logger.debug(`Enabling SSL for database connection`)
    }

    let conn = {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      ssl: ssl
    };

    this.queryBuilder = knex.default({
      client: 'pg',
      connection: conn,
      pool: {
        min: 2,
        max: 10
      },
      log: {
        warn(message) {
          logger.warn(message);
        },
        error(message) {
          logger.error(message);
        },
        deprecate(message) {
          logger.info(message);
        },
        debug(message) {
          logger.debug(message);
        },
      },
      debug: true,
    });
  }

  static get instance(): Database {
    if (!Database._instance) {
      Database._instance = new Database();
    }
    return Database._instance;
  }

}
