import * as pgPromise from "pg-promise";
import { IDatabase, IMain } from "pg-promise";

/* Singleton database client. */
export class sqelDatabase {

  // tslint:disable-next-line:variable-name
  private static _instance: sqelDatabase;
  public readonly connection: IDatabase<any>;

  constructor() {
    let pgp = pgPromise();
    let cs = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?ssl=${process.env.PGSSL}`;
    this.connection = pgp(cs);
  }

  static get instance(): sqelDatabase {
    if (!sqelDatabase._instance) {
      sqelDatabase._instance = new sqelDatabase();
    }
    return sqelDatabase._instance;
  }
}
