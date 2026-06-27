import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../core/common';
import { CurrentUser, type AuthUser } from '../../core/common/decorators/current-user.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { PermissionsService } from '../../core/rbac';
import { ALL_PERMISSIONS } from '@travelos/types';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  private meta(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, this.meta(req));
  }

  @Public()
  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    return this.auth.requestOtp(dto, this.meta(req));
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.auth.verifyOtp(dto, this.meta(req));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, this.meta(req));
  }

  @Public()
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const me = await this.prisma.unscoped.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { id: true, email: true, fullName: true, avatarUrl: true, tenantId: true },
    });
    const effective = await this.permissions.getEffectivePermissions(user.userId);
    return {
      ...me,
      roles: user.roles,
      permissions: effective === ALL_PERMISSIONS ? ['*'] : [...effective],
    };
  }
}
