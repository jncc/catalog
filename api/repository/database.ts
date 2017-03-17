
import * as pgPromise from "pg-promise";
import { IMain, IDatabase } from "pg-promise";

/* Singleton database client. */
export class Database {

    public readonly connection: IDatabase<any>
    private static _instance: Database;

    constructor() {
        let pgp = pgPromise();
        let cs = `postgres://${process.env.PGAUTH}@${process.env.SERVER_IP}/catalog`;
        this.connection = pgp(cs);
    }

    static get instance(): Database {
        if (!Database._instance) {
            Database._instance = new Database();
        }
        return Database._instance;
    }
}

