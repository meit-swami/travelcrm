import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { PaymentGateway } from '../../integrations/payments/payment.gateway';
import type { CreateInvoiceDto, RecordPaymentDto } from './dto/payments.dto';

interface InvoiceLine {
  description: string;
  amount: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
    private readonly refCodes: ReferenceCodeService,
    private readonly gateway: PaymentGateway,
    private readonly events: EventEmitter2,
  ) {}

  // ─────────────────────────────── Invoices ───────────────────────────────

  listInvoices(bookingId: string) {
    return this.prisma.db.invoice.findMany({ where: { bookingId }, orderBy: { createdAt: 'desc' } });
  }

  async createInvoice(bookingId: string, dto: CreateInvoiceDto) {
    const tenantId = this.ctx.tenantId!;
    const lines = (dto.lineItems ?? []) as InvoiceLine[];
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const total = Math.max(0, subtotal + (dto.tax ?? 0) - (dto.discount ?? 0));
    const invoiceNo = await this.refCodes.next('INV', tenantId, new Date().getFullYear(), () =>
      this.prisma.db.invoice.count(),
    );

    const invoice = await this.prisma.db.invoice.create({
      data: {
        tenantId,
        bookingId,
        invoiceNo,
        status: 'issued',
        subtotal,
        tax: dto.tax ?? 0,
        discount: dto.discount ?? 0,
        total,
        currency: dto.currency ?? 'INR',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        lineItems: lines as unknown as Prisma.InputJsonValue,
        issuedAt: new Date(),
      },
    });
    await this.audit.record({ action: 'created', resourceType: 'invoice', resourceId: invoice.id });
    this.events.emit('invoice.generated', { tenantId, leadId: undefined });
    return invoice;
  }

  // ─────────────────────────────── Payments ───────────────────────────────

  listPayments(bookingId: string) {
    return this.prisma.db.payment.findMany({ where: { bookingId }, orderBy: { createdAt: 'desc' } });
  }

  /** Record a manual / cash / bank payment (no gateway round-trip). */
  async recordPayment(bookingId: string, dto: RecordPaymentDto) {
    const tenantId = this.ctx.tenantId!;
    const payment = await this.prisma.db.payment.create({
      data: {
        tenantId,
        bookingId,
        invoiceId: dto.invoiceId,
        type: (dto.type as $Enums.PaymentType) ?? 'advance',
        amount: dto.amount,
        currency: dto.currency ?? 'INR',
        status: 'paid',
        gateway: (dto.gateway as $Enums.PaymentGateway) ?? 'manual',
        method: dto.method,
        paidAt: new Date(),
      },
    });
    await this.reconcileInvoice(dto.invoiceId);
    await this.audit.record({ action: 'payment_updated', resourceType: 'payment', resourceId: payment.id, after: { status: 'paid' } });
    await this.emitPaymentReceived(bookingId, Number(dto.amount), dto.currency ?? 'INR');
    return payment;
  }

  /** Create a gateway order for an online payment; client completes checkout. */
  async createGatewayOrder(bookingId: string, dto: RecordPaymentDto) {
    const tenantId = this.ctx.tenantId!;
    const order = await this.gateway.createOrder({
      amount: Number(dto.amount),
      currency: dto.currency ?? 'INR',
      reference: `${bookingId}-${Date.now()}`,
    });
    const payment = await this.prisma.db.payment.create({
      data: {
        tenantId,
        bookingId,
        invoiceId: dto.invoiceId,
        type: (dto.type as $Enums.PaymentType) ?? 'advance',
        amount: dto.amount,
        currency: dto.currency ?? 'INR',
        status: 'pending',
        gateway: order.gateway as $Enums.PaymentGateway,
        gatewayOrderId: order.orderId,
      },
    });
    return { payment, order };
  }

  /** Apply a verified gateway webhook: mark the matching payment paid. */
  async applyGatewayPayment(gateway: string, orderId: string, gatewayPaymentId: string): Promise<void> {
    const payment = await this.prisma.unscoped.payment.findFirst({ where: { gatewayOrderId: orderId } });
    if (!payment) return;
    await this.prisma.unscoped.payment.update({
      where: { id: payment.id },
      data: { status: 'paid', gatewayPaymentId, paidAt: new Date() },
    });
    await this.reconcileInvoice(payment.invoiceId, payment.tenantId);
    await this.emitPaymentReceived(payment.bookingId, Number(payment.amount), payment.currency, payment.tenantId);
    void gateway;
  }

  async refund(paymentId: string) {
    const payment = await this.prisma.db.payment.findFirst({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Payment not found' });
    const updated = await this.prisma.db.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' },
    });
    await this.audit.record({ action: 'payment_updated', resourceType: 'payment', resourceId: paymentId, after: { status: 'refunded' } });
    return updated;
  }

  // ─────────────────────────────── Helpers ───────────────────────────────

  private async reconcileInvoice(invoiceId?: string | null, tenantId?: string) {
    if (!invoiceId) return;
    const client = tenantId ? this.prisma.unscoped : this.prisma.db;
    const invoice = await client.invoice.findFirst({ where: { id: invoiceId } });
    if (!invoice) return;
    const paidAgg = await client.payment.findMany({
      where: { invoiceId, status: 'paid' },
      select: { amount: true },
    });
    const paid = paidAgg.reduce((s, p) => s + Number(p.amount), 0);
    const status: $Enums.InvoiceStatus = paid >= Number(invoice.total) ? 'paid' : paid > 0 ? 'partially_paid' : invoice.status;
    await client.invoice.update({ where: { id: invoiceId }, data: { amountPaid: paid, status } });
  }

  private async emitPaymentReceived(bookingId: string, amount: number, currency: string, tenantId?: string) {
    const client = tenantId ? this.prisma.unscoped : this.prisma.db;
    const booking = await client.booking.findFirst({
      where: { id: bookingId },
      include: { lead: { select: { email: true, name: true } } },
    });
    if (booking?.lead?.email) {
      this.events.emit('payment.received', {
        tenantId: tenantId ?? this.ctx.tenantId,
        to: booking.lead.email,
        leadId: booking.leadId,
        variables: { customerName: booking.lead.name, amount: String(amount), currency },
      });
    }
  }
}
