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
import {
  fromSnapshot,
  OrderCreatedEvent,
  OrderEvent,
  OrderUpdatedEvent,
  toSnapshot,
} from './order.command';
import { Type } from 'class-transformer';
import { MySqlEventStore } from './event-store/mysql-event-store';
import { nextSequenceNumber, SnapshotNotFoundError } from './event-store';

class UpdateOrderRequest {
  @Type(() => Number)
  @Min(0)
  @Max(100000)
  @IsInt()
  price: number;
}

@Controller()
export class OrderController {
  private eventStore = new MySqlEventStore();

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
    const order = {
      id: v7(),
      price: Math.floor(Math.random() * 10000),
      ordered_at: new Date(),
    };

    const event: OrderCreatedEvent = {
      order_id: order.id,
      price: order.price,
      ordered_at: order.ordered_at.toISOString(),
    };

    await this.eventStore.persistWithSnapshot(
      {
        name: OrderEvent.created,
        aggregateId: order.id,
        payload: event,
        sequenceNumber: 1,
      },
      toSnapshot(order),
    );

    return order;
  }

  @Post('/orders/:id/update')
  async update(
    @Param() params: { id: string },
    @Body() body: UpdateOrderRequest,
  ) {
    try {
      const { events, snapshot } = await this.eventStore.retrieveWithSnapshot(
        params.id,
      );
      const order = fromSnapshot(snapshot);

      const event: OrderUpdatedEvent = {
        order_id: order.id,
        price: body.price,
      };

      await this.eventStore.persist({
        name: OrderEvent.updated,
        payload: event,
        aggregateId: order.id,
        sequenceNumber: nextSequenceNumber(events, snapshot),
      });
    } catch (e) {
      if (e instanceof SnapshotNotFoundError) {
        throw new NotFoundException('Order does not found');
      } else {
        throw e;
      }
    }
  }
}
