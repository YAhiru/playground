import { InsertObject, Kysely } from "kysely";
import { DB } from "./db/kysely/schema";

export class Seeder {
  constructor(private conn: Kysely<DB>) {}

  async user(params: Partial<InsertObject<DB, "users">>): Promise<number> {
    const result = await this.conn
      .insertInto("users")
      .values({
        name: "testing user",
        ...params,
      })
      .execute();

    return Number(result[0].insertId);
  }

  async room(
    params: Partial<InsertObject<DB, "rooms">> & { user_id: number },
  ): Promise<number> {
    const result = await this.conn
      .insertInto("rooms")
      .values({
        room_name: "testing room",
        ...params,
      })
      .execute();

    return Number(result[0].insertId);
  }

  async message(
    params: Partial<InsertObject<DB, "messages">> & {
      room_id: number;
      user_id: number;
    },
  ): Promise<number> {
    const result = await this.conn
      .insertInto("messages")
      .values({
        message: "testing message",
        ...params,
      })
      .execute();

    return Number(result[0].insertId);
  }
}
