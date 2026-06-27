import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type Redis from 'ioredis';
import { REDIS_CONNECTION, QueueName } from '../../core/queue/queue.constants';
import { EmailService } from './email.service';
import type { EmailJob } from './automation.service';

/**
 * BullMQ worker for the `email` queue. Runs in both the API process (dev) and
 * the dedicated worker process. Idempotent send + email_log update happen in
 * EmailService.
 */
@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);
  private worker?: Worker;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly connection: Redis,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<EmailJob>(
      QueueName.Email,
      async (job) => {
        await this.emailService.sendTemplated({
          tenantId: job.data.tenantId,
          to: job.data.to,
          templateKey: job.data.templateKey,
          variables: job.data.variables,
          leadId: job.data.leadId,
        });
      },
      { connection: this.connection as unknown as ConnectionOptions, concurrency: 5 },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`Email job ${job?.id} failed: ${err.message}`),
    );
    this.logger.log('Email worker started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
