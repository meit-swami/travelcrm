import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../core/common';
import { PortalAuthService } from './portal-auth.service';
import { PortalService } from './portal.service';
import { PortalGuard, type PortalUser } from './portal.guard';
import { PortalOtpDto, PortalVerifyDto } from './dto/portal.dto';

function portalUser(req: Request): PortalUser {
  return (req as Request & { portal: PortalUser }).portal;
}

@ApiTags('Customer Portal')
@Controller('portal')
export class PortalController {
  constructor(
    private readonly auth: PortalAuthService,
    private readonly portal: PortalService,
  ) {}

  // ── Auth (OTP) ──
  @Public()
  @Post('request-otp')
  requestOtp(@Body() dto: PortalOtpDto) {
    return this.auth.requestOtp(dto);
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() dto: PortalVerifyDto) {
    return this.auth.verifyOtp(dto);
  }

  // ── Data (portal-scoped token) ──
  @Public()
  @UseGuards(PortalGuard)
  @Get('me')
  me(@Req() req: Request) {
    return this.portal.me(portalUser(req).identityId);
  }

  @Public()
  @UseGuards(PortalGuard)
  @Get('quotations')
  quotations(@Req() req: Request) {
    return this.portal.quotations(portalUser(req).identityId);
  }

  @Public()
  @UseGuards(PortalGuard)
  @Get('itinerary')
  itinerary(@Req() req: Request) {
    return this.portal.itinerary(portalUser(req).identityId);
  }

  @Public()
  @UseGuards(PortalGuard)
  @Get('invoices')
  invoices(@Req() req: Request) {
    return this.portal.invoices(portalUser(req).identityId);
  }

  @Public()
  @UseGuards(PortalGuard)
  @Get('payments')
  payments(@Req() req: Request) {
    return this.portal.payments(portalUser(req).identityId);
  }

  @Public()
  @UseGuards(PortalGuard)
  @Get('vouchers')
  vouchers(@Req() req: Request) {
    return this.portal.vouchers(portalUser(req).identityId);
  }

  @Public()
  @UseGuards(PortalGuard)
  @Get('vouchers/:id/download')
  download(@Req() req: Request, @Param('id') id: string) {
    return this.portal.download(portalUser(req).identityId, id);
  }
}
