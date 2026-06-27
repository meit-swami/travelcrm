import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigModule } from './core/config';
import { TenancyModule } from './core/tenancy';
import { ContextMiddleware } from './core/tenancy/context.middleware';
import { DatabaseModule } from './core/database/database.module';
import { EventsModule } from './core/events/events.module';
import { QueueModule } from './core/queue/queue.module';
import { StorageModule } from './core/storage/storage.module';
import { RbacModule } from './core/rbac';
import { PermissionGuard } from './core/rbac/permission.guard';
import { AuditModule } from './core/audit';
import { AllExceptionsFilter } from './core/common';
import { HealthModule } from './core/health/health.module';

import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/auth.guard';
import { UsersModule } from './modules/users/users.module';
import { LeadsModule } from './modules/leads/leads.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { EmailModule } from './modules/email/email.module';
import { AiModule } from './modules/ai/ai.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { OperationsModule } from './modules/operations/operations.module';

@Module({
  imports: [
    // Platform core
    AppConfigModule,
    TenancyModule,
    DatabaseModule,
    EventsModule,
    QueueModule,
    StorageModule,
    RbacModule,
    AuditModule,
    HealthModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    // Domain modules
    AuthModule,
    UsersModule,
    LeadsModule, // Phase 1
    TasksModule, // Phase 1
    QuotationsModule, // Phase 2
    EmailModule, // Phase 2
    AiModule, // Phase 2
    WhatsAppModule, // Phase 2
    ItineraryModule, // Phase 2
    OperationsModule, // Phase 3
  ],
  providers: [
    // Guard order: rate-limit → authenticate → authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ContextMiddleware).forRoutes('*');
  }
}
