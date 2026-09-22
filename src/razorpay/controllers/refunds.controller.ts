import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { REFUND_EXAMPLE } from '../common/swagger.examples';
import { ListRefundsQueryDto } from '../dto/order.dto';
import { RazorpayService } from '../razorpay.service';

@ApiTags('refunds')
@Controller('api/v1/refunds')
export class RefundsController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Get()
  @ApiOperation({
    summary: 'List refunds',
    description: 'List refunds, optionally scoped to a single `payment_id`.',
  })
  @ApiOkResponse({
    description: 'Refund collection',
    schema: { example: { count: 1, items: [REFUND_EXAMPLE] } },
  })
  listRefunds(@Query() query: ListRefundsQueryDto) {
    return this.razorpayService.listRefunds(query);
  }

  @Get(':refundId')
  @ApiOperation({
    summary: 'Fetch a refund',
    description: 'Fetch refund status (`pending`, `processed`, `failed`).',
  })
  @ApiParam({ name: 'refundId', example: 'rfnd_QHI4kLmNoPqRsT' })
  @ApiOkResponse({ description: 'Refund entity', schema: { example: REFUND_EXAMPLE } })
  getRefund(@Param('refundId') refundId: string) {
    return this.razorpayService.getRefund(refundId);
  }
}
