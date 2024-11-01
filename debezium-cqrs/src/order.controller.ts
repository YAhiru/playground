import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { v7 } from 'uuid';
import { db } from './database';
import { IsInt, Max, Min } from 'class-validator';
import { OrderCreatedEvent, OrderEvent, OrderUpdatedEvent } from './order.event';
import { Type } from 'class-transformer';

class UpdateOrderRequest {
  @Type(() => Number)
  @Min(0)
  @Max(100000)
  @IsInt()
  price: number;
}

@Controller()
export class OrderController {
  constructor() {}

  @Get('/orders/:id')
  async get(@Param() params: { id: string }) {
    const order = await db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', params.id)
      .executeTakeFirst();
    if (!order) {
      throw new NotFoundException();
    }

    return order;
  }

  @Post('/orders/')
  @HttpCode(201)
  async random() {
    const price = Math.floor(Math.random() * 10000);
    const id = v7();
    const orderedAt = new Date();

    const event: OrderCreatedEvent = {
      order_id: id,
      price,
      ordered_at: orderedAt.toISOString(),
    };

    await db
      .insertInto('order_events')
      .values({
        order_id: id,
        type: OrderEvent.created,
        payload: JSON.stringify(event),
      })
      .execute();

    return {
      id,
      price,
      ordered_at: orderedAt,
    };
  }

  @Post('/orders/:id/update')
  async update(
    @Param() params: { id: string },
    @Body() body: UpdateOrderRequest,
  ) {
    const events = await db
      .selectFrom('order_events')
      .selectAll()
      .where('order_id', '=', params.id)
      .orderBy('created_at', 'asc')
      .execute();
    if (events.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = events.reduce<{
      id: string;
      price: number;
      ordered_at: Date;
    }>(
      (acc, event) => {
        const payload = event.payload;
        if (event.type === OrderEvent.created) {
          return {
            id: payload.order_id,
            price: payload.price,
            ordered_at: new Date(),
          };
        }
        if (event.type === OrderEvent.updated) {
          return {
            ...acc,
            price: payload.price,
          };
        }
        return order;
      },
      {
        id: params.id,
        price: 0,
        ordered_at: new Date(),
      },
    );

    const event: OrderUpdatedEvent = {
      order_id: order.id,
      price: body.price,
    };

    await db.insertInto('order_events').values({
      order_id: order.id,
      type: OrderEvent.updated,
      payload: JSON.stringify(event),
    }).execute();
  }
}
