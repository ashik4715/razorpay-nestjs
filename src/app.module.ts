import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RazorpayModule } from './razorpay/razorpay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    RazorpayModule,
  ],
})
export class AppModule {}
