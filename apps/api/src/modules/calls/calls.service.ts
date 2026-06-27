import { Injectable } from '@nestjs/common';
import type { $Enums } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import type { LogCallDto } from './dto/calls.dto';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  list(leadId?: string) {
    return this.prisma.db.call.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async log(dto: LogCallDto) {
    const call = await this.prisma.db.call.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId: dto.leadId,
        provider: (dto.provider as $Enums.CallProvider) ?? 'manual',
        direction: dto.direction as $Enums.CallDirection,
        fromNumber: dto.fromNumber,
        toNumber: dto.toNumber,
        agentUserId: this.ctx.userId,
        status: (dto.status as $Enums.CallStatus) ?? 'completed',
        durationSec: dto.durationSec ?? 0,
        notes: dto.notes,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
      },
    });
    if (dto.leadId) {
      await this.prisma.db.leadActivity.create({
        data: {
          tenantId: this.ctx.tenantId!,
          leadId: dto.leadId,
          type: 'call',
          title: `Call ${dto.direction} (${dto.durationSec ?? 0}s)`,
          body: dto.notes,
          actorUserId: this.ctx.userId,
        },
      });
    }
    return call;
  }

  get(id: string) {
    return this.prisma.db.call.findFirst({ where: { id } });
  }
}
