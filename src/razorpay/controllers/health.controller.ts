import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthStatus, RazorpayService } from '../razorpay.service';

@ApiTags('health')
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Get()
  @ApiOperation({
    summary: 'Service health',
    description:
      'Returns liveness status, configured Razorpay mode (test/live) and a masked key id.',
  })
  @ApiOkResponse({
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        service: 'razorpay-nestjs-sandbox-demo',
        mode: 'test',
        keyId: 'rzp_test****G6',
        timestamp: '2026-09-22T12:00:00.000Z',
      },
    },
  })
  getHealth(): HealthStatus {
    return this.razorpayService.getHealth();
  }
}
