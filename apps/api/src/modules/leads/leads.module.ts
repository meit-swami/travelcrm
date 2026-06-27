import { Module } from '@nestjs/common';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { CaptureController } from './capture.controller';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { AssignmentService } from './assignment.service';
import { DedupeService } from './dedupe.service';

@Module({
  controllers: [LeadsController, CaptureController, SourcesController],
  providers: [LeadsService, SourcesService, AssignmentService, DedupeService, ReferenceCodeService],
  exports: [LeadsService],
})
export class LeadsModule {}
