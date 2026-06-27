import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { TokenScope } from '@travelos/types';
import { PrismaService } from '../../core/database/prisma.service';
import { AppConfigService } from '../../core/config';
import { AuditService } from '../../core/audit';
import {
  decryptSecret,
  generateOtp,
  randomToken,
  sha256,
} from '../../core/common/crypto.util';
import { TokenService } from './token.service';
import { OtpNotifier } from './otp-notifier.service';
import type { LoginDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; fullName: string; tenantId: string; roles: string[] };
}

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
    private readonly otpNotifier: OtpNotifier,
  ) {}

  // ─────────────────────────── Password login ───────────────────────────

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const tenant = await this.requireTenant(dto.tenantSlug);
    const user = await this.prisma.unscoped.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
    });

    const fail = async (reason: string): Promise<never> => {
      await this.prisma.unscoped.loginHistory.create({
        data: {
          tenantId: tenant.id,
          userId: user?.id,
          email: dto.email,
          success: false,
          failureReason: reason,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
      });
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', error: 'Invalid credentials' });
    };

    if (!user || !user.passwordHash) return fail('no_user_or_password');
    if (user.status === 'disabled') return fail('disabled');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) return fail('bad_password');

    if (user.is2faEnabled && user.totpSecret) {
      if (!dto.totp) {
        throw new ForbiddenException({ code: 'TOTP_REQUIRED', error: 'TOTP code required' });
      }
      const secret = decryptSecret(user.totpSecret, this.config.get('ENCRYPTION_KEY'));
      if (!authenticator.verify({ token: dto.totp, secret })) return fail('bad_totp');
    }

    const result = await this.issueTokens(user.id, tenant.id, TokenScope.Staff, meta);

    await this.prisma.unscoped.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.unscoped.loginHistory.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        email: dto.email,
        success: true,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    await this.audit.record({
      action: 'login',
      resourceType: 'user',
      resourceId: user.id,
      tenantId: tenant.id,
      actorUserId: user.id,
    });

    return result;
  }

  // ─────────────────────────────── OTP ───────────────────────────────

  async requestOtp(dto: RequestOtpDto, meta: RequestMeta): Promise<{ sent: boolean }> {
    const tenant = await this.requireTenant(dto.tenantSlug);
    const channel = dto.channel ?? (dto.identifier.includes('@') ? 'email' : 'sms');
    const code = generateOtp(6);

    await this.prisma.unscoped.otpChallenge.create({
      data: {
        tenantId: tenant.id,
        identityRef: dto.identifier.toLowerCase(),
        channel,
        codeHash: sha256(code),
        purpose: 'login',
        expiresAt: new Date(Date.now() + this.config.get('OTP_TTL_SECONDS') * 1000),
      },
    });

    await this.otpNotifier.send(channel, dto.identifier, code);
    void meta;
    return { sent: true };
  }

  async verifyOtp(dto: VerifyOtpDto, meta: RequestMeta): Promise<AuthResult> {
    const tenant = await this.requireTenant(dto.tenantSlug);
    const identityRef = dto.identifier.toLowerCase();

    const challenge = await this.prisma.unscoped.otpChallenge.findFirst({
      where: {
        tenantId: tenant.id,
        identityRef,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new UnauthorizedException({ code: 'OTP_INVALID', error: 'No valid OTP challenge' });
    }
    if (challenge.attempts >= this.config.get('OTP_MAX_ATTEMPTS')) {
      throw new UnauthorizedException({ code: 'OTP_LOCKED', error: 'Too many attempts' });
    }

    if (challenge.codeHash !== sha256(dto.code)) {
      await this.prisma.unscoped.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException({ code: 'OTP_INVALID', error: 'Incorrect code' });
    }

    await this.prisma.unscoped.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.unscoped.user.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [{ email: identityRef }, { phone: dto.identifier }],
        status: { not: 'disabled' },
      },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', error: 'No staff user for this identifier' });
    }

    return this.issueTokens(user.id, tenant.id, TokenScope.Staff, meta);
  }

  // ───────────────────────── Token lifecycle ─────────────────────────

  private async issueTokens(
    userId: string,
    tenantId: string,
    scope: TokenScope,
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const user = await this.prisma.unscoped.user.findUniqueOrThrow({ where: { id: userId } });
    const roleRows = await this.prisma.unscoped.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const roles = roleRows.map((r) => r.role.key);

    const accessToken = await this.tokens.signAccessToken({
      sub: userId,
      tenant_id: tenantId,
      scope,
      roles,
    });

    const refreshToken = randomToken();
    await this.prisma.unscoped.session.create({
      data: {
        tenantId,
        userId,
        refreshTokenHash: sha256(refreshToken),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + this.tokens.refreshTtlMs),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, tenantId, roles },
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const hash = sha256(refreshToken);
    const session = await this.prisma.unscoped.session.findFirst({
      where: { refreshTokenHash: hash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      // Reuse-detection: if a revoked token is presented, revoke the whole family.
      if (session?.revokedAt) {
        await this.prisma.unscoped.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', error: 'Invalid refresh token' });
    }

    // Rotate: revoke the old session, issue a fresh one.
    await this.prisma.unscoped.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const scope = TokenScope.Staff;
    return this.issueTokens(session.userId, session.tenantId, scope, meta);
  }

  async logout(refreshToken: string): Promise<{ success: boolean }> {
    const hash = sha256(refreshToken);
    await this.prisma.unscoped.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  // ─────────────────────────────── Helpers ───────────────────────────────

  private async requireTenant(slug: string) {
    const tenant = await this.prisma.unscoped.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.status === 'cancelled' || tenant.status === 'suspended') {
      throw new UnauthorizedException({ code: 'TENANT_INVALID', error: 'Unknown or inactive tenant' });
    }
    return tenant;
  }
}
