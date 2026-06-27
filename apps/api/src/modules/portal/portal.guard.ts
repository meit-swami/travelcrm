import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenScope } from '@travelos/types';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { TokenService } from '../auth/token.service';

export interface PortalUser {
  identityId: string;
  tenantId: string;
}

/**
 * Verifies a portal-scoped JWT and sets the tenant context. Applied to portal
 * data routes (which are @Public to the staff AuthGuard). Rejects staff tokens.
 */
@Injectable()
export class PortalGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly tenantContext: TenantContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException({ code: 'UNAUTHENTICATED', error: 'Missing token' });

    let claims;
    try {
      claims = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', error: 'Invalid token' });
    }
    if (claims.scope !== TokenScope.Portal) {
      throw new UnauthorizedException({ code: 'WRONG_SCOPE', error: 'Portal token required' });
    }

    (req as Request & { portal: PortalUser }).portal = { identityId: claims.sub, tenantId: claims.tenant_id };
    this.tenantContext.patch({ tenantId: claims.tenant_id, scope: TokenScope.Portal });
    return true;
  }
}
