import { Module } from '@nestjs/common';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { BookingsService } from './bookings.service';
import { OperationsController } from './operations.controller';

@Module({
  controllers: [OperationsController],
  providers: [BookingsService, ReferenceCodeService],
  exports: [BookingsService],
})
export class OperationsModule {}
