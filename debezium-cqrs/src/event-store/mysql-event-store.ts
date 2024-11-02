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
}
