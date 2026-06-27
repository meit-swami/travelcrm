import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { $Enums } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { QueueService } from '../../core/queue/queue.service';
import { QueueName } from '../../core/queue/queue.constants';

export interface AutomationEvent {
  tenantId: string;
  to?: string;
  leadId?: string;
  variables?: Record<string, string | number>;
}

export interface EmailJob {
  tenantId: string;
  to: string;
  templateKey: string;
  variables?: Record<string, string | number>;
  leadId?: string;
}

/**
 * Maps domain events to configured automations and enqueues the resulting
 * email jobs (honouring per-rule delay). Triggers: quotation.sent,
 * payment.received, invoice.generated, voucher.generated, travel.reminder,
 * feedback.request.
 */
@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  @OnEvent('quotation.sent')
  onQuotationSent(e: AutomationEvent) {
    return this.dispatch('quotation_sent', e);
  }

  @OnEvent('payment.received')
  onPaymentReceived(e: AutomationEvent) {
    return this.dispatch('payment_received', e);
  }

  @OnEvent('invoice.generated')
  onInvoiceGenerated(e: AutomationEvent) {
    return this.dispatch('invoice_generated', e);
  }

  @OnEvent('voucher.generated')
  onVoucherGenerated(e: AutomationEvent) {
    return this.dispatch('voucher_generated', e);
  }

  async dispatch(trigger: $Enums.AutomationTrigger, event: AutomationEvent): Promise<void> {
    if (!event.to) return;
    const automations = await this.prisma.unscoped.automation.findMany({
      where: { tenantId: event.tenantId, triggerEvent: trigger, isActive: true },
    });

    for (const rule of automations) {
      const job: EmailJob = {
        tenantId: event.tenantId,
        to: event.to,
        templateKey: rule.templateKey,
        variables: event.variables,
        leadId: event.leadId,
      };
      await this.queue.enqueue(QueueName.Email, 'send', job, {
        delay: rule.delayMinutes * 60_000,
      });
      this.logger.debug(`Queued automation ${trigger} → ${rule.templateKey} for ${event.to}`);
    }
  }
}
