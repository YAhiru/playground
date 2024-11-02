export type EventStore = {
  /**
   * @param sequenceNumber 渡されたシーケンスNoを含む、シーケンスNo以降のイベントを取得する
   */
  retrieveFrom(aggregateId: string, sequenceNumber: number): Promise<Event[]>;

  persist(event: Event): Promise<void>;
};

export type Event = {
  name: string;
  aggregateId: string;
  payload: Record<string, any>;
  sequenceNumber: number;
};
