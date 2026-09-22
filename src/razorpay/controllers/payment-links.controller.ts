import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePaymentLinkDto,
  ListPaymentLinksQueryDto,
} from '../dto/payment-link.dto';
import { RazorpayService } from '../razorpay.service';

@ApiTags('payment-links')
@Controller('api/v1/payment-links')
export class PaymentLinksController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a Payment Link (best way to demo a real test payment)',
    description: [
      'Creates a Razorpay **Payment Link**. Open the returned `short_url` in a browser.',
      '',
      'In **Test Mode**, the link page lets you pick **Success / Failure** — no real card needed.',
      'A successful payment shows up under **Payments → Transactions** and on the linked order/report.',
      '',
      '> Test Mode allows up to 30 payment links per business.',
    ].join('\n'),
  })
  @ApiCreatedResponse({
    description: 'Payment link created',
    schema: {
      example: {
        id: 'plink_Tf74MBdau2mACw',
        short_url: 'https://rzp.io/rzp/h97bsEU',
        status: 'created',
        amount: 9900,
        currency: 'INR',
        amount_paid: 0,
        description: 'Pay for order demo',
        reference_id: 'REF-1001',
        created_at: 1790085281,
      },
    },
  })
  createPaymentLink(@Body() dto: CreatePaymentLinkDto) {
    return this.razorpayService.createPaymentLink(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List payment links',
    description: 'Recent payment links with status and amount_paid.',
  })
  @ApiOkResponse({ description: 'Payment link collection' })
  listPaymentLinks(@Query() query: ListPaymentLinksQueryDto) {
    return this.razorpayService.listPaymentLinks(query);
  }

  @Get(':paymentLinkId')
  @ApiOperation({
    summary: 'Fetch a payment link',
    description: 'Includes `short_url`, status, amount_paid and any captured payments.',
  })
  @ApiParam({ name: 'paymentLinkId', example: 'plink_Tf74MBdau2mACw' })
  @ApiOkResponse({ description: 'Payment link entity' })
  getPaymentLink(@Param('paymentLinkId') paymentLinkId: string) {
    return this.razorpayService.getPaymentLink(paymentLinkId);
  }

  @Post(':paymentLinkId/cancel')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cancel a payment link',
    description: 'Cancels an unused link so it can no longer be paid.',
  })
  @ApiParam({ name: 'paymentLinkId', example: 'plink_Tf74MBdau2mACw' })
  @ApiOkResponse({ description: 'Cancelled payment link' })
  cancelPaymentLink(@Param('paymentLinkId') paymentLinkId: string) {
    return this.razorpayService.cancelPaymentLink(paymentLinkId);
  }
}
