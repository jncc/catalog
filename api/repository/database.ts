
import * as pgPromise from "pg-promise";
import { IDatabase, IMain } from "pg-promise";

/* Singleton database client. */
export class Database {

  // tslint:disable-next-line:variable-name
  private static _instance: Database;
  public readonly connection: IDatabase<any>;

    constructor() {
        let pgp = pgPromise();
        let cs = `postgres://${process.env.PGAUTH}@${process.env.SERVER_IP}/${process.env.DATABASE}?ssl=${process.env.SSL}`;
        this.connection = pgp(cs);
    }

    static get instance(): Database {
        if (!Database._instance) {
            Database._instance = new Database();
        }
        return Database._instance;
    }
}
