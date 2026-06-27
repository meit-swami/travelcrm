import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './can.decorator';
import { PermissionsService } from './permissions.service';
import { TenantContext } from '../tenancy/tenant-context';

/**
 * Enforces `@Can(...)` permission requirements. Runs after AuthGuard, which has
 * already resolved and attached effective permissions to the request context.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const ctx = this.tenantContext.get();
    const perms = ctx?.permissions;
    if (!perms) throw new ForbiddenException({ code: 'FORBIDDEN', error: 'No permissions resolved' });

    const wildcard = perms.has('*');
    const ok = required.every(
      (r) => wildcard || PermissionsService.has(perms, r),
    );
    if (!ok) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        error: `Missing required permission: ${required.join(', ')}`,
      });
    }
    return true;
  }
}
