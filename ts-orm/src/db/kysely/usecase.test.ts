import { test_use_cases } from "../../test";
import { createKysely } from "./database";
import {
  createRoom,
  cursorRoomMessages,
  deleteRoom,
  paginateRoomMessages,
  registerUser,
  sendMessage,
  updateRoomName,
} from "./usecase";

test_use_cases("Kysely", () => {
  const db = createKysely();

  return {
    useCases: {
      registerUser: registerUser(db),
      createRoom: createRoom(db),
      updateRoomName: updateRoomName(db),
      deleteRoom: deleteRoom(db),
      paginateRoomMessages: paginateRoomMessages(db),
      cursorRoomMessages: cursorRoomMessages(db),
      sendMessage: sendMessage(db),
    },
    tearDown: async () => {
      await db.destroy();
    },
  };
});
