import { Body, Controller, Get, Param, Post, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
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

  // Streams the stored document bytes (PDF or HTML) directly — used by the
  // same-origin BFF so the browser never needs to reach internal storage.
  @Get('vouchers/:id/file')
  @Can('voucher.read_own')
  async file(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const f = await this.vouchers.getFileStream(id);
    res.set({
      'Content-Type': f.contentType,
      'Content-Disposition': `attachment; filename="${f.filename}"`,
    });
    return new StreamableFile(f.body);
  }
}
