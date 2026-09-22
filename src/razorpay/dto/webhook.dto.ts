import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class RazorpayWebhookEnvelopeDto {
  @ApiProperty({
    example: 'payment.captured',
    description: 'Razorpay event name, e.g. payment.captured, refund.processed, order.paid.',
  })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({
    example: {
      payment: {
        entity: {
          id: 'pay_QHI3aBcDeFgHiJ',
          order_id: 'order_QHI2xgVvRyJmQb',
          amount: 49900,
          status: 'captured',
        },
      },
    },
    description: 'Event payload. Shape depends on the subscribed event.',
  })
  @IsObject()
  payload: Record<string, unknown>;
}
