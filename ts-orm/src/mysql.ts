import { createPool } from "mysql2";

export function pool() {
  return createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "playground",
    port: 3306,
  });
}
