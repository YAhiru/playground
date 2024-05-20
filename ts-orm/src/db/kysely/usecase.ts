import { Kysely } from "kysely";
import { NotFoundError, UseCases } from "../../usecases";
import { DB } from "./schema";

export const registerUser: (db: Kysely<DB>) => UseCases["registerUser"] =
  (db) => async (name: string) => {
    const result = await db.insertInto("users").values({ name }).execute();
    return Number(result[0].insertId);
  };

export const createRoom: (db: Kysely<DB>) => UseCases["createRoom"] =
  (db) => async (roomName: string, userId: number) => {
    const user = await db
      .selectFrom("users")
      .select(["id"])
      .where("id", "=", userId)
      .executeTakeFirst();
    if (user === undefined) {
      return new NotFoundError("User not found");
    }

    const result = await db
      .insertInto("rooms")
      .values({ room_name: roomName, user_id: userId })
      .execute();

    return Number(result[0].insertId);
  };

export const updateRoomName: (db: Kysely<DB>) => UseCases["updateRoomName"] =
  (db) => async (roomId: number, name: string) => {
    const room = await db
      .selectFrom("rooms")
      .select(["id"])
      .where("id", "=", roomId)
      .executeTakeFirst();
    if (room === undefined) {
      return new NotFoundError("Room not found");
    }

    await db
      .updateTable("rooms")
      .set({ room_name: name })
      .where("id", "=", roomId)
      .execute();

    return null;
  };

export const deleteRoom: (db: Kysely<DB>) => UseCases["deleteRoom"] =
  (db) => async (roomId: number) => {
    await db.deleteFrom("rooms").where("id", "=", roomId).execute();
  };

export const paginateRoomMessages: (
  db: Kysely<DB>,
) => UseCases["paginateRoomMessages"] =
  (db) => async (roomId: number, page: number) => {
    const room = await db
      .selectFrom("rooms")
      .select(["id"])
      .where("id", "=", roomId)
      .executeTakeFirst();
    if (room === undefined) {
      return new NotFoundError("Room not found");
    }

    const baseQuery = db
      .selectFrom("messages")
      .innerJoin("users", "users.id", "messages.user_id")
      .where("room_id", "=", roomId);

    const [total, messages] = await Promise.all([
      baseQuery
        .select([db.fn.count("messages.id").as("count")])
        .executeTakeFirst(),
      baseQuery
        .select(["messages.id", "message", "room_id", "user_id", "users.name"])
        .limit(10)
        .offset((page - 1) * 10)
        .execute(),
    ]);

    return {
      total: Number(total?.count),
      currentPage: page,
      perPage: 10,
      lastPage: total?.count === 0 ? 1 : Math.ceil(Number(total?.count) / 10),
      items: messages.map((message) => ({
        message: message.message,
        user: { id: message.user_id, name: message.name },
      })),
    };
  };

export const cursorRoomMessages: (
  db: Kysely<DB>,
) => UseCases["cursorRoomMessages"] =
  (db) => async (roomId: number, cursor?: number) => {
    const perPage = 10;

    const room = await db
      .selectFrom("rooms")
      .select(["id"])
      .where("id", "=", roomId)
      .executeTakeFirst();
    if (room === undefined) {
      return new NotFoundError("Room not found");
    }

    const messages = await db
      .selectFrom("messages")
      .innerJoin("users", "users.id", "messages.user_id")
      .where("room_id", "=", roomId)
      .where("messages.id", ">", cursor ?? 0)
      .limit(perPage)
      .select(["messages.id", "message", "room_id", "user_id", "users.name"])
      .execute();

    return {
      next: messages.length < perPage ? null : messages[messages.length - 1].id,
      items: messages.map((message) => ({
        message: message.message,
        user: { id: message.user_id, name: message.name },
      })),
    };
  };

export const sendMessage: (db: Kysely<DB>) => UseCases["sendMessage"] =
  (db) => async (roomId: number, userId: number, message: string) => {
    const room = await db
      .selectFrom("rooms")
      .select(["id"])
      .where("id", "=", roomId)
      .executeTakeFirst();
    if (room === undefined) {
      return new NotFoundError("Room not found");
    }

    const user = await db
      .selectFrom("users")
      .select(["id"])
      .where("id", "=", userId)
      .executeTakeFirst();
    if (user === undefined) {
      return new NotFoundError("User not found");
    }

    const result = await db
      .insertInto("messages")
      .values({ room_id: roomId, user_id: userId, message })
      .execute();

    return Number(result[0].insertId);
  };
