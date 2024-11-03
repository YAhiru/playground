import { db, EventTable } from '../database';
import { ConsumerSubscribeTopics, Kafka, EachMessagePayload } from 'kafkajs';
import { OrderCreatedEvent, OrderEvent } from '../order.command';
import { Selectable } from 'kysely';

async function handleOrderCreatedEvent(event: OrderCreatedEvent) {
  await db
    .insertInto('orders')
    .values({
      id: event.order_id,
      price: event.price,
      ordered_at: new Date(Date.parse(event.ordered_at)),
    })
    .execute();
}

async function handleOrderUpdatedEvent(event: OrderCreatedEvent) {
  await db
    .updateTable('orders')
    .set({
      price: event.price,
    })
    .where('id', '=', event.order_id)
    .execute();
}

async function consumeEvent(event: Selectable<EventTable>) {
  const consumedEvent = await db
    .selectFrom('consumed_events as ce')
    .select(['ce.id'])
    .where('ce.id', '=', event.id)
    .limit(1)
    .executeTakeFirst();
  // そのイベントが処理済みの場合はスキップする
  if (consumedEvent !== undefined) {
    return;
  }

  switch (event.event_name) {
    case OrderEvent.created:
      await handleOrderCreatedEvent(JSON.parse(event.payload));
      break;
    case OrderEvent.updated:
      await handleOrderUpdatedEvent(JSON.parse(event.payload));
      break;
    default:
      console.log(`Unknown event type: ${event.event_name}`);
      break;
  }

  await db
    .insertInto('consumed_events')
    .values({
      id: event.id,
    })
    .execute();
}

(async () => {
  const kafka = new Kafka({
    clientId: 'client-id',
    brokers: ['kafka:9092'],
  });
  const consumer = kafka.consumer({ groupId: 'order' });

  const topic: ConsumerSubscribeTopics = {
    topics: ['debezium.debezium.events'],
    fromBeginning: true,
  };
  await consumer.connect();
  await consumer.subscribe(topic);

  const errorTypes = ['unhandledRejection', 'uncaughtException'];
  const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  errorTypes.forEach((type) => {
    process.on(type, async (e) => {
      try {
        console.log(`process.on ${type}`);
        console.error(e);
        await consumer.disconnect();
        process.exit(0);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async () => {
      try {
        await consumer.disconnect();
      } finally {
        process.kill(process.pid, type);
      }
    });
  });

  try {
    await consumer.run({
      eachMessage: async (messagePayload: EachMessagePayload) => {
        const { topic, partition, message } = messagePayload;
        const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
        console.log(`- ${prefix} ${message.key}#${message.value}`);

        // https://debezium.io/documentation/reference/stable/connectors/mysql.html#mysql-events
        const debeziumEvent = JSON.parse(message.value?.toString() ?? 'null');
        if (debeziumEvent === null) {
          return;
        }
        console.log(debeziumEvent);

        await consumeEvent(debeziumEvent.payload.after);
      },
    });
  } catch (error) {
    console.log('Error: ', error);
  }
})();
