import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ALL_PERMISSIONS } from '@travelos/types';
import { IS_PUBLIC_KEY } from '../../core/common';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { PermissionsService } from '../../core/rbac';
import { TokenService } from './token.service';

/**
 * Global authentication guard. For non-`@Public()` routes it:
 *  1. verifies the Bearer access token,
 *  2. attaches `request.user`,
 *  3. patches the request context with tenantId/userId/scope,
 *  4. resolves and caches the user's effective permissions for PermissionGuard.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly tenantContext: TenantContext,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', error: 'Missing access token' });
    }

    let claims;
    try {
      claims = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', error: 'Invalid or expired token' });
    }

    const effective = await this.permissions.getEffectivePermissions(claims.sub);
    const permissionSet =
      effective === ALL_PERMISSIONS ? new Set<string>(['*']) : effective;

    (req as Request & { user: unknown }).user = {
      userId: claims.sub,
      tenantId: claims.tenant_id,
      scope: claims.scope,
      roles: claims.roles,
    };

    this.tenantContext.patch({
      tenantId: claims.tenant_id,
      userId: claims.sub,
      scope: claims.scope,
      permissions: permissionSet,
    });

    return true;
  }

  private extractToken(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (!header) return undefined;
    const [type, value] = header.split(' ');
    return type === 'Bearer' ? value : undefined;
  }
}
