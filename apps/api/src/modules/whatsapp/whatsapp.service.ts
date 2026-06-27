import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ReferenceCodeService } from '../../core/common/reference-code.service';
import { computeDedupeHash } from '../../core/common/lead.util';
import { WhatsAppProvider } from '../../integrations/messaging/whatsapp.provider';

/** Minimal shape of the WhatsApp Cloud API webhook value object. */
interface WhatsAppValue {
  metadata?: { phone_number_id?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: {
    from?: string;
    id?: string;
    type?: string;
    text?: { body?: string };
  }[];
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refCodes: ReferenceCodeService,
    private readonly provider: WhatsAppProvider,
  ) {}

  /**
   * Ingest an inbound WhatsApp webhook value (runs in the worker, system
   * context). Resolves the tenant from the WhatsApp source mapping, auto-creates
   * a lead for unknown senders, and stores the message on the conversation.
   */
  async ingestInbound(value: WhatsAppValue): Promise<void> {
    const phoneNumberId = value.metadata?.phone_number_id;
    const messages = value.messages ?? [];
    if (!phoneNumberId || messages.length === 0) return;

    // Map the business phone number → tenant via a configured WhatsApp source.
    const source = await this.prisma.unscoped.leadSource.findFirst({
      where: { type: 'whatsapp', config: { path: ['phoneNumberId'], equals: phoneNumberId } },
    });
    if (!source) {
      this.logger.warn(`No WhatsApp source mapped for phone_number_id ${phoneNumberId}`);
      return;
    }
    const tenantId = source.tenantId;
    const contactName = value.contacts?.[0]?.profile?.name;

    for (const msg of messages) {
      const from = msg.from;
      if (!from) continue;

      const lead = await this.findOrCreateLead(tenantId, from, contactName, source.id);
      const conversation = await this.upsertConversation(tenantId, from, lead.id);

      await this.prisma.unscoped.message.create({
        data: {
          tenantId,
          conversationId: conversation.id,
          direction: 'inbound',
          sender: from,
          body: msg.text?.body ?? null,
          contentType: this.contentType(msg.type),
          externalId: msg.id,
          status: 'delivered',
        },
      });
      await this.prisma.unscoped.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
      });
      await this.prisma.unscoped.leadActivity.create({
        data: {
          tenantId,
          leadId: lead.id,
          type: 'whatsapp',
          title: 'WhatsApp message received',
          body: msg.text?.body?.slice(0, 200),
        },
      });
    }
  }

  // ─────────────────────────── Outbound (request context) ───────────────────────────

  listConversations() {
    return this.prisma.db.conversation.findMany({
      where: { channel: 'whatsapp' },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: { lead: { select: { id: true, name: true } } },
    });
  }

  async listMessages(conversationId: string) {
    await this.prisma.db.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    }).catch(() => undefined);
    return this.prisma.db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async sendText(conversationId: string, body: string) {
    const conversation = await this.prisma.db.conversation.findFirst({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Conversation not found' });

    const result = await this.provider.sendText(conversation.contactHandle, body);
    const message = await this.prisma.db.message.create({
      data: {
        tenantId: conversation.tenantId,
        conversationId,
        direction: 'outbound',
        sender: 'agent',
        body,
        contentType: 'text',
        externalId: result.externalId,
        status: 'sent',
      },
    });
    await this.prisma.db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  // ─────────────────────────────── Helpers ───────────────────────────────

  private async findOrCreateLead(tenantId: string, phone: string, name: string | undefined, sourceId: string) {
    const existing = await this.prisma.unscoped.lead.findFirst({
      where: { tenantId, phone: { contains: phone.slice(-10) }, deletedAt: null },
    });
    if (existing) return existing;

    const referenceCode = await this.refCodes.next('LD', tenantId, new Date().getFullYear(), () =>
      this.prisma.unscoped.lead.count({ where: { tenantId } }),
    );
    return this.prisma.unscoped.lead.create({
      data: {
        tenantId,
        sourceId,
        referenceCode,
        name: name ?? phone,
        phone,
        dedupeHash: computeDedupeHash(phone, null),
        metadata: { channel: 'whatsapp' },
      },
    });
  }

  private async upsertConversation(tenantId: string, handle: string, leadId: string) {
    const existing = await this.prisma.unscoped.conversation.findFirst({
      where: { tenantId, channel: 'whatsapp', contactHandle: handle },
    });
    if (existing) return existing;
    return this.prisma.unscoped.conversation.create({
      data: { tenantId, channel: 'whatsapp', contactHandle: handle, leadId },
    });
  }

  private contentType(type?: string): 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' {
    switch (type) {
      case 'image':
      case 'audio':
      case 'video':
      case 'document':
      case 'location':
        return type;
      default:
        return 'text';
    }
  }
}
