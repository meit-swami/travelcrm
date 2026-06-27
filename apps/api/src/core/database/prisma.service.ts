import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenancy/tenant-context';

/**
 * Tenant-scoped Prisma client extension. The array-form `$transaction` runs the
 * `set_config` and the actual query in a SINGLE transaction on ONE connection,
 * so the (LOCAL) `app.current_tenant` setting applies to the query and RLS is
 * enforced. This is the Prisma-recommended pattern for PostgreSQL RLS.
 */
function tenantExtension(base: PrismaClient, tenantId: string) {
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await base.$transaction([
            base.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

type TenantClient = ReturnType<typeof tenantExtension>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly tenantClients = new Map<string, TenantClient>();

  constructor(private readonly tenantContext: TenantContext) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * The client to use for data access. When a tenant is present on the request
   * context, returns an RLS-scoped client; otherwise the raw client (used only
   * by unauthenticated/bootstrap paths such as login and webhooks).
   */
  get db(): PrismaClient | TenantClient {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) return this;
    return this.forTenant(tenantId);
  }

  /** Explicit tenant-scoped client (memoized per tenant). */
  forTenant(tenantId: string): TenantClient {
    let client = this.tenantClients.get(tenantId);
    if (!client) {
      client = tenantExtension(this, tenantId);
      this.tenantClients.set(tenantId, client);
    }
    return client;
  }

  /**
   * Raw, UNSCOPED client — bypasses the tenant RLS wrapper. Use only for
   * cross-tenant platform operations (super-admin tooling) or pre-auth flows.
   */
  get unscoped(): PrismaClient {
    return this;
  }
}
