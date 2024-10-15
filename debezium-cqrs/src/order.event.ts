export const OrderCreatedEventName = 'order_created';
export type OrderCreatedEvent = {
  order_id: string;
  price: number;
  ordered_at: string;
};

export const OrderUpdatedEventName = 'order_updated';
export type OrderUpdatedEvent = {
  order_id: string;
  price: number;
};

export type DebeziumEvent = {
  id: number;
  order_id: string;
  type: string;
  payload: any;
};
