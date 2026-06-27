import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AI_PROVIDER, type AiProvider } from '../../integrations/ai/ai.types';
import { ReportsService } from './reports.service';

/**
 * Management insights (Module 16): aggregates business signals (loss reasons,
 * top destinations, conversion, quote rejections) and asks the AI provider for
 * a narrative + recommendations, persisted as an mgmt_insight.
 */
@Injectable()
export class AiAnalyticsService {
  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly reports: ReportsService,
  ) {}

  private get db() {
    return this.prisma.forTenant(this.ctx.tenantId!);
  }

  /** Aggregate the signals the narrative is built from. */
  async signals() {
    const lostRows = await this.db.lead.groupBy({
      by: ['lostReasonId'],
      where: { deletedAt: null, status: 'lost', lostReasonId: { not: null } },
      _count: { _all: true },
    });
    const reasons = await this.db.lostReason.findMany({ select: { id: true, label: true } });
    const labelById = new Map(reasons.map((r) => [r.id, r.label]));
    const lossReasons = lostRows
      .map((r) => ({ reason: labelById.get(r.lostReasonId!) ?? 'Unknown', count: r._count._all }))
      .sort((a, b) => b.count - a.count);

    const rejectionRows = await this.db.quotation.findMany({
      where: { status: 'rejected', rejectionReason: { not: null } },
      select: { rejectionReason: true },
      take: 200,
    });

    const [conversion, revenue] = await Promise.all([
      this.reports.conversion(),
      this.reports.revenue('destination'),
    ]);

    return {
      lossReasons,
      quoteRejections: rejectionRows.map((r) => r.rejectionReason).filter(Boolean),
      conversion,
      topDestinations: revenue.slice(0, 5),
    };
  }

  async generateInsights() {
    const signals = await this.signals();
    const result = await this.provider.complete({
      system: 'You are a travel-business analyst. Give concise, actionable management insights.',
      prompt:
        'Based on this data, summarize why leads/quotations are lost, the top converting destinations, ' +
        'and 3 concrete recommendations.\n\n' +
        JSON.stringify(signals, null, 2),
    });

    const insight = await this.db.aiInsight.create({
      data: {
        tenantId: this.ctx.tenantId!,
        kind: 'mgmt_insight',
        model: this.provider.name,
        inputRef: signals as unknown as Prisma.InputJsonValue,
        output: { narrative: result.text } as Prisma.InputJsonValue,
      },
    });
    return { narrative: result.text, signals, insightId: insight.id };
  }

  latest() {
    return this.db.aiInsight.findMany({
      where: { kind: 'mgmt_insight' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
