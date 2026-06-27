import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, $Enums } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { computeDedupeHash } from '../../core/common/lead.util';
import { DedupeService } from './dedupe.service';
import { AssignmentService } from './assignment.service';
import type { CreateLeadDto, ListLeadsQuery, TransitionStageDto, UpdateLeadDto } from './dto/leads.dto';

const TERMINAL_STAGES = new Set(['lost', 'cancelled']);

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
    private readonly refCodes: ReferenceCodeService,
    private readonly dedupe: DedupeService,
    private readonly assignment: AssignmentService,
  ) {}

  // ─────────────────────────────── Create ───────────────────────────────

  async create(dto: CreateLeadDto, opts?: { createdBy?: string; sourceId?: string }) {
    const tenantId = this.ctx.tenantId!;
    const year = new Date().getFullYear();

    const duplicates = await this.dedupe.findDuplicates(dto.phone, dto.email);
    const assignmentInput = { destination: dto.destination, budgetAmount: dto.budgetAmount };
    const assigned =
      dto.assignedUserId || dto.assignedTeamId
        ? { assignedUserId: dto.assignedUserId, assignedTeamId: dto.assignedTeamId }
        : await this.assignment.resolve(assignmentInput);

    const referenceCode = await this.refCodes.next('LD', tenantId, year, () =>
      this.prisma.db.lead.count(),
    );

    const lead = await this.prisma.db.lead.create({
      data: {
        tenantId,
        sourceId: opts?.sourceId ?? dto.sourceId,
        referenceCode,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        altPhone: dto.altPhone,
        destination: dto.destination,
        travelDate: dto.travelDate ? new Date(dto.travelDate) : null,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : null,
        adults: dto.adults ?? 1,
        children: dto.children ?? 0,
        budgetAmount: dto.budgetAmount,
        budgetCurrency: dto.budgetCurrency ?? 'INR',
        hotelPreference: dto.hotelPreference,
        flightRequired: dto.flightRequired,
        specialRequests: dto.specialRequests,
        assignedUserId: assigned.assignedUserId,
        assignedTeamId: assigned.assignedTeamId,
        dedupeHash: computeDedupeHash(dto.phone, dto.email),
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? {},
        createdBy: opts?.createdBy ?? this.ctx.userId,
      },
    });

    // Record detected duplicates for later review.
    if (duplicates.length) {
      await this.prisma.db.leadDedupeMatch.createMany({
        data: duplicates.map((d) => ({
          tenantId,
          leadId: lead.id,
          duplicateOfLeadId: d.leadId,
          matchType: d.matchType,
          confidence: d.confidence,
        })),
      });
    }

    await this.activity(lead.id, 'system', 'Lead created', `Source: ${dto.sourceLabel ?? 'manual'}`);
    if (assigned.assignedUserId || assigned.assignedTeamId) {
      await this.activity(lead.id, 'assignment', 'Lead assigned', undefined, {
        assignedUserId: assigned.assignedUserId,
        assignedTeamId: assigned.assignedTeamId,
      });
    }
    await this.audit.record({ action: 'created', resourceType: 'lead', resourceId: lead.id, after: lead });

    return { ...lead, duplicateCount: duplicates.length };
  }

  // ──────────────────────────────── Read ────────────────────────────────

  async list(query: ListLeadsQuery) {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...this.readScope(),
      ...(query.stage ? { stage: query.stage as $Enums.LeadStage } : {}),
      ...(query.status ? { status: query.status as $Enums.LeadStatus } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.destination ? { destination: { contains: query.destination, mode: 'insensitive' } } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { phone: { contains: query.q } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { referenceCode: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const take = Math.min(query.limit ?? 25, 100);
    const items = await this.prisma.db.lead.findMany({
      where,
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: { select: { id: true, fullName: true } },
        source: { select: { id: true, name: true, type: true } },
      },
    });

    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    return { data, pagination: { nextCursor: hasMore ? data[data.length - 1]?.id : null, limit: take } };
  }

  async get(id: string) {
    const lead = await this.prisma.db.lead.findFirst({
      where: { id, deletedAt: null, ...this.readScope() },
      include: {
        assignedUser: { select: { id: true, fullName: true, email: true } },
        assignedTeam: { select: { id: true, name: true } },
        source: { select: { id: true, name: true, type: true } },
        lostReason: true,
        leadTags: { include: { tag: true } },
      },
    });
    if (!lead) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Lead not found' });
    return lead;
  }

  timeline(leadId: string) {
    return this.prisma.db.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listDuplicates(leadId: string) {
    return this.prisma.db.leadDedupeMatch.findMany({
      where: { leadId },
      include: { duplicateOf: { select: { id: true, name: true, phone: true, stage: true } } },
    });
  }

  // ─────────────────────────────── Mutate ───────────────────────────────

  async update(id: string, dto: UpdateLeadDto) {
    await this.get(id); // enforces read scope + existence
    const lead = await this.prisma.db.lead.update({
      where: { id },
      data: {
        ...dto,
        travelDate: dto.travelDate ? new Date(dto.travelDate) : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
        ...(dto.phone || dto.email
          ? { dedupeHash: computeDedupeHash(dto.phone ?? null, dto.email ?? null) }
          : {}),
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    await this.audit.record({ action: 'updated', resourceType: 'lead', resourceId: id, after: lead });
    return lead;
  }

  async transitionStage(id: string, dto: TransitionStageDto) {
    const current = await this.get(id);
    if (TERMINAL_STAGES.has(dto.stage) && !dto.reasonId && !dto.reason) {
      throw new ForbiddenException({ code: 'REASON_REQUIRED', error: 'Lost/cancelled requires a reason' });
    }

    const status = dto.stage === 'confirmed' ? 'won' : dto.stage === 'lost' ? 'lost' : 'open';
    const lead = await this.prisma.db.lead.update({
      where: { id },
      data: {
        stage: dto.stage as $Enums.LeadStage,
        status: status as $Enums.LeadStatus,
        lostReasonId: dto.reasonId ?? null,
      },
    });

    await this.activity(
      id,
      'stage_change',
      `Stage: ${current.stage} → ${dto.stage}`,
      dto.reason,
    );
    await this.audit.record({
      action: 'status_changed',
      resourceType: 'lead',
      resourceId: id,
      before: { stage: current.stage },
      after: { stage: dto.stage },
    });
    return lead;
  }

  async assign(id: string, assignedUserId?: string, assignedTeamId?: string) {
    await this.get(id);
    const lead = await this.prisma.db.lead.update({
      where: { id },
      data: { assignedUserId: assignedUserId ?? null, assignedTeamId: assignedTeamId ?? null },
    });
    await this.activity(id, 'assignment', 'Lead reassigned', undefined, { assignedUserId, assignedTeamId });
    await this.audit.record({ action: 'assigned', resourceType: 'lead', resourceId: id, after: { assignedUserId, assignedTeamId } });
    return lead;
  }

  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.db.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({ action: 'deleted', resourceType: 'lead', resourceId: id });
    return { success: true };
  }

  // ─────────────────────────────── Notes ───────────────────────────────

  async addNote(leadId: string, body: string, isPinned = false) {
    await this.get(leadId);
    const note = await this.prisma.db.note.create({
      data: { tenantId: this.ctx.tenantId!, leadId, authorUserId: this.ctx.userId, body, isPinned },
    });
    await this.activity(leadId, 'note', 'Note added', body.slice(0, 140));
    return note;
  }

  listNotes(leadId: string) {
    return this.prisma.db.note.findMany({
      where: { leadId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  // ─────────────────────────────── Helpers ───────────────────────────────

  private activity(
    leadId: string,
    type: 'stage_change' | 'note' | 'assignment' | 'system',
    title: string,
    body?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.db.leadActivity.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId,
        type,
        title,
        body,
        actorUserId: this.ctx.userId,
        metadata: (metadata as Prisma.InputJsonValue) ?? {},
      },
    });
  }

  /**
   * Row-level read scope. Users with `lead.read` see all tenant leads; users
   * with only `lead.read_own` are limited to leads they own or created.
   */
  private readScope(): Prisma.LeadWhereInput {
    const perms = this.ctx.get()?.permissions;
    const canReadAll = !perms || perms.has('*') || perms.has('lead.read');
    if (canReadAll) return {};
    const me = this.ctx.userId;
    return { OR: [{ assignedUserId: me }, { createdBy: me }] };
  }
}
