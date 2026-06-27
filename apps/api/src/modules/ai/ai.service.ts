import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AI_PROVIDER, type AiProvider } from '../../integrations/ai/ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  /** Assemble a text context for the lead from its profile, notes and activity. */
  private async gatherContext(leadId: string): Promise<{ lead: { id: string; name: string; email: string | null; phone: string | null; destination: string | null }; text: string }> {
    const lead = await this.prisma.db.lead.findFirst({
      where: { id: leadId, deletedAt: null },
      include: {
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
        activities: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
    if (!lead) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Lead not found' });

    const lines = [
      `Lead: ${lead.name} (${lead.phone ?? 'no phone'}, ${lead.email ?? 'no email'})`,
      `Destination: ${lead.destination ?? 'unknown'} | Travel date: ${lead.travelDate?.toISOString().slice(0, 10) ?? 'unknown'}`,
      `Pax: ${lead.adults} adults, ${lead.children} children | Budget: ${lead.budgetAmount ?? 'unknown'} ${lead.budgetCurrency}`,
      `Stage: ${lead.stage} | Special requests: ${lead.specialRequests ?? 'none'}`,
      '',
      'Notes:',
      ...lead.notes.map((n) => `- ${n.body}`),
      '',
      'Recent activity:',
      ...lead.activities.map((a) => `- [${a.type}] ${a.title}${a.body ? `: ${a.body}` : ''}`),
    ];
    return { lead, text: lines.join('\n') };
  }

  private async runJob<T>(kind: string, fn: () => Promise<{ result: T; promptTokens: number; completionTokens: number; model: string }>): Promise<T> {
    const start = Date.now();
    try {
      const { result, promptTokens, completionTokens, model } = await fn();
      await this.prisma.unscoped.aiJob.create({
        data: {
          tenantId: this.ctx.tenantId!,
          kind,
          provider: this.provider.name,
          promptTokens,
          completionTokens,
          latencyMs: Date.now() - start,
          status: 'ok',
        },
      });
      void model;
      return result;
    } catch (err) {
      await this.prisma.unscoped.aiJob.create({
        data: {
          tenantId: this.ctx.tenantId!,
          kind,
          provider: this.provider.name,
          latencyMs: Date.now() - start,
          status: 'error',
          error: (err as Error).message,
        },
      });
      throw err;
    }
  }

  async summarizeLead(leadId: string) {
    const { text } = await this.gatherContext(leadId);
    const summary = await this.runJob('lead_summary', async () => {
      const r = await this.provider.complete({
        system: 'You are a travel CRM assistant. Summarize the lead concisely for a sales rep.',
        prompt: `Summarize this lead in 3-4 sentences:\n\n${text}`,
      });
      return { result: r.text, promptTokens: r.promptTokens, completionTokens: r.completionTokens, model: r.model };
    });

    const insight = await this.prisma.db.aiInsight.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId,
        kind: 'lead_summary',
        model: this.provider.name,
        output: { summary } as Prisma.InputJsonValue,
      },
    });
    await this.leadActivity(leadId, 'AI summary generated', summary.slice(0, 200));
    return insight;
  }

  async extractRequirements(leadId: string) {
    const { text } = await this.gatherContext(leadId);
    const raw = await this.runJob('requirement_extract', async () => {
      const r = await this.provider.complete({
        system: 'Extract structured travel requirements as strict JSON.',
        prompt: `From the lead below, extract a JSON object with keys: destination, travelDate, budget, adults, children, hotelPreference, flightRequired, specialRequests. Use null when unknown.\n\n${text}`,
        json: true,
      });
      return { result: r.text, promptTokens: r.promptTokens, completionTokens: r.completionTokens, model: r.model };
    });

    const parsed = this.safeJson(raw) as Record<string, unknown>;
    const insight = await this.prisma.db.aiInsight.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId,
        kind: 'requirement_extract',
        model: this.provider.name,
        output: parsed as Prisma.InputJsonValue,
      },
    });
    await this.prisma.db.aiExtractedRequirement.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId,
        destination: this.str(parsed.destination),
        travelDate: this.str(parsed.travelDate),
        budget: this.str(parsed.budget),
        adults: this.num(parsed.adults),
        children: this.num(parsed.children),
        hotelPreference: this.str(parsed.hotelPreference),
        flightRequired: typeof parsed.flightRequired === 'boolean' ? parsed.flightRequired : null,
        specialRequests: this.str(parsed.specialRequests),
        sourceInsightId: insight.id,
      },
    });
    return { insight, requirements: parsed };
  }

  async scoreLead(leadId: string) {
    const { text } = await this.gatherContext(leadId);
    const raw = await this.runJob('conversion_score', async () => {
      const r = await this.provider.complete({
        system: 'You score travel leads. Respond with strict JSON.',
        prompt: `Estimate conversion probability for this lead. Return JSON {"score": 0-100, "hot": boolean, "rationale": string}.\n\n${text}`,
        json: true,
      });
      return { result: r.text, promptTokens: r.promptTokens, completionTokens: r.completionTokens, model: r.model };
    });

    const parsed = this.safeJson(raw) as { score?: number; hot?: boolean; rationale?: string };
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
    const hot = Boolean(parsed.hot) || score >= 80;

    await this.prisma.db.lead.update({
      where: { id: leadId },
      data: { score, ...(hot ? { priority: 'hot' } : {}) },
    });
    const insight = await this.prisma.db.aiInsight.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId,
        kind: 'conversion_score',
        model: this.provider.name,
        confidence: score / 100,
        output: { score, hot, rationale: parsed.rationale ?? null } as Prisma.InputJsonValue,
      },
    });
    return { score, hot, insight };
  }

  listInsights(leadId: string) {
    return this.prisma.db.aiInsight.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ─────────────────────────────── Helpers ───────────────────────────────

  private safeJson(text: string): unknown {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : text);
    } catch {
      this.logger.warn('AI returned non-JSON; defaulting to {}');
      return {};
    }
  }

  private str(v: unknown): string | null {
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  }

  private num(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private leadActivity(leadId: string, title: string, body?: string) {
    return this.prisma.db.leadActivity.create({
      data: { tenantId: this.ctx.tenantId!, leadId, type: 'ai_insight', title, body, actorUserId: this.ctx.userId },
    });
  }
}
