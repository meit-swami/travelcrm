import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { VouchersService } from './vouchers.service';
import { GenerateVoucherDto } from './dto/vouchers.dto';

@ApiTags('Vouchers')
@ApiBearerAuth()
@Controller()
export class VouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Get('bookings/:bookingId/vouchers')
  @Can('voucher.read_own')
  list(@Param('bookingId') bookingId: string) {
    return this.vouchers.listForBooking(bookingId);
  }

  @Post('bookings/:bookingId/vouchers')
  @Can('voucher.create')
  generate(@Param('bookingId') bookingId: string, @Body() dto: GenerateVoucherDto) {
    return this.vouchers.generate(bookingId, dto);
  }

  @Get('vouchers/:id/pdf')
  @Can('voucher.read_own')
  download(@Param('id') id: string) {
    return this.vouchers.getDownloadUrl(id);
  }
}
