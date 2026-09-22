import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Razorpay Sandbox Payments API')
    .setDescription(
      [
        'Production-style NestJS demo for the **Razorpay** payment gateway in **Test (Sandbox) Mode**.',
        '',
        '### Flow',
        '1. `POST /api/v1/orders` — create a server-side order.',
        '2. **Pay (needed for dashboard Payments/Reports):**',
        '   - Open `/checkout?orderId=...` (hosted Checkout demo), **or**',
        '   - `POST /api/v1/payment-links` → open `short_url` → pick **Success** in Test Mode.',
        '3. `POST /api/v1/payments/verify` — verify the checkout signature.',
        '4. `GET /api/v1/reports/transactions` — client-facing transaction report.',
        '',
        '> Orders alone stay **Created / No Payments** until someone completes Test Mode checkout.',
        '',
        '### Notes',
        '- All monetary inputs are accepted in **major currency units** (e.g. `499` = ₹499) and converted to minor units (paise) server-side before calling Razorpay.',
        '- Webhook payloads are signature-checked against `RAZORPAY_WEBHOOK_SECRET` using the raw request body.',
        '- Swagger UI: `/api/docs` · OpenAPI JSON: `/api/docs-json` · Checkout demo: `/checkout`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addTag('health', 'Liveness/readiness probe')
    .addTag('orders', 'Server-side order lifecycle')
    .addTag('payments', 'Payment fetch, verify, capture')
    .addTag('refunds', 'Full and partial refunds')
    .addTag('invoices', 'Razorpay invoice / billing records')
    .addTag('payment-links', 'Hosted pay links (real Test Mode payments)')
    .addTag('reports', 'Transaction report for clients')
    .addTag('demo-checkout', 'Hosted Checkout HTML demo')
    .addTag('webhooks', 'Signed webhook receiver')
    .addServer('http://localhost:3000', 'Local sandbox')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Razorpay NestJS Sandbox Docs',
    swaggerOptions: { persistAuthorization: true, docExpansion: 'list' },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API       http://localhost:${port}/api/v1/health`);
  logger.log(`Swagger   http://localhost:${port}/api/docs`);
  logger.log(`OpenAPI   http://localhost:${port}/api/docs-json`);
}

void bootstrap();
