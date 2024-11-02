import { ColumnType, Generated, JSONColumnType } from 'kysely';
import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';

export interface Database {
  events: EventTable;
  orders: OrderTable;
  consumed_events: ConsumedEvent;
}

export interface EventTable {
  id: Generated<number>;
  aggregate_id: string;
  event_name: string;
  payload: JSONColumnType<any>;
  sequence_number: number;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface OrderTable {
  id: string;
  price: number;
  ordered_at: ColumnType<Date, string | Date, never>;
}

export interface ConsumedEvent {
  id: number;
}

const dialect = new MysqlDialect({
  pool: createPool({
    database: 'debezium',
    host: process.env.DATABASE_HOST ?? 'mysql',
    user: 'root',
    password: 'password',
    port: 3306,
    connectionLimit: 10,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
