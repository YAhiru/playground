import { createPool } from "mysql2";
import { ok } from "node:assert";
import { env } from "node:process";

export function pool() {
  return createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "playground",
    port: 3306,
  });
}

type DbConfig = {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  url: string;
};
export function loadConfig(): DbConfig {
  const database = env.DATABASE_NAME;
  ok(database, "DATABASE_NAME is required");
  const host = env.DATABASE_HOST;
  ok(host, "DATABASE_HOST is required");
  const username = env.DATABASE_USER;
  ok(username, "DATABASE_USER is required");
  const password = env.DATABASE_PASSWORD;
  ok(password, "DATABASE_PASSWORD is required");
  const port = env.DATABASE_PORT;
  ok(port, "DATABASE_PORT is required");

  return {
    host,
    user: username,
    password,
    database,
    port: Number(port),
    url: `mysql://${username}:${password}@${host}:${port}/${database}`,
  };
}
