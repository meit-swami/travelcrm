import { Module } from '@nestjs/common';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { PaymentGateway } from '../../integrations/payments/payment.gateway';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from '../../webhooks/payments.controller';

@Module({
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [PaymentsService, PaymentGateway, ReferenceCodeService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
