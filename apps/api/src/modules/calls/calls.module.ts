import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { TelephonyWebhookController } from '../../webhooks/telephony.controller';

@Module({
  controllers: [CallsController, TelephonyWebhookController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
