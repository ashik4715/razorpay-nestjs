import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ORDER_EXAMPLE } from '../common/swagger.examples';
import { CreateOrderDto, ListOrdersQueryDto } from '../dto/order.dto';
import { RazorpayService } from '../razorpay.service';

@ApiTags('orders')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a payment order',
    description:
      'Creates a server-side Razorpay order. Use the returned `id` with your Checkout widget (`key_id` + `order_id`). Amount is accepted in major units (499 = ₹499) and converted to paise.',
  })
  @ApiCreatedResponse({
    description: 'Order created',
    schema: { example: ORDER_EXAMPLE },
  })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.razorpayService.createOrder(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List orders',
    description: 'Fetch recent orders from the Razorpay test dashboard.',
  })
  @ApiOkResponse({
    description: 'Order collection',
    schema: {
      example: { count: 1, items: [ORDER_EXAMPLE] },
    },
  })
  listOrders(@Query() query: ListOrdersQueryDto) {
    return this.razorpayService.listOrders(query);
  }

  @Get(':orderId')
  @ApiOperation({
    summary: 'Fetch an order',
    description:
      'Fetch a single order including `amount_paid`, `attempts` and status transitions.',
  })
  @ApiParam({ name: 'orderId', example: 'order_QHI2xgVvRyJmQb' })
  @ApiOkResponse({
    description: 'Order entity',
    schema: { example: { ...ORDER_EXAMPLE, amount_paid: 49900, attempts: 1, status: 'paid' } },
  })
  getOrder(@Param('orderId') orderId: string) {
    return this.razorpayService.getOrder(orderId);
  }
}
