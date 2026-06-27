import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';
import type Redis from 'ioredis';
import { REDIS_CONNECTION, type QueueName } from './queue.constants';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 24 * 3600 },
};

/**
 * Thin facade over BullMQ. Lazily creates a Queue per name on first enqueue and
 * reuses it. Processors live in src/jobs and bind to the same Redis connection.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();

  constructor(@Inject(REDIS_CONNECTION) private readonly connection: Redis) {}

  private queue(name: QueueName): Queue {
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, {
        // Reuse the shared ioredis connection; cast bridges minor type-version skew.
        connection: this.connection as unknown as ConnectionOptions,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.queues.set(name, q);
    }
    return q;
  }

  async enqueue<T extends object>(
    name: QueueName,
    jobName: string,
    data: T,
    opts?: JobsOptions,
  ): Promise<void> {
    await this.queue(name).add(jobName, data, opts);
    this.logger.debug(`Enqueued ${jobName} → ${name}`);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
