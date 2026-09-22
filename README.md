# Razorpay + NestJS Sandbox Demo Repository

This repository demonstrates how to integrate the **Razorpay API** into a **NestJS** and **TypeScript** backend running entirely in **Sandbox (Test) Mode**. It showcases order creation, mock payment flows, and fetching third-party billing details using the **Razorpay Invoice APIs** without relying on Stripe or PayPal.

---

## 📁 File Structure

```text
razorpay-nestjs-demo/
├── src/
│   ├── razorpay/
│   │   ├── razorpay.controller.ts
│   │   ├── razorpay.module.ts
│   │   └── razorpay.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📄 Source Code

### 1. `package.json`
```json
{
  "name": "razorpay-nestjs-sandbox-demo",
  "version": "1.0.0",
  "description": "NestJS TypeScript demo for Razorpay sandbox and invoice tracking",
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "dotenv": "^16.4.5",
    "razorpay": "^2.9.2",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.3.1",
    "typescript": "^5.1.3"
  }
}
```

### 2. `.env.example`
```env
PORT=3000
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

### 3. `src/razorpay/razorpay.service.ts`
```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private razorpayInstance: Razorpay;

  constructor() {
    // Initialize Razorpay Instance with Sandbox (Test Mode) Keys
    this.razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
  }

  /**
   * Step 1: Create an Order in the Sandbox Environment
   */
  async createOrder(amount: number, currency: string = 'INR', receipt: string) {
    try {
      const options = {
        amount: amount * 100, // Razorpay handles amounts in smallest currency subunits (e.g., Paise)
        currency,
        receipt,
        payment_capture: 1, // Automatically capture payment upon authorization
      };

      const order = await this.razorpayInstance.orders.create(options);
      return order;
    } catch (error) {
      throw new HttpException(
        error.description || 'Failed to create order in Razorpay Sandbox',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Step 2: Fetch a specific invoice from Razorpay API (Third-party data fetch)
   */
  async getInvoiceById(invoiceId: string) {
    try {
      const invoice = await this.razorpayInstance.invoices.fetch(invoiceId);
      return invoice;
    } catch (error) {
      throw new HttpException(
        error.description || `Failed to fetch invoice ${invoiceId}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Step 3: List all recent invoices generated on the Razorpay Sandbox dashboard
   */
  async getAllInvoices(limit: number = 10) {
    try {
      const invoices = await this.razorpayInstance.invoices.all({ count: limit });
      return invoices;
    } catch (error) {
      throw new HttpException(
        error.description || 'Failed to fetch invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### 4. `src/razorpay/razorpay.controller.ts`
```typescript
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';

@Controller('razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('order')
  async createOrder(
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('receipt') receipt: string,
  ) {
    return this.razorpayService.createOrder(amount, currency, receipt);
  }

  @Get('invoices')
  async getAllInvoices(@Query('limit') limit?: number) {
    return this.razorpayService.getAllInvoices(limit ? Number(limit) : 10);
  }

  @Get('invoices/:id')
  async getInvoiceById(@Param('id') id: string) {
    return this.razorpayService.getInvoiceById(id);
  }
}
```

### 5. `src/razorpay/razorpay.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';

@Module({
  controllers: [RazorpayController],
  providers: [RazorpayService],
})
export class RazorpayModule {}
```

### 6. `src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { RazorpayModule } from './razorpay/razorpay.module';

@Module({
  imports: [RazorpayModule],
})
export class AppModule {}
```

### 7. `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  
  app.enableCors(); // Beneficial for client frontend interactions
  await app.listen(port);
  console.log(`🚀 Razorpay Demo application is running on: http://localhost:${port}`);
}
bootstrap();
```

### 8. `tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

---

## 🚀 How to Set Up and Run

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environmental Credentials**
   * Duplicate `.env.example` and rename it to `.env`.
   * Log into your [Razorpay Dashboard](https://dashboard.razorpay.com) and switch to **Test Mode**.
   * Go to **Settings > API Keys** to generate your Test Credentials and update the `.env` file.

3. **Run the NestJS Server**
   ```bash
   npm run start:dev
   ```

4. **Verify Invoice Tracking (Testing via Postman/cURL)**
   * **List Invoices:** Send a `GET` request to `http://localhost:3000/razorpay/invoices`.
   * **Fetch Invoice details:** Send a `GET` request to `http://localhost:3000/razorpay/invoices/{invoice_id}`.
