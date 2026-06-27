import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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

/**
 * Two connections back this service to make RLS isolation real:
 *
 *  - The **app connection** (`this`, from APP_DATABASE_URL) uses a NON-superuser,
 *    NOBYPASSRLS role. All request data access (`db` / `forTenant`) goes through
 *    it, so PostgreSQL RLS policies are enforced at the database — a superuser
 *    would bypass them, which is why this connection must NOT be a superuser.
 *
 *  - The **system connection** (`systemClient`, from DATABASE_URL) uses a
 *    privileged role and is exposed as `unscoped` for genuinely cross-tenant
 *    work (login lookups, webhook tenant resolution, audit writes, seed).
 *
 * In dev, if APP_DATABASE_URL is unset both fall back to DATABASE_URL and a
 * warning is logged — functional, but DB-level isolation then depends on the
 * single role being non-superuser (see prisma/roles.sql + deployment docs).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly tenantClients = new Map<string, TenantClient>();
  private readonly systemClient: PrismaClient;
  private readonly splitConnections: boolean;

  constructor(private readonly tenantContext: TenantContext) {
    const appUrl = process.env.APP_DATABASE_URL;
    super(appUrl ? { datasourceUrl: appUrl } : {});
    this.splitConnections = Boolean(appUrl && appUrl !== process.env.DATABASE_URL);
    this.systemClient = this.splitConnections
      ? new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
      : this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (this.splitConnections) await this.systemClient.$connect();
    else {
      this.logger.warn(
        'APP_DATABASE_URL not set — app and system queries share one connection. ' +
          'Set APP_DATABASE_URL to a NOBYPASSRLS role in production for DB-enforced isolation.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (this.splitConnections) await this.systemClient.$disconnect();
  }

  /**
   * Data access for the current request. With a tenant on the context it returns
   * an RLS-scoped client (app connection); otherwise the raw app client.
   */
  get db(): PrismaClient | TenantClient {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) return this;
    return this.forTenant(tenantId);
  }

  /** Explicit tenant-scoped client (memoized per tenant) on the app connection. */
  forTenant(tenantId: string): TenantClient {
    let client = this.tenantClients.get(tenantId);
    if (!client) {
      client = tenantExtension(this, tenantId);
      this.tenantClients.set(tenantId, client);
    }
    return client;
  }

  /**
   * Privileged, cross-tenant client (system connection). Use ONLY for pre-auth
   * flows, webhook tenant resolution, audit writes and seeds — never for normal
   * tenant request data.
   */
  get unscoped(): PrismaClient {
    return this.systemClient;
  }
}
