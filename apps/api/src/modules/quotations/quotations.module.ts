import { Module } from '@nestjs/common';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { LeadsModule } from '../leads/leads.module';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [LeadsModule],
  controllers: [QuotationsController],
  providers: [QuotationsService, ReferenceCodeService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
