import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenScope } from '@travelos/types';
import { PrismaService } from '../../core/database/prisma.service';
import { AppConfigService } from '../../core/config';
import { TokenService } from '../auth/token.service';
import { OtpNotifier } from '../auth/otp-notifier.service';
import { generateOtp, sha256 } from '../../core/common/crypto.util';
import type { PortalOtpDto, PortalVerifyDto } from './dto/portal.dto';

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly tokens: TokenService,
    private readonly otpNotifier: OtpNotifier,
  ) {}

  private async requireTenant(slug: string) {
    const tenant = await this.prisma.unscoped.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new UnauthorizedException({ code: 'TENANT_INVALID', error: 'Unknown tenant' });
    return tenant;
  }

  async requestOtp(dto: PortalOtpDto): Promise<{ sent: boolean }> {
    const tenant = await this.requireTenant(dto.tenantSlug);
    const code = generateOtp(6);
    await this.prisma.unscoped.otpChallenge.create({
      data: {
        tenantId: tenant.id,
        identityRef: dto.phone,
        channel: 'sms',
        codeHash: sha256(code),
        purpose: 'login',
        expiresAt: new Date(Date.now() + this.config.get('OTP_TTL_SECONDS') * 1000),
      },
    });
    await this.otpNotifier.send('sms', dto.phone, code);
    return { sent: true };
  }

  async verifyOtp(dto: PortalVerifyDto): Promise<{ accessToken: string; identityId: string }> {
    const tenant = await this.requireTenant(dto.tenantSlug);
    const challenge = await this.prisma.unscoped.otpChallenge.findFirst({
      where: { tenantId: tenant.id, identityRef: dto.phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.codeHash !== sha256(dto.code)) {
      throw new UnauthorizedException({ code: 'OTP_INVALID', error: 'Invalid or expired code' });
    }
    await this.prisma.unscoped.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });

    // Link the portal identity to a matching lead (if any).
    const lead = await this.prisma.unscoped.lead.findFirst({
      where: { tenantId: tenant.id, phone: { contains: dto.phone.slice(-10) }, deletedAt: null },
    });
    const existing = await this.prisma.unscoped.portalIdentity.findFirst({
      where: { tenantId: tenant.id, phone: dto.phone },
    });
    const identity = existing
      ? await this.prisma.unscoped.portalIdentity.update({
          where: { id: existing.id },
          data: { lastLoginAt: new Date(), leadId: lead?.id ?? existing.leadId },
        })
      : await this.prisma.unscoped.portalIdentity.create({
          data: { tenantId: tenant.id, phone: dto.phone, leadId: lead?.id, lastLoginAt: new Date() },
        });

    const accessToken = await this.tokens.signAccessToken({
      sub: identity.id,
      tenant_id: tenant.id,
      scope: TokenScope.Portal,
      roles: [],
    });
    return { accessToken, identityId: identity.id };
  }
}
