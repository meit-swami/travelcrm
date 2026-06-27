import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';

/**
 * Cron-driven background jobs. Runs system-wide (cross-tenant) via the
 * privileged client. Guarded by RUN_SCHEDULER so only the dedicated scheduler
 * process performs work — API replicas register the timers but no-op, avoiding
 * duplicate execution when the API is horizontally scaled.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly enabled = process.env.RUN_SCHEDULER === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /** Dispatch due task reminders; remindAt is cleared so each fires once. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async dispatchTaskReminders(): Promise<void> {
    if (!this.enabled) return;
    const due = await this.prisma.unscoped.task.findMany({
      where: { status: 'pending', remindAt: { not: null, lte: new Date() } },
      take: 500,
    });
    for (const task of due) {
      await this.prisma.unscoped.notification.create({
        data: {
          tenantId: task.tenantId,
          userId: task.assigneeUserId,
          type: 'task_reminder',
          title: `Reminder: ${task.title}`,
          refTable: 'task',
          refId: task.id,
        },
      });
      await this.prisma.unscoped.task.update({ where: { id: task.id }, data: { remindAt: null } });
    }
    if (due.length) this.logger.log(`Dispatched ${due.length} task reminder(s)`);
  }

  /** Expire quotations past their validity. Idempotent. */
  @Cron(CronExpression.EVERY_HOUR)
  async expireQuotations(): Promise<void> {
    if (!this.enabled) return;
    const res = await this.prisma.unscoped.quotation.updateMany({
      where: { status: { in: ['sent', 'viewed'] }, validUntil: { not: null, lt: new Date() } },
      data: { status: 'expired' },
    });
    if (res.count) this.logger.log(`Expired ${res.count} quotation(s)`);
  }

  /**
   * Travel reminders for trips starting in ~3 days. Uses a metadata flag on the
   * booking to fire once (no schema change).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async travelReminders(): Promise<void> {
    if (!this.enabled) return;
    const start = new Date();
    start.setDate(start.getDate() + 3);
    const dayStart = new Date(start.toISOString().slice(0, 10));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const bookings = await this.prisma.unscoped.booking.findMany({
      where: { travelStart: { gte: dayStart, lt: dayEnd }, opsStage: { notIn: ['cancelled', 'completed'] } },
      include: { lead: { select: { email: true, name: true } } },
      take: 500,
    });
    let sent = 0;
    for (const b of bookings) {
      if (!b.lead?.email) continue;
      this.events.emit('travel.reminder', {
        tenantId: b.tenantId,
        to: b.lead.email,
        leadId: b.leadId,
        variables: { customerName: b.lead.name, destination: b.destination ?? '' },
      });
      sent++;
    }
    if (sent) this.logger.log(`Queued ${sent} travel reminder(s)`);
  }
}
