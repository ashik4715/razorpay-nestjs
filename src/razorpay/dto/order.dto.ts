import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 499,
    description:
      'Order amount in major currency units (e.g. 499 = ₹499). Converted to minor units server-side.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    example: 'INR',
    default: 'INR',
    description: 'ISO-4217 alphabetic currency code.',
  })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string = 'INR';

  @ApiPropertyOptional({
    example: 'rcpt_order_1727009990',
    description: 'Your unique receipt id (max 255 chars). Auto-generated if omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  receipt?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Automatically capture the payment once authorized.',
  })
  @IsOptional()
  @IsBoolean()
  payment_capture?: boolean = true;

  @ApiPropertyOptional({
    example: { customer_id: 'cust_demo_1' },
    description: 'Up to 15 key/value pairs stored on the order (max 40 chars each).',
  })
  @IsOptional()
  @IsObject()
  notes?: Record<string, string>;
}

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ example: 1726900000, description: 'Unix timestamp (seconds).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  from?: number;

  @ApiPropertyOptional({ example: 1727100000, description: 'Unix timestamp (seconds).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  to?: number;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  count?: number = 10;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
}

export class ListPaymentsQueryDto extends ListOrdersQueryDto {
  @ApiPropertyOptional({
    example: 'order_QHI2xgVvRyJmQb',
    description: 'Filter payments belonging to this order.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  order_id?: string;
}

export class ListRefundsQueryDto {
  @ApiPropertyOptional({
    example: 'pay_QHI3aBcDeFgHiJ',
    description: 'Filter refunds for this payment.',
    pattern: '^pay_[A-Za-z0-9]+$',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^pay_[A-Za-z0-9]+$/, {
    message: 'payment_id must be a valid Razorpay payment id (pay_...)',
  })
  payment_id?: string;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  count?: number = 10;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
}

export class ListInvoicesQueryDto {
  @ApiPropertyOptional({
    example: 'invoice',
    description: 'Filter by invoice type. Defaults to all types.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @ApiPropertyOptional({
    example: 'inv_QHI5uVwXyZaBcD',
    description: 'Filter by related payment id.',
    pattern: '^pay_[A-Za-z0-9]+$',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^pay_[A-Za-z0-9]+$/, {
    message: 'payment_id must be a valid Razorpay payment id (pay_...)',
  })
  payment_id?: string;

  @ApiPropertyOptional({ example: 'receipt_001', description: 'Filter by your receipt reference.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  receipt?: string;

  @ApiPropertyOptional({
    example: 'cust_Tf6eRdimct9knL',
    description: 'Filter invoices for a customer.',
    pattern: '^cust_[A-Za-z0-9]+$',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^cust_[A-Za-z0-9]+$/, {
    message: 'customer_id must be a valid Razorpay customer id (cust_...)',
  })
  customer_id?: string;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  count?: number = 10;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
}
