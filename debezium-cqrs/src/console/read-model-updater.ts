import { db } from '../database';
import { ConsumerSubscribeTopics, Kafka, EachMessagePayload } from 'kafkajs';
import { DebeziumEvent, OrderCreatedEvent, OrderEvent } from '../order.event';

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

async function consumeEvent(event: DebeziumEvent) {
  // そのイベントが処理済みでない場合、かつそのイベント以前のイベントが処理済みの場合にのみ処理を行う
  const unconsumedEvent = await db
    .selectFrom('order_events as oe')
    .leftJoin('consumed_order_events as coe', 'oe.id', 'coe.id')
    .select(['oe.id'])
    .where('oe.order_id', '=', event.order_id) // 対象の注文に関連するイベント絞り込む
    .where('oe.id', '>=', event.id) // 今回のイベントとそれ以前のイベントに絞り込む
    .where('coe.id', 'is', null) // 処理済みのイベントを除外する
    .limit(2)
    .execute();
  if (unconsumedEvent.length !== 1) {
    // 処理済みではないイベントが1件もない場合は既に処理済みのイベントということなのでスキップ
    // 処理済みではないイベントが複数ある場合は、今回のイベントよりも前のイベントが未処理であることになるのでスキップ
    return;
  }
  if (unconsumedEvent[0].id !== event.id) {
    // 処理済みではないイベントが1件あるが、そのイベントが今回のイベントではない場合はスキップ
    return;
  }

  switch (event.type) {
    case OrderEvent.created:
      await handleOrderCreatedEvent(JSON.parse(event.payload));
      break;
    case OrderEvent.updated:
      await handleOrderUpdatedEvent(JSON.parse(event.payload));
      break;
    default:
      console.log(`Unknown event type: ${event.type}`);
      break;
  }

  await db
    .insertInto('consumed_order_events')
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
    topics: ['debezium.debezium.order_events'],
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
