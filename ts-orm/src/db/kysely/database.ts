import { Kysely, MysqlDialect } from "kysely";
import { DB } from "./schema";
import { pool } from "../../mysql";

export function createKysely(): Kysely<DB> {
  const dialect = new MysqlDialect({
    pool: pool(),
  });

  return new Kysely({
    dialect,
  });
}
