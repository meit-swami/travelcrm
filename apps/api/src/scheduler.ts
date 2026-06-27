import 'reflect-metadata';
process.env.RUN_SCHEDULER = 'true'; // enable cron work in this dedicated process
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Dedicated scheduler process. Boots the app context (no HTTP) with cron work
 * enabled. Run a SINGLE instance so jobs are not duplicated across API replicas.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });
  await app.init();
  Logger.log('⏰ Scheduler started (RUN_SCHEDULER=true)', 'Scheduler');
}

bootstrap().catch((err) => {
  Logger.error(err, 'Scheduler');
  process.exit(1);
});
