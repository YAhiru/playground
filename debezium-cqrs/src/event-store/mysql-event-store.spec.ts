import { db } from '../database';
import { MySqlEventStore } from './mysql-event-store';

describe('MySqlEventStore', () => {
  let eventStore: MySqlEventStore;
  beforeEach(() => {
    eventStore = new MySqlEventStore();
  });

  afterEach(async () => {
    await db.deleteFrom('events').execute();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('persistした後にイベントを取得できること', async () => {
    await eventStore.persist({
      aggregateId: '1',
      payload: {},
      sequenceNumber: 1,
      name: 'test',
    });

    const events = await eventStore.retrieveFrom('1', 1);
    expect(events).toEqual([
      {
        aggregateId: '1',
        payload: {},
        sequenceNumber: 1,
        name: 'test',
      },
    ]);
  });

  it('指定していない集約IDのイベントは取得されないこと', async () => {
    await eventStore.persist({
      aggregateId: '1',
      payload: {},
      sequenceNumber: 1,
      name: 'test',
    });

    const events = await eventStore.retrieveFrom('2', 1);
    expect(events).toEqual([]);
  });

  it('渡したシーケンスNo以降のイベントを取得すること', async () => {
    await eventStore.persist({
      aggregateId: '1',
      payload: {},
      sequenceNumber: 1,
      name: 'test',
    });

    await eventStore.persist({
      aggregateId: '1',
      payload: {},
      sequenceNumber: 2,
      name: 'test',
    });

    const events = await eventStore.retrieveFrom('1', 1);
    expect(events).toEqual([
      {
        aggregateId: '1',
        payload: {},
        sequenceNumber: 1,
        name: 'test',
      },
      {
        aggregateId: '1',
        payload: {},
        sequenceNumber: 2,
        name: 'test',
      },
    ]);

    const events2 = await eventStore.retrieveFrom('1', 2);
    expect(events2).toEqual([
      {
        aggregateId: '1',
        payload: {},
        sequenceNumber: 2,
        name: 'test',
      },
    ]);
  });
});
