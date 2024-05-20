import assert from "node:assert";
import { after, before, beforeEach, describe, it } from "node:test";
import { NotFoundError, UseCases } from "./usecases";
import { createKysely } from "./db/kysely/database";
import { Kysely, sql } from "kysely";
import { Seeder } from "./seeder";
import { DB } from "./db/kysely/schema";

type Context = {
  conn: Kysely<DB>;
  seeder: Seeder;
};

export function test_use_cases(
  name: string,
  factory: () => {
    useCases: UseCases;
    tearDown: () => Promise<void>;
  },
) {
  describe(name, () => {
    const conn = createKysely();
    const context: Context = {
      conn,
      seeder: new Seeder(conn),
    };
    const { useCases, tearDown } = factory();

    beforeEach(async () => {
      await sql`DELETE FROM messages;`.execute(context.conn);
      await sql`DELETE FROM rooms;`.execute(context.conn);
      await sql`DELETE FROM users;`.execute(context.conn);
    });

    after(async () => {
      await context.conn.destroy();
      await tearDown();
    });

    test_register_user(context, useCases.registerUser);

    test_create_room(context, useCases.createRoom);

    test_update_room_name(context, useCases.updateRoomName);

    test_delete_room(context, useCases.deleteRoom);

    test_paginate_room_messages(context, useCases.paginateRoomMessages);

    test_cursor_room_messages(context, useCases.cursorRoomMessages);

    test_send_message(context, useCases.sendMessage);
  });
}

const test_register_user = (
  context: Context,
  usecase: UseCases["registerUser"],
) => {
  describe("Register User", () => {
    it("insert record", async () => {
      const id = await usecase("testing user");

      const [user] = await context.conn
        .selectFrom("users")
        .selectAll()
        .where("id", "=", id)
        .execute();
      assert.deepStrictEqual(user, { id, name: "testing user" });
    });
  });
};

const test_create_room = (
  context: Context,
  usecase: UseCases["createRoom"],
) => {
  describe("Create Room", () => {
    it("insert record", async () => {
      const userId = await context.seeder.user({});

      const roomId = await usecase("testing room", userId);

      const [room] = await context.conn
        .selectFrom("rooms")
        .selectAll()
        .execute();
      assert.deepStrictEqual(room, {
        id: roomId,
        room_name: "testing room",
        user_id: userId,
      });
    });

    it("return error when user cannot found", async () => {
      const result = await usecase("testing room", 999);
      assert(result instanceof NotFoundError);
    });
  });
};

const test_update_room_name = (
  context: Context,
  usecase: UseCases["updateRoomName"],
) => {
  describe("Update Room Name", () => {
    it("update record", async () => {
      const userId = await context.seeder.user({});
      const roomId = await context.seeder.room({
        user_id: userId,
        room_name: "old room",
      });

      await usecase(roomId, "updated room");

      const [room] = await context.conn
        .selectFrom("rooms")
        .selectAll()
        .where("id", "=", roomId)
        .execute();
      assert.deepStrictEqual(room, {
        id: roomId,
        room_name: "updated room",
        user_id: userId,
      });
    });

    it("return error when room cannot found", async () => {
      const result = await usecase(999, "updated room");
      assert(result instanceof NotFoundError);
    });
  });
};

const test_delete_room = (
  context: Context,
  usecase: UseCases["deleteRoom"],
) => {
  describe("Delete Room", () => {
    it("delete record", async () => {
      const userId = await context.seeder.user({});
      const roomId = await context.seeder.room({ user_id: userId });

      await usecase(roomId);

      const rooms = await context.conn
        .selectFrom("rooms")
        .selectAll()
        .execute();
      assert.deepStrictEqual(rooms, []);
    });

    it("no error when room cannot found", async () => {
      assert((await usecase(999)) === undefined);
    });
  });
};

const test_paginate_room_messages = (
  context: Context,
  usecase: UseCases["paginateRoomMessages"],
) => {
  describe("Paginate Room Messages", () => {
    it("find records", async () => {
      const userId = await context.seeder.user({ name: "testing user" });
      const roomId = await context.seeder.room({ user_id: userId });
      for (let i = 0; i < 11; i++) {
        await context.seeder.message({
          room_id: roomId,
          user_id: userId,
          message: `message ${i + 1}`,
        });
      }

      const page = await usecase(roomId, 1);
      assert(!(page instanceof Error));
      assert.strictEqual(page.currentPage, 1);
      assert.strictEqual(page.lastPage, 2);
      assert.strictEqual(page.total, 11);
      assert.strictEqual(page.perPage, 10);
      assert.strictEqual(page.items.length, 10);

      assert.deepStrictEqual(page.items[0], {
        message: "message 1",
        user: { id: userId, name: "testing user" },
      });
      assert.strictEqual(page.items[9].message, "message 10");

      const page2 = await usecase(roomId, 2);
      assert(!(page2 instanceof Error));
      assert.strictEqual(page2.currentPage, 2);
      assert.strictEqual(page2.lastPage, 2);
      assert.strictEqual(page2.total, 11);
      assert.strictEqual(page2.perPage, 10);
      assert.strictEqual(page2.items.length, 1);

      assert.strictEqual(page2.items[0].message, "message 11");
    });

    it("find records when empty", async () => {
      const userId = await context.seeder.user({});
      const roomId = await context.seeder.room({ user_id: userId });

      const page = await usecase(roomId, 1);
      assert(!(page instanceof Error));
      assert.deepStrictEqual(page, {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10,
        items: [],
      });
    });

    it("return error when room cannot found", async () => {
      const result = await usecase(999, 1);
      assert(result instanceof NotFoundError);
    });
  });
};

const test_cursor_room_messages = (
  context: Context,
  usecase: UseCases["cursorRoomMessages"],
) => {
  describe("Cursor Room Messages", () => {
    it("find records", async () => {
      const userId = await context.seeder.user({ name: "testing user" });
      const roomId = await context.seeder.room({ user_id: userId });
      for (let i = 0; i < 11; i++) {
        await context.seeder.message({
          room_id: roomId,
          user_id: userId,
          message: `message ${i + 1}`,
        });
      }

      const page = await usecase(roomId);
      assert(!(page instanceof Error));
      assert(typeof page.next === "number");
      assert.strictEqual(page.items.length, 10);
      assert.deepStrictEqual(page.items[0], {
        message: "message 1",
        user: { id: userId, name: "testing user" },
      });
      assert.strictEqual(page.items[9].message, "message 10");

      const page2 = await usecase(roomId, page.next);
      assert(!(page2 instanceof Error));
      assert.strictEqual(page2.next, null);
      assert.strictEqual(page2.items.length, 1);

      assert.strictEqual(page2.items[0].message, "message 11");
    });

    it("find records when empty", async () => {
      const userId = await context.seeder.user({});
      const roomId = await context.seeder.room({ user_id: userId });

      const page = await usecase(roomId);
      assert(!(page instanceof Error));
      assert.deepStrictEqual(page, {
        next: null,
        items: [],
      });
    });

    it("return error when room cannot found", async () => {
      const result = await usecase(999);
      assert(result instanceof NotFoundError);
    });
  });
};

const test_send_message = (
  context: Context,
  usecase: UseCases["sendMessage"],
) => {
  describe("Send Message", () => {
    it("insert record", async () => {
      const userId = await context.seeder.user({});
      const roomId = await context.seeder.room({ user_id: userId });

      const messageId = await usecase(roomId, userId, "test message");
      assert(!(messageId instanceof Error));

      const [message] = await context.conn
        .selectFrom("messages")
        .selectAll()
        .where("id", "=", messageId)
        .execute();
      assert.deepStrictEqual(message, {
        id: messageId,
        message: "test message",
        room_id: roomId,
        user_id: userId,
      });
    });

    it("return error when room cannot found", async () => {
      const userId = await context.seeder.user({});
      const result = await usecase(999, userId, "test message");
      assert(result instanceof NotFoundError);
    });

    it("return error when user cannot found", async () => {
      const userId = await context.seeder.user({});
      const roomId = await context.seeder.room({ user_id: userId });
      const result = await usecase(roomId, 999, "test message");
      assert(result instanceof NotFoundError);
    });
  });
};
