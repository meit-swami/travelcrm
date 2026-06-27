import { Global, Module } from '@nestjs/common';
import IORedis from 'ioredis';
import { AppConfigService } from '../config';
import { REDIS_CONNECTION } from './queue.constants';
import { QueueService } from './queue.service';

/**
 * Provides a shared ioredis connection (used by BullMQ and caching) and the
 * QueueService facade.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: (config: AppConfigService) =>
        new IORedis(config.get('REDIS_URL'), {
          maxRetriesPerRequest: null, // required by BullMQ
          enableReadyCheck: false,
        }),
      inject: [AppConfigService],
    },
    QueueService,
  ],
  exports: [REDIS_CONNECTION, QueueService],
})
export class QueueModule {}
