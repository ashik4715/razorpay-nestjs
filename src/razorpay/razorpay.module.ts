import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { OrdersController } from './controllers/orders.controller';
import { PaymentsController } from './controllers/payments.controller';
import { RefundsController } from './controllers/refunds.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { RazorpayService } from './razorpay.service';

@Module({
  controllers: [
    HealthController,
    OrdersController,
    PaymentsController,
    RefundsController,
    InvoicesController,
    WebhooksController,
  ],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}
