import { Cursor, Page } from "./paginate";

export type UseCases = {
  /**
   * ユーザーを登録する
   * @param name ユーザー名
   * @returns 登録したユーザーのID
   */
  registerUser: (name: string) => Promise<number>;

  /**
   * ルームを新規作成する
   *
   * @param name ルーム名
   * @param userId ルームの主
   * @returns 作成したルームID。ユーザーが見つからない場合は NotFoundError を返す
   */
  createRoom: (name: string, userId: number) => Promise<number | NotFoundError>;
  /**
   * ルーム名を更新する
   *
   * @param roomId 更新対象のルームID
   * @param name 新しいルーム名
   * @returns ルームが存在しない場合は NotFoundError を返す
   */
  updateRoomName: (
    roomId: number,
    name: string,
  ) => Promise<null | NotFoundError>;

  /**
   * ルームを削除する
   * @param roomId 削除対象のルームID
   * @returns ルームが存在しない場合もエラーを返さずに終了する
   */
  deleteRoom: (roomId: number) => Promise<void>;

  /**
   * ルーム内のメッセージを取得する(Offsetベース版)
   *
   * @param roomId メッセージを取得する対象のルームID
   * @param page ページ番号
   * @returns ルーム内のメッセージ一覧. ルームが存在しない場合は NotFoundError を返す
   */
  paginateRoomMessages: (
    roomId: number,
    page: number,
  ) => Promise<Page<Message> | NotFoundError>;

  /**
   * ルーム内のメッセージを取得する(Cursorベース版)
   *
   * @param roomId メッセージを取得する対象のルームID
   * @param cursor メッセージのカーソル. 初回の取得時は指定しない
   * @returns ルーム内のメッセージ一覧. ルームが存在しない場合は NotFoundError を返す
   */
  cursorRoomMessages: (
    roomId: number,
    cursor?: number,
  ) => Promise<Cursor<Message> | NotFoundError>;

  /**
   * メッセージを投稿する
   *
   * @param roomId 投稿先のルームID
   * @param userId 投稿主
   * @param message メッセージの内容
   * @returns 投稿したメッセージID. ルームやユーザーが存在しない場合は NotFoundError を返す
   */
  sendMessage: (
    roomId: number,
    userId: number,
    message: string,
  ) => Promise<number | NotFoundError>;
};

export type Message = { message: string; user: { id: number; name: string } };

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
