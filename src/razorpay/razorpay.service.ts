import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { toMinorUnits } from './common/amount';
import {
  mapRazorpayError,
  maskKeyId,
  timingSafeHexEqual,
} from './common/razorpay.utils';
import { CreateInvoiceDto } from './dto/invoice.dto';
import {
  CapturePaymentDto,
  CreateRefundDto,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { CreateOrderDto } from './dto/order.dto';

export interface HealthStatus {
  status: 'ok';
  service: string;
  mode: 'test' | 'live' | 'unconfigured';
  keyId: string;
  timestamp: string;
}

export interface WebhookResult {
  received: boolean;
  event: string;
  handled: boolean;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly razorpay: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    this.keyId = config.get<string>('RAZOR_TEST_API_KEY') ?? '';
    this.keySecret = config.get<string>('RAZOR_TEST_API_SECRET') ?? '';
    this.webhookSecret =
      config.get<string>('RAZORPAY_WEBHOOK_SECRET') ?? 'local_demo_webhook_secret';

    if (!this.keyId || !this.keySecret) {
      this.logger.warn(
        'Razorpay keys missing — set RAZOR_TEST_API_KEY and RAZOR_TEST_API_SECRET in .env',
      );
    }

    this.razorpay = new Razorpay({
      key_id: this.keyId || 'rzp_test_placeholder',
      key_secret: this.keySecret || 'placeholder_secret',
    });

    this.logger.log(
      `Razorpay client initialized (mode=${this.keyId.startsWith('rzp_live') ? 'live' : 'test'}, key=${maskKeyId(this.keyId)})`,
    );
  }

  getHealth(): HealthStatus {
    const mode: HealthStatus['mode'] = !this.keyId
      ? 'unconfigured'
      : this.keyId.startsWith('rzp_live')
        ? 'live'
        : 'test';
    return {
      status: 'ok',
      service: 'razorpay-nestjs-sandbox-demo',
      mode,
      keyId: maskKeyId(this.keyId),
      timestamp: new Date().toISOString(),
    };
  }

  async createOrder(dto: CreateOrderDto) {
    const currency = dto.currency ?? 'INR';
    try {
      return await this.razorpay.orders.create({
        amount: toMinorUnits(dto.amount, currency),
        currency,
        receipt: dto.receipt ?? `rcpt_${Date.now()}`,
        payment_capture: dto.payment_capture ?? true,
        notes: dto.notes,
      });
    } catch (error) {
      throw mapRazorpayError(error, 'Failed to create Razorpay order');
    }
  }

  async listOrders(query: {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
  }) {
    try {
      return await this.razorpay.orders.all({
        from: query.from,
        to: query.to,
        count: query.count ?? 10,
        skip: query.skip ?? 0,
      });
    } catch (error) {
      throw mapRazorpayError(error, 'Failed to list Razorpay orders');
    }
  }

  async getOrder(orderId: string) {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      throw mapRazorpayError(error, `Failed to fetch order ${orderId}`);
    }
  }

  async getPayment(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      throw mapRazorpayError(error, `Failed to fetch payment ${paymentId}`);
    }
  }

  async listPayments(query: {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
    order_id?: string;
  }) {
    try {
      const options: Record<string, unknown> = {
        from: query.from,
        to: query.to,
        count: query.count ?? 10,
        skip: query.skip ?? 0,
      };
      if (query.order_id) options.order_id = query.order_id;
      return await this.razorpay.payments.all(options as never);
    } catch (error) {
      throw mapRazorpayError(error, 'Failed to list Razorpay payments');
    }
  }

  verifyPayment(dto: VerifyPaymentDto): void {
    if (!this.keySecret) {
      throw new InternalServerErrorException({
        message: 'RAZOR_TEST_API_SECRET is not configured.',
        code: 'missing_key_secret',
        provider: 'razorpay',
      });
    }

    const orderId = dto.razorpay_order_id.trim();
    const paymentId = dto.razorpay_payment_id.trim();
    const signature = dto.razorpay_signature.trim().toLowerCase();

    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (!timingSafeHexEqual(expected, signature)) {
      throw new BadRequestException({
        message: 'Invalid payment signature verification failed.',
        code: 'invalid_signature',
        provider: 'razorpay',
      });
    }
  }

  async capturePayment(paymentId: string, dto: CapturePaymentDto) {
    try {
      const payment = (await this.razorpay.payments.fetch(paymentId)) as {
        amount: number;
        currency: string;
        status: string;
      };

      if (payment.status !== 'authorized') {
        throw new BadRequestException({
          message: `Payment must be in "authorized" state to capture (current: ${payment.status}).`,
          code: 'payment_not_capturable',
          provider: 'razorpay',
        });
      }

      const currency = dto.currency ?? payment.currency;
      const amountMinor = dto.amount
        ? toMinorUnits(dto.amount, currency)
        : payment.amount;

      return await this.razorpay.payments.capture(paymentId, amountMinor, currency);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw mapRazorpayError(error, `Failed to capture payment ${paymentId}`);
    }
  }

  async createRefund(paymentId: string, dto: CreateRefundDto) {
    try {
      const options: Record<string, unknown> = {
        speed: dto.speed ?? 'optimum',
        notes: dto.notes,
      };
      if (dto.amount) {
        const payment = (await this.razorpay.payments.fetch(paymentId)) as {
          currency: string;
        };
        options.amount = toMinorUnits(dto.amount, payment.currency);
      }
      return await this.razorpay.payments.refund(paymentId, options as never);
    } catch (error) {
      throw mapRazorpayError(error, `Failed to refund payment ${paymentId}`);
    }
  }

  async listRefunds(query: {
    payment_id?: string;
    count?: number;
    skip?: number;
  }) {
    try {
      const options: Record<string, unknown> = {
        count: query.count ?? 10,
        skip: query.skip ?? 0,
      };
      if (query.payment_id) options.payment_id = query.payment_id;
      return await this.razorpay.refunds.all(options as never);
    } catch (error) {
      const status = Number((error as { statusCode?: number })?.statusCode);
      if (query.payment_id && (status === 400 || status === 404)) {
        throw new NotFoundException({
          message: `No refunds found for payment ${query.payment_id}`,
          code: 'NOT_FOUND',
          provider: 'razorpay',
        });
      }
      throw mapRazorpayError(error, 'Failed to list refunds');
    }
  }

  async getRefund(refundId: string) {
    try {
      return await this.razorpay.refunds.fetch(refundId);
    } catch (error) {
      throw mapRazorpayError(error, `Failed to fetch refund ${refundId}`);
    }
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const currency = dto.currency ?? 'INR';
    try {
      const payload: Record<string, unknown> = {
        type: 'invoice',
        currency,
        description: dto.description,
        customer: {
          name: dto.customer.name,
          email: dto.customer.email,
          contact: dto.customer.contact,
          billing_address: dto.customer.billing_address,
        },
        line_items: dto.line_items.map((item) => {
          const itemCurrency = item.currency ?? currency;
          return {
            name: item.name,
            description: item.description,
            amount: toMinorUnits(item.amount, itemCurrency),
            currency: itemCurrency,
            quantity: item.quantity ?? 1,
          };
        }),
        partial_payment: dto.partial_payment,
        email_notify: dto.email_notify ?? true,
        sms_notify: dto.sms_notify ?? false,
        notes: dto.notes,
      };
      if (dto.expire_by) payload.expire_by = dto.expire_by;

      return await this.razorpay.invoices.create(payload as never);
    } catch (error) {
      throw mapRazorpayError(error, 'Failed to create Razorpay invoice');
    }
  }

  async listInvoices(query: {
    type?: string;
    payment_id?: string;
    receipt?: string;
    customer_id?: string;
    count?: number;
    skip?: number;
  }) {
    try {
      const options: Record<string, unknown> = {
        count: query.count ?? 10,
        skip: query.skip ?? 0,
      };
      if (query.type) options.type = query.type;
      if (query.payment_id) options.payment_id = query.payment_id;
      if (query.receipt) options.receipt = query.receipt;
      if (query.customer_id) options.customer_id = query.customer_id;
      return await this.razorpay.invoices.all(options as never);
    } catch (error) {
      throw mapRazorpayError(error, 'Failed to list invoices');
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      return await this.razorpay.invoices.fetch(invoiceId);
    } catch (error) {
      throw mapRazorpayError(error, `Failed to fetch invoice ${invoiceId}`);
    }
  }

  async handleWebhook(
    rawBody: Buffer | string | undefined,
    signature: string | undefined,
    parsedBody: unknown,
  ): Promise<WebhookResult> {
    if (!rawBody || !signature) {
      throw new BadRequestException({
        message: 'Missing raw webhook body or X-Razorpay-Signature header.',
        code: 'webhook_missing_signature',
        provider: 'razorpay',
      });
    }

    const bodyString = Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : String(rawBody);

    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (!timingSafeHexEqual(expected, signature)) {
      throw new UnauthorizedException({
        message: 'Invalid webhook signature.',
        code: 'invalid_webhook_signature',
        provider: 'razorpay',
      });
    }

    const event =
      (parsedBody as { event?: string } | undefined)?.event ?? 'unknown';

    // Demo: log and acknowledge. Swap for your outbox / order-state machine.
    this.logger.log(`Webhook verified: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      this.logger.debug(
        `Order settlement event received for ${JSON.stringify(
          (parsedBody as { payload?: unknown })?.payload ?? {},
        ).slice(0, 500)}`,
      );
    }

    return { received: true, event, handled: true };
  }
}
