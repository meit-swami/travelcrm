import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { StorageService } from '../../core/storage/storage.service';

/** Read-only data access for a logged-in customer, scoped to their lead. */
@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async identity(identityId: string) {
    const id = await this.prisma.db.portalIdentity.findFirst({ where: { id: identityId } });
    if (!id) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Identity not found' });
    return id;
  }

  private async bookingIds(leadId: string): Promise<string[]> {
    const bookings = await this.prisma.db.booking.findMany({ where: { leadId }, select: { id: true } });
    return bookings.map((b) => b.id);
  }

  async me(identityId: string) {
    const identity = await this.identity(identityId);
    const lead = identity.leadId
      ? await this.prisma.db.lead.findFirst({
          where: { id: identity.leadId },
          select: { id: true, name: true, destination: true, travelDate: true, stage: true },
        })
      : null;
    return { phone: identity.phone, email: identity.email, lead };
  }

  async quotations(identityId: string) {
    const identity = await this.identity(identityId);
    if (!identity.leadId) return [];
    return this.prisma.db.quotation.findMany({
      where: { leadId: identity.leadId, status: { in: ['sent', 'viewed', 'accepted'] } },
      select: { id: true, referenceCode: true, title: true, status: true, totalAmount: true, currency: true, sentAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async itinerary(identityId: string) {
    const identity = await this.identity(identityId);
    if (!identity.leadId) return [];
    return this.prisma.db.itinerary.findMany({
      where: { leadId: identity.leadId },
      include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } },
    });
  }

  async invoices(identityId: string) {
    const identity = await this.identity(identityId);
    if (!identity.leadId) return [];
    const ids = await this.bookingIds(identity.leadId);
    return this.prisma.db.invoice.findMany({
      where: { bookingId: { in: ids } },
      select: { id: true, invoiceNo: true, status: true, total: true, amountPaid: true, currency: true, dueDate: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async payments(identityId: string) {
    const identity = await this.identity(identityId);
    if (!identity.leadId) return [];
    const ids = await this.bookingIds(identity.leadId);
    return this.prisma.db.payment.findMany({
      where: { bookingId: { in: ids } },
      select: { id: true, type: true, amount: true, currency: true, status: true, paidAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async vouchers(identityId: string) {
    const identity = await this.identity(identityId);
    if (!identity.leadId) return [];
    const ids = await this.bookingIds(identity.leadId);
    return this.prisma.db.voucher.findMany({
      where: { bookingId: { in: ids }, status: { in: ['generated', 'sent'] } },
      select: { id: true, type: true, referenceCode: true, status: true, generatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Signed download for a voucher the customer owns. */
  async download(identityId: string, voucherId: string): Promise<{ url: string }> {
    const identity = await this.identity(identityId);
    if (!identity.leadId) throw new NotFoundException({ code: 'NOT_FOUND', error: 'No file' });
    const ids = await this.bookingIds(identity.leadId);
    const voucher = await this.prisma.db.voucher.findFirst({
      where: { id: voucherId, bookingId: { in: ids } },
    });
    if (!voucher?.pdfFileId) throw new NotFoundException({ code: 'NOT_FOUND', error: 'File not available' });
    const file = await this.prisma.db.file.findFirst({ where: { id: voucher.pdfFileId } });
    if (!file) throw new NotFoundException({ code: 'NOT_FOUND', error: 'File missing' });
    return { url: await this.storage.getDownloadUrl(file.objectKey) };
  }
}
