import { Module } from '@nestjs/common';
import { EmailProvider } from '../../integrations/email/email.provider';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { AutomationService } from './automation.service';
import { EmailProcessor } from './email.processor';

@Module({
  controllers: [EmailController],
  providers: [EmailProvider, EmailService, AutomationService, EmailProcessor],
  exports: [EmailService, AutomationService],
})
export class EmailModule {}
