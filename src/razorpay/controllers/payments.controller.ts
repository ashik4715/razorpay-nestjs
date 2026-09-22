import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ERROR_EXAMPLE, PAYMENT_EXAMPLE, VERIFICATION_EXAMPLE } from '../common/swagger.examples';
import {
  ListPaymentsQueryDto,
} from '../dto/order.dto';
import {
  CapturePaymentDto,
  CreateRefundDto,
  VerifyPaymentDto,
} from '../dto/payment.dto';
import { RazorpayService } from '../razorpay.service';

@ApiTags('payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('verify')
  @ApiOperation({
    summary: 'Verify checkout payment signature',
    description:
      'HMAC-SHA256(`order_id|payment_id`) verified against your key secret with a timing-safe comparison. On success, mark the order as paid in your database.',
  })
  @ApiOkResponse({
    description: 'Signature is valid',
    schema: { example: VERIFICATION_EXAMPLE },
  })
  @ApiResponse({
    status: 400,
    description: 'Signature invalid',
    schema: { example: ERROR_EXAMPLE },
  })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    this.razorpayService.verifyPayment(dto);
    return {
      ...VERIFICATION_EXAMPLE,
      order_id: dto.razorpay_order_id,
      payment_id: dto.razorpay_payment_id,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List payments',
    description: 'Optionally filter by `order_id`, time range, count and skip.',
  })
  @ApiOkResponse({
    description: 'Payment collection',
    schema: { example: { count: 1, items: [PAYMENT_EXAMPLE] } },
  })
  listPayments(@Query() query: ListPaymentsQueryDto) {
    return this.razorpayService.listPayments(query);
  }

  @Get(':paymentId')
  @ApiOperation({
    summary: 'Fetch a payment',
    description: 'Returns method, status, amount, card/UPI metadata and refund state.',
  })
  @ApiParam({ name: 'paymentId', example: 'pay_QHI3aBcDeFgHiJ' })
  @ApiOkResponse({ description: 'Payment entity', schema: { example: PAYMENT_EXAMPLE } })
  getPayment(@Param('paymentId') paymentId: string) {
    return this.razorpayService.getPayment(paymentId);
  }

  @Post(':paymentId/capture')
  @ApiOperation({
    summary: 'Capture an authorized payment',
    description:
      'Required only when the order was created with `payment_capture: false` (manual capture). Omit `amount` to capture the full authorized balance.',
  })
  @ApiParam({ name: 'paymentId', example: 'pay_QHI3aBcDeFgHiJ' })
  @ApiOkResponse({ description: 'Captured payment', schema: { example: PAYMENT_EXAMPLE } })
  capturePayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: CapturePaymentDto,
  ) {
    return this.razorpayService.capturePayment(paymentId, dto);
  }

  @Post(':paymentId/refunds')
  @ApiOperation({
    summary: 'Refund a payment',
    description:
      'Full or partial refund. Omit `amount` to refund the remaining balance. Speed `instant` settles immediately where supported.',
  })
  @ApiParam({ name: 'paymentId', example: 'pay_QHI3aBcDeFgHiJ' })
  @ApiCreatedResponse({
    description: 'Refund created',
    schema: {
      example: {
        id: 'rfnd_QHI4kLmNoPqRsT',
        entity: 'refund',
        amount: 10000,
        currency: 'INR',
        payment_id: 'pay_QHI3aBcDeFgHiJ',
        status: 'processed',
        speed: 'optimum',
        created_at: 1727010300,
      },
    },
  })
  createRefund(
    @Param('paymentId') paymentId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.razorpayService.createRefund(paymentId, dto);
  }
}
