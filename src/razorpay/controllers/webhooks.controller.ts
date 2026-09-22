import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WEBHOOK_OK_EXAMPLE } from '../common/swagger.examples';
import { RazorpayService } from '../razorpay.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('razorpay')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Razorpay webhook receiver',
    description: [
      'Verifies `X-Razorpay-Signature` (HMAC-SHA256 of the **raw** body with `RAZORPAY_WEBHOOK_SECRET`).',
      '',
      'Configure this URL in the Razorpay Dashboard:',
      '`Settings → Webhooks → https://<your-host>/api/v1/webhooks/razorpay`',
      '',
      'Subscribe to at least: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`.',
    ].join('\n'),
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Signature valid — event acknowledged',
    schema: { example: WEBHOOK_OK_EXAMPLE },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid X-Razorpay-Signature',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid webhook signature.',
        code: 'invalid_webhook_signature',
        provider: 'razorpay',
      },
    },
  })
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException({
        message: 'Raw body unavailable — server must start with rawBody enabled.',
        code: 'raw_body_missing',
      });
    }
    return this.razorpayService.handleWebhook(req.rawBody, signature, req.body);
  }
}
