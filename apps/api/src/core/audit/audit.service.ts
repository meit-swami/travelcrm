import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction, AuditActorType } from '@travelos/types';
import { PrismaService } from '../database/prisma.service';
import { TenantContext } from '../tenancy/tenant-context';

export interface AuditEntry {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  actorType?: AuditActorType;
  /** Override tenant/actor when not derivable from context (e.g. system jobs). */
  tenantId?: string;
  actorUserId?: string;
}

/**
 * Writes append-only audit entries. Pulls actor/tenant/ip/ua from the request
 * context when not explicitly provided. Failures never break the main flow.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    const ctx = this.tenantContext.get();
    const tenantId = entry.tenantId ?? ctx?.tenantId;
    if (!tenantId) {
      this.logger.warn(`Skipping audit (no tenant): ${entry.action} ${entry.resourceType}`);
      return;
    }

    try {
      await this.prisma.unscoped.auditLog.create({
        data: {
          tenantId,
          actorUserId: entry.actorUserId ?? ctx?.userId ?? null,
          actorType: entry.actorType ?? (ctx?.userId ? 'user' : 'system'),
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId ?? null,
          before: (entry.before as object) ?? undefined,
          after: (entry.after as object) ?? undefined,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }
}
