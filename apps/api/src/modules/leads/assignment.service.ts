import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

export interface AssignmentResult {
  assignedUserId?: string;
  assignedTeamId?: string;
  ruleId?: string;
}

interface LeadLike {
  destination?: string | null;
  budgetAmount?: unknown;
}

/**
 * Resolves lead assignment from tenant-configured rules (ordered by priority).
 * Supports round-robin, team, destination, load-balanced and manual strategies.
 */
@Injectable()
export class AssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(lead: LeadLike): Promise<AssignmentResult> {
    const rules = await this.prisma.db.assignmentRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
      include: { state: true },
    });

    for (const rule of rules) {
      if (!this.matches(rule.conditions as Record<string, unknown>, lead)) continue;

      switch (rule.strategy) {
        case 'manual':
          return { ruleId: rule.id };

        case 'team':
          return { assignedTeamId: rule.targetTeamId ?? undefined, ruleId: rule.id };

        case 'destination':
          // Destination rules may target a team and/or a user pool.
          if (rule.targetUserIds.length) {
            return {
              assignedUserId: await this.roundRobin(rule.id, rule.targetUserIds, rule.state?.lastUserId),
              assignedTeamId: rule.targetTeamId ?? undefined,
              ruleId: rule.id,
            };
          }
          return { assignedTeamId: rule.targetTeamId ?? undefined, ruleId: rule.id };

        case 'round_robin':
          if (!rule.targetUserIds.length) continue;
          return {
            assignedUserId: await this.roundRobin(rule.id, rule.targetUserIds, rule.state?.lastUserId),
            assignedTeamId: rule.targetTeamId ?? undefined,
            ruleId: rule.id,
          };

        case 'load_balanced':
          if (!rule.targetUserIds.length) continue;
          return {
            assignedUserId: await this.leastLoaded(rule.targetUserIds),
            assignedTeamId: rule.targetTeamId ?? undefined,
            ruleId: rule.id,
          };
      }
    }

    return {};
  }

  /** Evaluate a rule's conditions against the lead (destination / budget bounds). */
  private matches(conditions: Record<string, unknown>, lead: LeadLike): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    const destinations = conditions.destinations as string[] | undefined;
    if (destinations?.length) {
      const dest = (lead.destination ?? '').toLowerCase();
      if (!destinations.some((d) => d.toLowerCase() === dest)) return false;
    }

    const minBudget = conditions.minBudget as number | undefined;
    if (minBudget != null) {
      const budget = Number(lead.budgetAmount ?? 0);
      if (budget < minBudget) return false;
    }

    return true;
  }

  /** Advance the round-robin cursor and persist it. */
  private async roundRobin(
    ruleId: string,
    pool: string[],
    lastUserId?: string | null,
  ): Promise<string> {
    const lastIndex = lastUserId ? pool.indexOf(lastUserId) : -1;
    const next = pool[(lastIndex + 1) % pool.length];
    await this.prisma.db.assignmentRuleState.upsert({
      where: { ruleId },
      update: { lastUserId: next },
      create: { ruleId, lastUserId: next },
    });
    return next;
  }

  /** Pick the user in the pool with the fewest open leads. */
  private async leastLoaded(pool: string[]): Promise<string> {
    const loads = await Promise.all(
      pool.map(async (userId) => ({
        userId,
        count: await this.prisma.db.lead.count({
          where: { assignedUserId: userId, status: 'open', deletedAt: null },
        }),
      })),
    );
    return loads.sort((a, b) => a.count - b.count)[0].userId;
  }
}
