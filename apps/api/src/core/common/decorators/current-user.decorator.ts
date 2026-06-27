import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TokenScope } from '@travelos/types';

export interface AuthUser {
  userId: string;
  tenantId: string;
  scope: TokenScope;
  roles: string[];
}

/** Injects the authenticated user attached to the request by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
