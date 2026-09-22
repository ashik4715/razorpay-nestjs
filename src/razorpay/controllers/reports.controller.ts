import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPaymentsReportQueryDto } from '../dto/payment-link.dto';
import { RazorpayService } from '../razorpay.service';

@ApiTags('reports')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Get('transactions')
  @ApiOperation({
    summary: 'Transaction report (payments)',
    description: [
      'Aggregates **real payments** from Razorpay Test Mode into a client-friendly report.',
      '',
      '- Empty until a Test Mode payment completes (Payment Link or Checkout).',
      '- Includes summary totals by status and a flat transaction list.',
      '',
      'Dashboard equivalent: **Payments → Transactions** (Test Mode).',
    ].join('\n'),
  })
  @ApiOkResponse({
    description: 'Transaction report',
    schema: {
      example: {
        generated_at: '2026-09-22T14:00:00.000Z',
        mode: 'test',
        summary: {
          total_transactions: 1,
          total_amount_minor: 9900,
          currency: 'INR',
          by_status: { captured: 1, failed: 0, authorized: 0, refunded: 0 },
        },
        transactions: [
          {
            payment_id: 'pay_QHI3aBcDeFgHiJ',
            order_id: 'order_QHI2xgVvRyJmQb',
            amount: 9900,
            amount_display: '₹99.00',
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            email: 'customer@example.com',
            created_at: 1790085281,
          },
        ],
      },
    },
  })
  async getTransactions(@Query() query: ListPaymentsReportQueryDto) {
    return this.razorpayService.getTransactionReport(query);
  }
}
