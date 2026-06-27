import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { AiService } from './ai.service';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('leads/:leadId/summarize')
  @Can('ai_insight.read_own')
  summarize(@Param('leadId') leadId: string) {
    return this.ai.summarizeLead(leadId);
  }

  @Post('leads/:leadId/extract')
  @Can('ai_insight.read_own')
  extract(@Param('leadId') leadId: string) {
    return this.ai.extractRequirements(leadId);
  }

  @Post('leads/:leadId/score')
  @Can('ai_insight.read_own')
  score(@Param('leadId') leadId: string) {
    return this.ai.scoreLead(leadId);
  }

  @Get('leads/:leadId/insights')
  @Can('ai_insight.read_own')
  insights(@Param('leadId') leadId: string) {
    return this.ai.listInsights(leadId);
  }
}
