import { Injectable } from '@nestjs/common';
import type { $Enums, Prisma } from '@prisma/client';
import { randomToken } from '../../core/common/crypto.util';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import type { CreateAssignmentRuleDto, CreateSourceDto } from './dto/sources.dto';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
  ) {}

  listSources() {
    return this.prisma.db.leadSource.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createSource(dto: CreateSourceDto) {
    const source = await this.prisma.db.leadSource.create({
      data: {
        tenantId: this.ctx.tenantId!,
        type: dto.type as $Enums.LeadSourceType,
        name: dto.name,
        config: (dto.config as Prisma.InputJsonValue) ?? {},
        secret: dto.requireSecret ? randomToken(24) : null,
      },
    });
    await this.audit.record({ action: 'created', resourceType: 'lead_source', resourceId: source.id });
    return source;
  }

  listRules() {
    return this.prisma.db.assignmentRule.findMany({ orderBy: { priority: 'asc' }, include: { state: true } });
  }

  async createRule(dto: CreateAssignmentRuleDto) {
    const rule = await this.prisma.db.assignmentRule.create({
      data: {
        tenantId: this.ctx.tenantId!,
        name: dto.name,
        strategy: dto.strategy as $Enums.AssignmentStrategy,
        conditions: (dto.conditions as Prisma.InputJsonValue) ?? {},
        targetTeamId: dto.targetTeamId,
        targetUserIds: dto.targetUserIds ?? [],
        priority: dto.priority ?? 100,
      },
    });
    await this.audit.record({ action: 'created', resourceType: 'assignment_rule', resourceId: rule.id });
    return rule;
  }
}
