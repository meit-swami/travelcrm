import { Injectable, NotFoundException } from '@nestjs/common';
import type { $Enums } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import type { AddOperationTaskDto, AdvanceStageDto } from './dto/operations.dto';

/** Default checklist seeded when a booking enters operations. */
const INITIAL_TASKS: { stage: $Enums.OpsStage; title: string }[] = [
  { stage: 'hotel_procurement', title: 'Procure hotel(s)' },
  { stage: 'transport_procurement', title: 'Arrange transport' },
  { stage: 'voucher_generation', title: 'Generate vouchers' },
  { stage: 'final_itinerary', title: 'Finalize itinerary' },
  { stage: 'delivered', title: 'Deliver to customer' },
];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
    private readonly refCodes: ReferenceCodeService,
  ) {}

  /** Create the operations booking when a quotation is accepted (sales → ops). */
  async createFromQuotation(quotationId: string) {
    const tenantId = this.ctx.tenantId!;
    const quotation = await this.prisma.db.quotation.findFirst({
      where: { id: quotationId },
      include: { lead: true },
    });
    if (!quotation) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Quotation not found' });

    const existing = await this.prisma.db.booking.findFirst({ where: { quotationId } });
    if (existing) return existing;

    const referenceCode = await this.refCodes.next('BK', tenantId, new Date().getFullYear(), () =>
      this.prisma.db.booking.count(),
    );

    const booking = await this.prisma.db.booking.create({
      data: {
        tenantId,
        leadId: quotation.leadId,
        quotationId,
        referenceCode,
        destination: quotation.lead.destination,
        travelStart: quotation.lead.travelDate,
        travelEnd: quotation.lead.returnDate,
        paxAdults: quotation.lead.adults,
        paxChildren: quotation.lead.children,
        totalValue: quotation.totalAmount,
        currency: quotation.currency,
        operationTasks: { create: INITIAL_TASKS.map((t) => ({ tenantId, ...t })) },
      },
    });
    await this.audit.record({ action: 'created', resourceType: 'booking', resourceId: booking.id });
    return booking;
  }

  list() {
    return this.prisma.db.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { lead: { select: { id: true, name: true } } },
    });
  }

  async get(id: string) {
    const booking = await this.prisma.db.booking.findFirst({
      where: { id },
      include: {
        operationTasks: { orderBy: { createdAt: 'asc' } },
        hotelBookings: true,
        transportBookings: true,
        vouchers: true,
        invoices: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        lead: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!booking) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Booking not found' });
    return booking;
  }

  async advanceStage(id: string, dto: AdvanceStageDto) {
    await this.get(id);
    const booking = await this.prisma.db.booking.update({
      where: { id },
      data: { opsStage: dto.stage as $Enums.OpsStage },
    });
    await this.audit.record({
      action: 'status_changed',
      resourceType: 'booking',
      resourceId: id,
      after: { opsStage: dto.stage },
    });
    return booking;
  }

  async handover(id: string, opsOwnerUserId: string) {
    await this.get(id);
    return this.prisma.db.booking.update({
      where: { id },
      data: { opsOwnerUserId, handoverAt: new Date() },
    });
  }

  // ─────────────────────────── Operation tasks ───────────────────────────

  listTasks(bookingId: string) {
    return this.prisma.db.operationTask.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  addTask(bookingId: string, dto: AddOperationTaskDto) {
    return this.prisma.db.operationTask.create({
      data: {
        tenantId: this.ctx.tenantId!,
        bookingId,
        stage: dto.stage as $Enums.OpsStage,
        title: dto.title,
        assigneeUserId: dto.assigneeUserId,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
    });
  }

  completeTask(taskId: string) {
    return this.prisma.db.operationTask.update({
      where: { id: taskId },
      data: { status: 'done', completedAt: new Date() },
    });
  }
}
