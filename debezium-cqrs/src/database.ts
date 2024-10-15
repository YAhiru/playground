import { ColumnType, Generated, JSONColumnType } from 'kysely';
import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';

export interface Database {
  order_events: OrderEventTable;
  orders: OrderTable;
  consumed_order_events: ConsumedOrderEvent;
}

export interface OrderEventTable {
  id: Generated<number>;
  order_id: string;
  type: string;
  payload: JSONColumnType<any>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface OrderTable {
  id: string;
  price: number;
  ordered_at: ColumnType<Date, string | Date, never>;
}

export interface ConsumedOrderEvent {
  id: number;
}

const dialect = new MysqlDialect({
  pool: createPool({
    database: 'debezium',
    host: 'mysql',
    user: 'root',
    password: 'password',
    port: 3306,
    connectionLimit: 10,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
