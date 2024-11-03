export type EventStore = {
  /**
   * @param sequenceNumber 渡されたシーケンスNoを含む、シーケンスNo以降のイベントを取得する
   */
  retrieveFrom(aggregateId: string, sequenceNumber: number): Promise<Event[]>;

  /**
   * @param aggregateId イベントを取得する対象のAggregateのID
   * @return 指定された集約のスナップショットと、スナップショットより後に保存されたイベントを取得する
   * @throws {SnapshotNotFoundError} スナップショットが見つからない場合
   */
  retrieveWithSnapshot(
    aggregateId: string,
  ): Promise<{ events: Event[]; snapshot: Snapshot }>;

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

export type Snapshot = {
  sequenceNumber: number;
  value: Record<string, any>;
};

export function nextSequenceNumber(
  events: { sequenceNumber: number }[],
  snapshot: { sequenceNumber: number },
): number {
  if (events.length === 0) {
    return snapshot.sequenceNumber + 1;
  }

  return Math.max(...events.map((e) => e.sequenceNumber)) + 1;
}
