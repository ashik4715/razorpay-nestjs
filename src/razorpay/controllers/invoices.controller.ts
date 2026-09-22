import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { INVOICE_EXAMPLE } from '../common/swagger.examples';
import { CreateInvoiceDto } from '../dto/invoice.dto';
import { ListInvoicesQueryDto } from '../dto/order.dto';
import { RazorpayService } from '../razorpay.service';

@ApiTags('invoices')
@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an invoice',
    description:
      'Creates a Razorpay invoice with inline customer + line items (third-party billing, no Stripe required). Line amounts are accepted in major units and converted to paise.',
  })
  @ApiCreatedResponse({
    description: 'Invoice created',
    schema: { example: INVOICE_EXAMPLE },
  })
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.razorpayService.createInvoice(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List invoices',
    description:
      'List invoices. Optional filters: `type`, `payment_id`, `receipt`, `customer_id`.',
  })
  @ApiOkResponse({
    description: 'Invoice collection',
    schema: { example: { count: 1, items: [INVOICE_EXAMPLE] } },
  })
  listInvoices(@Query() query: ListInvoicesQueryDto) {
    return this.razorpayService.listInvoices(query);
  }

  @Get(':invoiceId')
  @ApiOperation({
    summary: 'Fetch an invoice',
    description: 'Fetch billing details: customer, line items, tax, status and short link.',
  })
  @ApiParam({ name: 'invoiceId', example: 'inv_QHI5uVwXyZaBcD' })
  @ApiOkResponse({ description: 'Invoice entity', schema: { example: INVOICE_EXAMPLE } })
  getInvoice(@Param('invoiceId') invoiceId: string) {
    return this.razorpayService.getInvoice(invoiceId);
  }
}
