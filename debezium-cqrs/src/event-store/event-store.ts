export type EventStore = {
  /**
   * @param sequenceNumber 渡されたシーケンスNoを含む、シーケンスNo以降のイベントを取得する
   */
  retrieveFrom(aggregateId: string, sequenceNumber: number): Promise<Event[]>;

  /**
   * @param aggregateId イベントを取得する対象のAggregateのID
   * @return 指定された集約のスナップショットと、スナップショットより後に保存されたイベントを取得する
   */
  retrieveWithSnapshot(
    aggregateId: string,
  ): Promise<{ events: Event[]; snapshot: Record<string, any> }>;

  persist(event: Event): Promise<void>;

  persistWithSnapshot(
    event: Event,
    snapshot: Record<string, any>,
  ): Promise<void>;
};

export type Event = {
  name: string;
  aggregateId: string;
  payload: Record<string, any>;
  sequenceNumber: number;
};
