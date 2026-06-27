import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declares the permission(s) required to call a route, e.g. `@Can('lead.create')`.
 * Multiple keys are AND-combined (user must hold all).
 */
export const Can = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
