import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { AiAnalyticsService } from './ai-analytics.service';

@ApiTags('AI Analytics')
@ApiBearerAuth()
@Controller('ai-analytics')
export class AiAnalyticsController {
  constructor(private readonly analytics: AiAnalyticsService) {}

  @Get('signals')
  @Can('ai_analytics.read')
  signals() {
    return this.analytics.signals();
  }

  @Post('insights')
  @Can('ai_analytics.read')
  generate() {
    return this.analytics.generateInsights();
  }

  @Get('insights')
  @Can('ai_analytics.read')
  latest() {
    return this.analytics.latest();
  }
}
