import * as knex from 'knex';
import { Logger } from "../logging/logger";

export class Database {
  private static _instance: Database;
  public readonly queryBuilder: knex;

  constructor() {
    let cs = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?ssl=${process.env.PGSSL}`;

    let logger = Logger.Logger()

    this.queryBuilder = knex({
      client: 'pg',
      connection: cs,
      pool: {
        min: 2,
        max: 10
      },
      log: {
        warn(message) {
          //logger.warn(message);
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
