import { db } from '../database';
import { Event, EventStore } from './event-store';

export class MySqlEventStore implements EventStore {
  async retrieveFrom(
    aggregateId: string,
    sequenceNumber: number,
  ): Promise<Event[]> {
    const records = await db
      .selectFrom('events')
      .select(['aggregate_id', 'payload', 'sequence_number', 'event_name'])
      .where('aggregate_id', '=', aggregateId)
      .where('sequence_number', '>=', sequenceNumber)
      .execute();

    return records.map((r) => ({
      aggregateId: r.aggregate_id,
      name: r.event_name,
      payload: r.payload,
      sequenceNumber: r.sequence_number,
    }));
  }

  async retrieveWithSnapshot(
    aggregateId: string,
  ): Promise<{ events: Event[]; snapshot: Record<string, any> }> {
    let snapshot: Record<string, any>;
    let events: Event[];

    await db.transaction().execute(async (trx) => {
      const snapshotRecord = await trx
        .selectFrom('snapshots')
        .select(['aggregate_id', 'payload', 'sequence_number'])
        .where('aggregate_id', '=', aggregateId)
        .orderBy('sequence_number', 'desc')
        .limit(1)
        .executeTakeFirst();

      if (snapshotRecord === undefined) {
        throw new Error(
          'Snapshot not found. retrieveWithSnapshot() must be called after the snapshot has been persisted.',
        );
      }

      snapshot = snapshotRecord.payload;

      const eventRecords = await db
        .selectFrom('events')
        .select(['aggregate_id', 'payload', 'sequence_number', 'event_name'])
        .where('aggregate_id', '=', aggregateId)
        .where('sequence_number', '>', snapshotRecord.sequence_number)
        .orderBy('sequence_number', 'asc')
        .execute();

      events = eventRecords.map((r) => ({
        aggregateId: r.aggregate_id,
        name: r.event_name,
        payload: r.payload,
        sequenceNumber: r.sequence_number,
      }));
    });

    return { events, snapshot };
  }

  async persist(event: Event): Promise<void> {
    await db
      .insertInto('events')
      .values({
        aggregate_id: event.aggregateId,
        event_name: event.name,
        payload: JSON.stringify(event.payload),
        sequence_number: event.sequenceNumber,
      })
      .execute();
  }

  async persistWithSnapshot(
    event: Event,
    snapshot: Record<string, any>,
  ): Promise<void> {
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('events')
        .values({
          aggregate_id: event.aggregateId,
          event_name: event.name,
          payload: JSON.stringify(event.payload),
          sequence_number: event.sequenceNumber,
        })
        .execute();

      await trx
        .insertInto('snapshots')
        .values({
          aggregate_id: event.aggregateId,
          payload: JSON.stringify(snapshot),
          sequence_number: event.sequenceNumber,
        })
        .execute();
    });
  }
}
