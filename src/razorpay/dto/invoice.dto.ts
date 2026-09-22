import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class InvoiceAddressDto {
  @ApiPropertyOptional({ example: 'Ground Floor, 12 MG Road' })
  @IsOptional()
  @IsString()
  line1?: string;

  @ApiPropertyOptional({ example: 'Near Metro Station' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  zipcode?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'in', description: 'Lowercase country code for billing addresses.' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class InvoiceCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919888888888' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ type: InvoiceAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceAddressDto)
  billing_address?: InvoiceAddressDto;
}

export class InvoiceLineItemDto {
  @ApiProperty({ example: 'Pro Plan — 1 month' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Billed monthly' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 499,
    description:
      'Line total in major currency units (499 = ₹499). Converted to paise server-side. Minimum ₹1.00.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string = 'INR';

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    example: 'Invoice for October 2026',
    description: 'Short description shown on the invoice.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ type: InvoiceCustomerDto, description: 'Customer created inline with the invoice.' })
  @ValidateNested()
  @Type(() => InvoiceCustomerDto)
  customer: InvoiceCustomerDto;

  @ApiProperty({
    type: [InvoiceLineItemDto],
    example: [
      {
        name: 'Pro Plan — 1 month',
        amount: 499,
        currency: 'INR',
        quantity: 1,
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  line_items: InvoiceLineItemDto[];

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string = 'INR';

  @ApiPropertyOptional({
    example: 1729872000,
    description: 'Unix timestamp (seconds) after which the invoice expires. Must be in the future.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expire_by?: number;

  @ApiPropertyOptional({ example: true, description: 'Allow the customer to pay partially.' })
  @IsOptional()
  @IsBoolean()
  partial_payment?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  email_notify?: boolean = true;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  sms_notify?: boolean = false;

  @ApiPropertyOptional({ example: { order_id: 'order_demo_1' } })
  @IsOptional()
  @IsObject()
  notes?: Record<string, string>;
}
