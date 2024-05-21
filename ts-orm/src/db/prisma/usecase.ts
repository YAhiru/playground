import { PrismaClient } from "@prisma/client";
import { NotFoundError, UseCases } from "../../usecases";

export const registerUser: (db: PrismaClient) => UseCases["registerUser"] =
  (db) => async (name: string) => {
    const user = await db.users.create({ data: { name } });

    return user.id;
  };

export const createRoom: (db: PrismaClient) => UseCases["createRoom"] =
  (db) => async (roomName: string, userId: number) => {
    const user = await db.users.findUnique({ where: { id: userId } });
    if (!user) {
      return new NotFoundError("User not found");
    }

    const room = await db.rooms.create({
      data: {
        room_name: roomName,
        users: {
          connect: { id: userId },
        },
      },
    });

    return room.id;
  };

export const updateRoomName: (db: PrismaClient) => UseCases["updateRoomName"] =
  (db) => async (roomId: number, name: string) => {
    const room = await db.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NotFoundError("Room not found");
    }

    await db.rooms.update({
      where: { id: roomId },
      data: { room_name: name },
    });

    return null;
  };

export const deleteRoom: (db: PrismaClient) => UseCases["deleteRoom"] =
  (db) => async (roomId: number) => {
    const room = await db.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      return;
    }

    await db.rooms.delete({ where: { id: roomId } });
  };

export const paginateRoomMessages: (
  db: PrismaClient,
) => UseCases["paginateRoomMessages"] =
  (db) => async (roomId: number, page: number) => {
    const room = await db.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NotFoundError("Room not found");
    }

    const perPage = 10;
    const messages = await db.messages.findMany({
      where: { room_id: roomId },
      include: { users: true },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    const total = await db.messages.count({ where: { room_id: roomId } });

    return {
      total: total,
      currentPage: page,
      lastPage: total === 0 ? 1 : Math.ceil(total / perPage),
      perPage: perPage,
      items: messages.map((m) => ({
        message: m.message,
        user: m.users,
      })),
    };
  };

export const cursorRoomMessages: (
  db: PrismaClient,
) => UseCases["cursorRoomMessages"] =
  (db) => async (roomId: number, cursor?: number) => {
    const room = await db.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NotFoundError("Room not found");
    }

    const perPage = 10;
    const messages = await db.messages.findMany({
      where: { room_id: roomId, id: cursor ? { gt: cursor } : undefined },
      include: { users: true },
      take: perPage,
    });

    return {
      next: messages.length < perPage ?  null : messages[messages.length - 1].id,
      items: messages.map((m) => ({
      message: m.message,
      user: m.users,
    }))};
  };

export const sendMessage: (db: PrismaClient) => UseCases["sendMessage"] =
  (db) => async (roomId: number, userId: number, message: string) => {
    const room = await db.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NotFoundError("Room not found");
    }

    const user = await db.users.findUnique({ where: { id: userId } });
    if (!user) {
      return new NotFoundError("User not found");
    }

    const m = await db.messages.create({
      data: {
        message,
        room_id: roomId,
        user_id: userId,
      },
    });

    return m.id;
  };
