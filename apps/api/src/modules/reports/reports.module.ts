import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiAnalyticsController } from './ai-analytics.controller';

@Module({
  imports: [AiModule],
  controllers: [ReportsController, AiAnalyticsController],
  providers: [ReportsService, AiAnalyticsService],
  exports: [ReportsService],
})
export class ReportsModule {}
