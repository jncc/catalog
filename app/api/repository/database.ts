import * as knex from 'knex';
import { Logger } from "../logging/logger";

export class Database {
  private static _instance: Database;
  public readonly queryBuilder: knex;

  constructor() {
    let logger = Logger.GetLog()

    logger.debug(`Using host '${process.env.PGHOST}' and database '${process.env.PGDATABASE}'`)

    let cs = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
    
    if (process.env.PGSSL) {
      cs = cs + '?ssl=true';
      logger.debug(`Enabling SSL for database connection`)
    }

    this.queryBuilder = knex({
      client: 'pg',
      connection: cs,
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
