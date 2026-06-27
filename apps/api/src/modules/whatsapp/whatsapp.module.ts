import { Module } from '@nestjs/common';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { WhatsAppProvider } from '../../integrations/messaging/whatsapp.provider';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppProcessor } from './whatsapp.processor';
import { WhatsAppWebhookController } from '../../webhooks/whatsapp.controller';

@Module({
  controllers: [WhatsAppController, WhatsAppWebhookController],
  providers: [WhatsAppService, WhatsAppProvider, WhatsAppProcessor, ReferenceCodeService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
