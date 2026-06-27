import { Injectable, Logger } from '@nestjs/common';
import type { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { EmailProvider } from '../../integrations/email/email.provider';
import type { CreateAutomationDto, UpsertTemplateDto } from './dto/email.dto';

export interface SendTemplatedEmailInput {
  tenantId: string;
  to: string;
  templateKey: string;
  variables?: Record<string, string | number>;
  leadId?: string;
}

/** Renders templates ({{var}}) and sends/logs email. Used by the queue worker. */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: EmailProvider,
    private readonly ctx: TenantContext,
  ) {}

  // ─────────────────── Template / automation management ───────────────────

  listTemplates() {
    return this.prisma.db.emailTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertTemplate(dto: UpsertTemplateDto) {
    const tenantId = this.ctx.tenantId!;
    const existing = await this.prisma.db.emailTemplate.findFirst({ where: { key: dto.key } });
    const data = {
      name: dto.name,
      subject: dto.subject,
      htmlBody: dto.htmlBody,
      variables: (dto.variables as Prisma.InputJsonValue) ?? [],
      isActive: dto.isActive ?? true,
    };
    return existing
      ? this.prisma.db.emailTemplate.update({ where: { id: existing.id }, data })
      : this.prisma.db.emailTemplate.create({ data: { tenantId, key: dto.key, ...data } });
  }

  listAutomations() {
    return this.prisma.db.automation.findMany({ orderBy: { triggerEvent: 'asc' } });
  }

  createAutomation(dto: CreateAutomationDto) {
    return this.prisma.db.automation.create({
      data: {
        tenantId: this.ctx.tenantId!,
        triggerEvent: dto.triggerEvent as $Enums.AutomationTrigger,
        templateKey: dto.templateKey,
        delayMinutes: dto.delayMinutes ?? 0,
        conditions: (dto.conditions as Prisma.InputJsonValue) ?? {},
      },
    });
  }

  listLogs() {
    return this.prisma.db.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  private render(text: string, vars: Record<string, string | number> = {}): string {
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(vars[key] ?? ''));
  }

  /** Send a templated email and record it in email_log (tenant-scoped, unscoped client). */
  async sendTemplated(input: SendTemplatedEmailInput): Promise<void> {
    const template = await this.prisma.unscoped.emailTemplate.findUnique({
      where: { tenantId_key: { tenantId: input.tenantId, key: input.templateKey } },
    });

    const log = await this.prisma.unscoped.emailLog.create({
      data: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        templateKey: input.templateKey,
        toEmail: input.to,
        subject: template ? this.render(template.subject, input.variables) : input.templateKey,
        status: 'queued',
      },
    });

    if (!template || !template.isActive) {
      await this.prisma.unscoped.emailLog.update({
        where: { id: log.id },
        data: { status: 'failed', error: 'Template missing or inactive' },
      });
      this.logger.warn(`No active template "${input.templateKey}" for tenant ${input.tenantId}`);
      return;
    }

    try {
      const result = await this.provider.send({
        to: input.to,
        subject: this.render(template.subject, input.variables),
        html: this.render(template.htmlBody, input.variables),
      });
      await this.prisma.unscoped.emailLog.update({
        where: { id: log.id },
        data: { status: 'sent', sentAt: new Date(), providerMessageId: result.messageId },
      });
    } catch (err) {
      await this.prisma.unscoped.emailLog.update({
        where: { id: log.id },
        data: { status: 'failed', error: (err as Error).message },
      });
      throw err;
    }
  }
}
