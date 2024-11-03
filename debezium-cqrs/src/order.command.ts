import { Event, Snapshot } from './event-store';

export type Order = {
  id: string;
  price: number;
  ordered_at: Date;
};

export function toSnapshot(order: Order): Record<string, any> {
  return {
    id: order.id,
    price: order.price,
    ordered_at: order.ordered_at.toISOString(),
  };
}
export function fromSnapshot(snapshot: Snapshot): Order {
  return {
    id: snapshot.value.id,
    price: snapshot.value.price,
    ordered_at: new Date(snapshot.value.ordered_at),
  };
}

export function applyEvents(order: Order, events: Event[]): Order {
  return events.reduce<Order>((acc, event) => {
    const payload = event.payload;
    if (event.name === OrderEvent.created) {
      return {
        id: payload.order_id,
        price: payload.price,
        ordered_at: new Date(),
      };
    }
    if (event.name === OrderEvent.updated) {
      return {
        ...acc,
        price: payload.price,
      };
    }
    return order;
  }, order);
}

export const OrderEvent = {
  created: 'order_created',
  updated: 'order_updated',
} as const;

export type OrderCreatedEvent = {
  order_id: string;
  price: number;
  ordered_at: string;
};

export type OrderUpdatedEvent = {
  order_id: string;
  price: number;
};
