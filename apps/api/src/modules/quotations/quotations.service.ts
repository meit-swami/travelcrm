import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { LeadsService } from '../leads/leads.service';
import { BookingsService } from '../operations/bookings.service';
import type { AddVersionDto, CreateQuotationDto, RejectQuotationDto } from './dto/quotations.dto';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

function computeTotals(items: LineItem[], tax = 0, discount = 0) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return { subtotal, tax, discount, total: Math.max(0, subtotal + tax - discount) };
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
    private readonly refCodes: ReferenceCodeService,
    private readonly leads: LeadsService,
    private readonly events: EventEmitter2,
    private readonly bookings: BookingsService,
  ) {}

  listForLead(leadId: string) {
    return this.prisma.db.quotation.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } },
    });
  }

  async get(id: string) {
    const quotation = await this.prisma.db.quotation.findFirst({
      where: { id },
      include: { versions: { orderBy: { versionNo: 'asc' } } },
    });
    if (!quotation) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Quotation not found' });
    return quotation;
  }

  async create(leadId: string, dto: CreateQuotationDto) {
    const tenantId = this.ctx.tenantId!;
    await this.leads.get(leadId); // enforce access + existence
    const totals = computeTotals(dto.lineItems, dto.tax, dto.discount);
    const referenceCode = await this.refCodes.next('QT', tenantId, new Date().getFullYear(), () =>
      this.prisma.db.quotation.count(),
    );

    const quotation = await this.prisma.db.quotation.create({
      data: {
        tenantId,
        leadId,
        referenceCode,
        title: dto.title,
        currency: dto.currency ?? 'INR',
        totalAmount: totals.total,
        revisionCount: 1,
        createdBy: this.ctx.userId,
        versions: {
          create: {
            tenantId,
            versionNo: 1,
            lineItems: dto.lineItems as unknown as Prisma.InputJsonValue,
            subtotal: totals.subtotal,
            tax: totals.tax,
            discount: totals.discount,
            total: totals.total,
            currency: dto.currency ?? 'INR',
            notes: dto.notes,
            createdBy: this.ctx.userId,
          },
        },
      },
      include: { versions: true },
    });

    await this.prisma.db.quotation.update({
      where: { id: quotation.id },
      data: { currentVersionId: quotation.versions[0].id },
    });
    await this.leadActivity(leadId, `Quotation ${referenceCode} created`);
    await this.audit.record({ action: 'created', resourceType: 'quotation', resourceId: quotation.id });
    return quotation;
  }

  async addVersion(id: string, dto: AddVersionDto) {
    const quotation = await this.get(id);
    const totals = computeTotals(dto.lineItems, dto.tax, dto.discount);
    const versionNo = quotation.revisionCount + 1;

    const version = await this.prisma.db.quotationVersion.create({
      data: {
        tenantId: quotation.tenantId,
        quotationId: id,
        versionNo,
        lineItems: dto.lineItems as unknown as Prisma.InputJsonValue,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        currency: quotation.currency,
        notes: dto.notes,
        createdBy: this.ctx.userId,
      },
    });

    await this.prisma.db.quotation.update({
      where: { id },
      data: {
        currentVersionId: version.id,
        revisionCount: versionNo,
        totalAmount: totals.total,
        status: 'draft',
      },
    });
    await this.audit.record({ action: 'quotation_updated', resourceType: 'quotation', resourceId: id });
    return version;
  }

  async send(id: string) {
    const q = await this.get(id);
    if (q.status === 'accepted') {
      throw new BadRequestException({ code: 'INVALID_STATE', error: 'Quotation already accepted' });
    }
    const updated = await this.prisma.db.quotation.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
    await this.leadActivity(q.leadId, `Quotation ${q.referenceCode} sent`);
    await this.audit.record({ action: 'quotation_updated', resourceType: 'quotation', resourceId: id, after: { status: 'sent' } });

    // Fire the automation trigger (email rules listen on this event).
    const lead = await this.prisma.db.lead.findUnique({
      where: { id: q.leadId },
      select: { email: true, name: true },
    });
    if (lead?.email) {
      this.events.emit('quotation.sent', {
        tenantId: q.tenantId,
        to: lead.email,
        leadId: q.leadId,
        variables: {
          customerName: lead.name,
          quotationRef: q.referenceCode,
          amount: q.totalAmount.toString(),
          currency: q.currency,
        },
      });
    }
    return updated;
  }

  async markViewed(id: string) {
    const q = await this.get(id);
    if (q.status === 'sent') {
      return this.prisma.db.quotation.update({ where: { id }, data: { status: 'viewed', viewedAt: new Date() } });
    }
    return q;
  }

  async accept(id: string) {
    const q = await this.get(id);
    const updated = await this.prisma.db.quotation.update({
      where: { id },
      data: { status: 'accepted', decidedAt: new Date() },
    });
    // Won: move the lead to confirmed and create the operations booking (handover).
    await this.leads.transitionStage(q.leadId, { stage: 'confirmed' });
    await this.bookings.createFromQuotation(id);
    await this.leadActivity(q.leadId, `Quotation ${q.referenceCode} accepted`);
    await this.audit.record({ action: 'quotation_updated', resourceType: 'quotation', resourceId: id, after: { status: 'accepted' } });
    return updated;
  }

  async reject(id: string, dto: RejectQuotationDto) {
    const q = await this.get(id);
    const updated = await this.prisma.db.quotation.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: dto.reason, decidedAt: new Date() },
    });
    await this.leadActivity(q.leadId, `Quotation ${q.referenceCode} rejected: ${dto.reason}`);
    await this.audit.record({ action: 'quotation_updated', resourceType: 'quotation', resourceId: id, after: { status: 'rejected' } });
    return updated;
  }

  private leadActivity(leadId: string, title: string) {
    return this.prisma.db.leadActivity.create({
      data: {
        tenantId: this.ctx.tenantId!,
        leadId,
        type: 'quotation',
        title,
        actorUserId: this.ctx.userId,
      },
    });
  }
}
