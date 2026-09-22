# Setup Guide: Razorpay NestJS Backend (Sandbox Mode)

PAN: PAAAA9999A
Yes, **you must sign up for a free Razorpay account**, but you **do not** need to submit business registration or KYC documents to use this guide. Razorpay allows immediate development access in **Test Mode** (Sandbox) right after account creation.

---

## 🛠️ Step 0: Get Your Sandbox Keys (Required)

1. Go to the [Razorpay Website](https://razorpay.com/) and register a free account.
2. Log in and toggle the switch in your dashboard from **Live Mode** to **Test Mode**.
3. Navigate to **Account & Settings** -> **API Keys** -> click **Generate Key**.
4. Copy your `Key ID` and `Key Secret`. (They will look like `rzp_test_...`).

---

## 💻 Project Implementation Steps

### Step 1: Set Up the NestJS Project & Dependencies

Create your workspace and install the official Razorpay Node.js SDK.

```bash
# Install NestJS CLI globally if you haven't already
npm install -g @nestjs/cli

# Generate a new application
nest new razorpay-sandbox-backend
cd razorpay-sandbox-backend

# Install Razorpay SDK
npm install razorpay
```

### Step 2: Configure Environment Variables

Create a `.env` file at the root of your project to house your credentials securely.

```env
PORT=3000
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
```

### Step 3: Build the Core Razorpay Module & Service

Create a dedicated service that provides an initialized instance of the Razorpay SDK client.

#### `razorpay.service.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import * as Razorpay from "razorpay";

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpayInstance: Razorpay;

  constructor() {
    this.razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    this.logger.log("Razorpay Sandbox Instance initialized.");
  }

  getInstance(): Razorpay {
    return this.razorpayInstance;
  }
}
```

### Step 4: Implement Sandbox Order Creation

Every transaction requires creating a server-side order first to enforce data integrity.

#### `payment.service.ts`

```typescript
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { RazorpayService } from "./razorpay.service";

@Injectable()
export class PaymentService {
  constructor(private razorpayService: RazorpayService) {}

  async createSandboxOrder(amount: number, currency: string = "INR") {
    const options = {
      amount: amount * 100, // Razorpay consumes amounts in the smallest currency unit (e.g., paise)
      currency,
      receipt: `receipt_order_${Date.now()}`,
    };

    try {
      const order = await this.razorpayService
        .getInstance()
        .orders.create(options);
      return order;
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to create Razorpay sandbox order",
        error.message,
      );
    }
  }
}
```

### Step 5: Implement Signature Verification

When your front-end completes a mockup checkout payment step, your server must cryptographically verify that the checkout was authentic using your local `RAZORPAY_KEY_SECRET`.

```typescript
import * as crypto from "crypto";

@Injectable()
export class PaymentService {
  // ... existing code from step 4

  verifySandboxPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generatedSignature === signature;
  }
}
```

### Step 6: Integrate Fetching Third-Party Billing via Invoice APIs

Retrieve business metadata and third-party customer tax invoicing records without relying on standard SaaS engines like Stripe.

```typescript
@Injectable()
export class PaymentService {
  // ... existing code from previous steps

  async fetchBillingDetails(invoiceId: string) {
    try {
      const invoice = await this.razorpayService
        .getInstance()
        .invoices.fetch(invoiceId);
      return {
        invoiceNumber: invoice.id,
        customerName: invoice.customer_details?.name,
        billingAddress: invoice.billing_address,
        lineItems: invoice.line_items,
        taxAmount: invoice.tax_amount,
        issuedAt: invoice.issued_at,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to fetch Razorpay billing details",
        error.message,
      );
    }
  }
}
```

### Step 7: Expose via Controller Routes

Expose your methods over REST endpoints.

#### `payment.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";

@Controller("api/payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("order")
  async generateOrder(@Body() body: { amount: number; currency?: string }) {
    return this.paymentService.createSandboxOrder(body.amount, body.currency);
  }

  @Post("verify")
  async verifyPayment(
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    const isValid = this.paymentService.verifySandboxPayment(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
    );

    if (!isValid) {
      throw new BadRequestException(
        "Invalid payment signature verification failed.",
      );
    }
    return {
      success: true,
      message: "Payment successfully captured via sandbox.",
    };
  }

  @Get("billing/:invoiceId")
  async getInvoiceBilling(@Param("invoiceId") invoiceId: string) {
    return this.paymentService.fetchBillingDetails(invoiceId);
  }
}
```
