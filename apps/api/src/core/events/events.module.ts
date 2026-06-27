import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * In-process domain event bus. Modules emit events (e.g. `lead.created`) on the
 * success path; handlers enqueue durable jobs for slow/retryable side effects.
 */
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 50,
      verboseMemoryLeak: true,
    }),
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}

/** Canonical domain event names (extend as modules land). */
export const DomainEvent = {
  UserLoggedIn: 'user.logged_in',
  UserLoggedOut: 'user.logged_out',
  AuditRecorded: 'audit.recorded',
} as const;
export type DomainEvent = (typeof DomainEvent)[keyof typeof DomainEvent];
