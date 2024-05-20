import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Messages {
  id: Generated<number>;
  message: string;
  /**
   * ç™ºè¨€ãŒã‚ã£ãŸãƒ«ãƒ¼ãƒ
   */
  room_id: number;
  /**
   * ç™ºè¨€ã—ãŸäºº
   */
  user_id: number;
}

export interface Rooms {
  id: Generated<number>;
  room_name: string;
  /**
   * ãƒ«ãƒ¼ãƒ ã®ä½œæˆè€…
   */
  user_id: number;
}

export interface Users {
  id: Generated<number>;
  name: string;
}

export interface DB {
  messages: Messages;
  rooms: Rooms;
  users: Users;
}
