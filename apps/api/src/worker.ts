import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Standalone worker entrypoint. Boots the application context (DI, config,
 * Redis, Prisma) WITHOUT the HTTP server so BullMQ processors can run as a
 * separately-scaled process. Processors are registered in src/jobs (Phase 2+).
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });
  await app.init();
  Logger.log('👷 Worker context started (no processors registered yet)', 'Worker');
}

bootstrap().catch((err) => {
  Logger.error(err, 'Worker');
  process.exit(1);
});
