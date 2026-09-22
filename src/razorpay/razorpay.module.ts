import { Module } from '@nestjs/common';
import { CheckoutController } from './controllers/checkout.controller';
import { HealthController } from './controllers/health.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { OrdersController } from './controllers/orders.controller';
import { PaymentLinksController } from './controllers/payment-links.controller';
import { PaymentsController } from './controllers/payments.controller';
import { RefundsController } from './controllers/refunds.controller';
import { ReportsController } from './controllers/reports.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { RazorpayService } from './razorpay.service';

@Module({
  controllers: [
    HealthController,
    OrdersController,
    PaymentsController,
    RefundsController,
    InvoicesController,
    PaymentLinksController,
    ReportsController,
    CheckoutController,
    WebhooksController,
  ],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}
