import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenScope } from '@travelos/types';
import { AppConfigService } from '../../core/config';

export interface AccessTokenClaims {
  sub: string; // userId
  tenant_id: string;
  scope: TokenScope;
  roles: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      // TTL is a string like "15m"; cast to satisfy jsonwebtoken's StringValue type.
      expiresIn: this.config.get('JWT_ACCESS_TTL') as unknown as number,
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    return this.jwt.verifyAsync<AccessTokenClaims>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
    });
  }

  /** Refresh tokens are opaque random strings (hashed in `session`), not JWTs. */
  get refreshTtlMs(): number {
    return this.config.get('JWT_REFRESH_TTL_DAYS') * 24 * 60 * 60 * 1000;
  }
}
