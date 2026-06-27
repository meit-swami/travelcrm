import { Injectable, NotFoundException } from '@nestjs/common';
import type { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import type { CreateTaskDto, ListTasksQuery } from './dto/tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {}

  list(query: ListTasksQuery) {
    const where: Prisma.TaskWhereInput = {
      ...(query.mine ? { assigneeUserId: this.ctx.userId } : {}),
      ...(query.assigneeUserId ? { assigneeUserId: query.assigneeUserId } : {}),
      ...(query.status ? { status: query.status as $Enums.TaskStatus } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
    };
    return this.prisma.db.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
      take: 100,
    });
  }

  create(dto: CreateTaskDto) {
    return this.prisma.db.task.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId: dto.leadId,
        title: dto.title,
        description: dto.description,
        type: (dto.type as $Enums.TaskType) ?? 'follow_up',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        remindAt: dto.remindAt ? new Date(dto.remindAt) : null,
        assigneeUserId: dto.assigneeUserId ?? this.ctx.userId!,
      },
    });
  }

  async complete(id: string) {
    const existing = await this.prisma.db.task.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Task not found' });
    return this.prisma.db.task.update({
      where: { id },
      data: { status: 'done', completedAt: new Date() },
    });
  }
}
