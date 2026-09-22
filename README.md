# Razorpay + NestJS Sandbox Demo (Swagger)

Production-style **NestJS + TypeScript** backend that integrates the **Razorpay** payment gateway entirely in **Test (Sandbox) Mode**. Full **Swagger/OpenAPI** docs, DTO validation, timing-safe signature checks, raw-body webhook verification, and clean error mapping — comparable to a Stripe/PayPal-grade integration demo.

---

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your Razorpay test keys
npm run start:dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000/api/docs | **Swagger UI** (Try it out) |
| http://localhost:3000/api/docs-json | OpenAPI 3.0 document |
| http://localhost:3000/api/v1/health | Health + configured key mode |
| http://localhost:3000/checkout?orderId=… | Hosted Test Mode Checkout demo |

### Environment (`.env`)

```env
PORT=3000
RAZOR_TEST_API_KEY=rzp_test_...
RAZOR_TEST_API_SECRET=...
RAZORPAY_WEBHOOK_SECRET=local_demo_webhook_secret
```

Get keys: [Razorpay Dashboard](https://dashboard.razorpay.com) → **Account & Settings → API Keys** (Test Mode).

---

## Endpoints

Base path: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness, test/live mode, masked key id |
| POST | `/orders` | Create server-side order (amount in major units, e.g. `499` = ₹499) |
| GET | `/orders` | List orders (`from`, `to`, `count`, `skip`) |
| GET | `/orders/:orderId` | Fetch order (`amount_paid`, `attempts`, status) |
| POST | `/payments/verify` | Verify Checkout signature (`order_id\|payment_id` HMAC-SHA256, timing-safe) |
| GET | `/payments` | List payments (optional `order_id` filter) |
| GET | `/payments/:paymentId` | Fetch payment |
| POST | `/payments/:paymentId/capture` | Capture an `authorized` payment (manual-capture flows) |
| POST | `/payments/:paymentId/refunds` | Full or partial refund (`speed`: `optimum` \| `instant`) |
| GET | `/refunds` | List refunds (optional `payment_id`) |
| GET | `/refunds/:refundId` | Fetch refund status |
| POST | `/invoices` | Create invoice with inline customer + line items |
| GET | `/invoices` | List invoices (`type`, `payment_id`, `receipt`, `customer_id`) |
| GET | `/invoices/:invoiceId` | Fetch invoice / billing record |
| POST | `/payment-links` | Create hosted Payment Link (Test Mode Success button) |
| GET | `/payment-links` | List payment links |
| GET | `/payment-links/:id` | Fetch payment link |
| POST | `/payment-links/:id/cancel` | Cancel payment link |
| GET | `/reports/transactions` | Client-facing transaction report |
| GET | `/checkout?orderId=` | Hosted Razorpay Checkout demo page (HTML) |
| POST | `/webhooks/razorpay` | Signed webhook receiver (raw-body HMAC) |

---

## Payment flow (demo)

> **Important:** `POST /orders` only creates an order shell. The Razorpay dashboard will show **Created / Attempts 0 / No Payments** until a human completes Test Mode checkout. There is no server-side API to “fake” a payment.

### Path A — Payment Link (easiest for client demos)

1. **Create a link**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payment-links \
     -H 'Content-Type: application/json' \
     -d '{"amount":99,"currency":"INR","description":"Demo payment","reference_id":"REF-1"}'
   ```
2. Open the returned `short_url` in a browser (e.g. `https://rzp.io/rzp/...`).
3. In **Test Mode**, choose **Success** (no card needed) or complete with a test card.
4. Payment appears under dashboard **Payments → Transactions** and in:
   ```bash
   curl http://localhost:3000/api/v1/reports/transactions
   ```

### Path B — Hosted Checkout page (order → Paid)

1. **Create an order**
   ```bash
   curl -X POST http://localhost:3000/api/v1/orders \
     -H 'Content-Type: application/json' \
     -d '{"amount":499,"currency":"INR","receipt":"rcpt_demo_1"}'
   ```
2. Open **`http://localhost:3000/checkout?orderId=order_...`** and click **Pay**.
   - Test card: `4111 1111 1111 1111` · any future expiry · any CVV  
   - UPI: `success@razorpay`
3. Handler posts to `POST /api/v1/payments/verify` — on `200/201`, mark paid.
4. Order status → **Paid**, Attempts → **1**, and a Payments row appears on the order.

---

## Webhooks

Point the Razorpay Dashboard at:

```
POST https://<your-host>/api/v1/webhooks/razorpay
```

Subscribe to at least: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`.

Signature: `HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` must equal `X-Razorpay-Signature`. The server starts with Nest `rawBody: true` so verification uses the exact bytes Razorpay sent.

Local smoke test:

```bash
BODY='{"event":"payment.captured","payload":{}}'
SIG=$(node -e "const c=require('crypto');console.log(c.createHmac('sha256','local_demo_webhook_secret').update(process.argv[1]).digest('hex'))" "$BODY")
curl -X POST http://localhost:3000/api/v1/webhooks/razorpay \
  -H 'Content-Type: application/json' \
  -H "X-Razorpay-Signature: $SIG" \
  -d "$BODY"
```

---

## Project structure

```text
razorpay-nestjs/
├── src/
│   ├── main.ts                     # rawBody, global ValidationPipe, Swagger
│   ├── app.module.ts               # ConfigModule (.env)
│   └── razorpay/
│       ├── razorpay.module.ts
│       ├── razorpay.service.ts     # SDK calls, HMAC verify, error mapping
│       ├── controllers/
│       │   ├── health.controller.ts
│       │   ├── orders.controller.ts
│       │   ├── payments.controller.ts
│       │   ├── refunds.controller.ts
│       │   ├── invoices.controller.ts
│       │   ├── payment-links.controller.ts
│       │   ├── reports.controller.ts
│       │   ├── checkout.controller.ts
│       │   └── webhooks.controller.ts
│       ├── dto/
│       │   ├── order.dto.ts
│       │   ├── payment.dto.ts
│       │   ├── payment-link.dto.ts
│       │   ├── invoice.dto.ts
│       │   └── webhook.dto.ts
│       └── common/
│           ├── amount.ts           # major → minor unit conversion (INR/JPY/KWD…)
│           ├── razorpay.utils.ts   # error mapping, timing-safe compare, key mask
│           └── swagger.examples.ts
├── .env / .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## Conventions & production notes

- **Amounts:** request bodies use major currency units (`499` = ₹499); the service converts to paise (and handles zero-/three-decimal currencies) before calling Razorpay.
- **Validation:** global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` — unknown fields are rejected.
- **Errors:** Razorpay `statusCode`/`error.description` mapped to Nest `400/401/404/502` with `{ message, code, provider: "razorpay" }`.
- **Signatures:** both Checkout and webhook verification use constant-time comparison.
- **Security:** `.env` is gitignored; never commit `RAZOR_TEST_API_SECRET`. Rotate keys if exposed.
- **Idempotency (recommended for real prod):** persist orders/payments in your DB and key write operations on Razorpay ids before marking orders paid.

---

## Scripts

```bash
npm run start:dev    # watch mode
npm run build        # compile to dist/
npm run start:prod   # node dist/main
```
