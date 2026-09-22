import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { toMinorUnits } from '../common/amount';

export class PaymentLinkCustomerDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919888888888' })
  @IsOptional()
  @IsString()
  contact?: string;
}

export class CreatePaymentLinkDto {
  @ApiProperty({
    example: 99,
    minimum: 1,
    description:
      'Amount in major currency units (99 = ₹99). Converted to paise. Minimum ₹1.00.',
  })
  @Type(() => Number)
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string = 'INR';

  @ApiPropertyOptional({ example: 'Pay for order demo', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 'REF-1001', description: 'Your reference id.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference_id?: string;

  @ApiPropertyOptional({ type: PaymentLinkCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentLinkCustomerDto)
  customer?: PaymentLinkCustomerDto;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/api/v1/health',
    description: 'Redirect URL after payment (callback_method must be get).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  callback_url?: string;

  @ApiPropertyOptional({ example: { order_ref: 'demo' } })
  @IsOptional()
  @IsObject()
  notes?: Record<string, string>;

  @ApiPropertyOptional({ example: false, default: false, description: 'Allow partial payments.' })
  @IsOptional()
  @IsBoolean()
  accept_partial?: boolean = false;

  @ApiPropertyOptional({
    example: 1793000000,
    description: 'Unix expiry timestamp (seconds).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expire_by?: number;
}

/** Helper used by service — not a request DTO */
export function paymentLinkAmountMinor(dto: CreatePaymentLinkDto): number {
  return toMinorUnits(dto.amount, dto.currency ?? 'INR');
}

export class ListPaymentLinksQueryDto {
  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  count?: number = 10;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;
}

export class ListPaymentsReportQueryDto {
  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  count?: number = 10;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;
}
