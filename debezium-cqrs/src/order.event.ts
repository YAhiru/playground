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
