import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type Redis from 'ioredis';
import { REDIS_CONNECTION, QueueName } from '../../core/queue/queue.constants';
import { PrismaService } from '../../core/database/prisma.service';
import { WhatsAppService } from './whatsapp.service';

/** Consumes inbound WhatsApp events and marks the integration_event processed. */
@Injectable()
export class WhatsAppProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppProcessor.name);
  private worker?: Worker;

  constructor(
    @Inject(REDIS_CONNECTION) private readonly connection: Redis,
    private readonly whatsapp: WhatsAppService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<{ eventId: string; value: unknown }>(
      QueueName.WhatsappIn,
      async (job) => {
        await this.whatsapp.ingestInbound(job.data.value as never);
        await this.prisma.unscoped.integrationEvent.update({
          where: { id: job.data.eventId },
          data: { status: 'processed', processedAt: new Date() },
        });
      },
      { connection: this.connection as unknown as ConnectionOptions, concurrency: 5 },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`WhatsApp job ${job?.id} failed: ${err.message}`),
    );
    this.logger.log('WhatsApp worker started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
