import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { TokenScope } from '@travelos/types';

export interface RequestContext {
  tenantId?: string;
  userId?: string;
  scope?: TokenScope;
  /** Effective permission keys for the current user (resolved per request). */
  permissions?: Set<string>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Holds the per-request context (tenant, user, permissions) using
 * AsyncLocalStorage so it is available anywhere in the call stack without
 * threading it through every function — including the Prisma RLS layer.
 */
@Injectable()
export class TenantContext {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(ctx: RequestContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  get(): RequestContext | undefined {
    return this.als.getStore();
  }

  get tenantId(): string | undefined {
    return this.als.getStore()?.tenantId;
  }

  get userId(): string | undefined {
    return this.als.getStore()?.userId;
  }

  get scope(): TokenScope | undefined {
    return this.als.getStore()?.scope;
  }

  /** Mutate the active context (e.g. attach resolved permissions). */
  patch(patch: Partial<RequestContext>): void {
    const store = this.als.getStore();
    if (store) Object.assign(store, patch);
  }
}
