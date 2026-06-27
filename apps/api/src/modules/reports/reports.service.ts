import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';

/**
 * Aggregations for dashboards & reports. Uses the tenant-scoped client so every
 * query is RLS-enforced. Month bucketing is done in JS (Prisma groupBy has no
 * date-trunc), which is fine at current volumes; swap to materialized views as
 * data grows (see docs/architecture/02-database-schema.md §12).
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  private get db() {
    return this.prisma.forTenant(this.ctx.tenantId!);
  }

  async leadFunnel() {
    const rows = await this.db.lead.groupBy({
      by: ['stage'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((r) => ({ stage: r.stage, count: r._count._all }));
  }

  async conversion() {
    const [total, won, lost] = await Promise.all([
      this.db.lead.count({ where: { deletedAt: null } }),
      this.db.lead.count({ where: { deletedAt: null, status: 'won' } }),
      this.db.lead.count({ where: { deletedAt: null, status: 'lost' } }),
    ]);
    return { total, won, lost, conversionRate: total ? +(won / total * 100).toFixed(1) : 0 };
  }

  async sourcePerformance() {
    const rows = await this.db.lead.groupBy({
      by: ['sourceId', 'status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const sources = await this.db.leadSource.findMany({ select: { id: true, name: true } });
    const nameById = new Map(sources.map((s) => [s.id, s.name]));
    const acc = new Map<string, { source: string; total: number; won: number }>();
    for (const r of rows) {
      const key = r.sourceId ?? 'unknown';
      const entry = acc.get(key) ?? { source: nameById.get(key) ?? 'Unknown', total: 0, won: 0 };
      entry.total += r._count._all;
      if (r.status === 'won') entry.won += r._count._all;
      acc.set(key, entry);
    }
    return [...acc.values()];
  }

  async employeePerformance() {
    const rows = await this.db.lead.groupBy({
      by: ['assignedUserId', 'status'],
      where: { deletedAt: null, assignedUserId: { not: null } },
      _count: { _all: true },
    });
    const users = await this.db.user.findMany({ select: { id: true, fullName: true } });
    const nameById = new Map(users.map((u) => [u.id, u.fullName]));
    const acc = new Map<string, { user: string; handled: number; won: number }>();
    for (const r of rows) {
      const key = r.assignedUserId!;
      const entry = acc.get(key) ?? { user: nameById.get(key) ?? 'Unknown', handled: 0, won: 0 };
      entry.handled += r._count._all;
      if (r.status === 'won') entry.won += r._count._all;
      acc.set(key, entry);
    }
    return [...acc.values()].map((e) => ({ ...e, conversionRate: e.handled ? +(e.won / e.handled * 100).toFixed(1) : 0 }));
  }

  async revenue(groupBy: 'destination' | 'month' = 'destination') {
    const bookings = await this.db.booking.findMany({
      where: { opsStage: { not: 'cancelled' } },
      select: { destination: true, totalValue: true, createdAt: true },
    });
    const acc = new Map<string, number>();
    for (const b of bookings) {
      const key =
        groupBy === 'month'
          ? b.createdAt.toISOString().slice(0, 7)
          : (b.destination ?? 'Unknown');
      acc.set(key, (acc.get(key) ?? 0) + Number(b.totalValue));
    }
    return [...acc.entries()].map(([key, revenue]) => ({ key, revenue })).sort((a, b) => b.revenue - a.revenue);
  }

  async dashboard() {
    const [funnel, conversion, revenueByDest] = await Promise.all([
      this.leadFunnel(),
      this.conversion(),
      this.revenue('destination'),
    ]);
    return { funnel, conversion, topDestinations: revenueByDest.slice(0, 5) };
  }
}
