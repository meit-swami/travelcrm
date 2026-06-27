import { Module } from '@nestjs/common';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';

@Module({
  controllers: [VouchersController],
  providers: [VouchersService, ReferenceCodeService],
  exports: [VouchersService],
})
export class VouchersModule {}
