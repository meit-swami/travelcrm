import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { SourcesService } from './sources.service';
import { CreateAssignmentRuleDto, CreateSourceDto } from './dto/sources.dto';

@ApiTags('Lead Capture')
@ApiBearerAuth()
@Controller()
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get('lead-sources')
  @Can('lead_source.read')
  listSources() {
    return this.sources.listSources();
  }

  @Post('lead-sources')
  @Can('lead_source.manage')
  createSource(@Body() dto: CreateSourceDto) {
    return this.sources.createSource(dto);
  }

  @Get('assignment-rules')
  @Can('assignment_rule.read')
  listRules() {
    return this.sources.listRules();
  }

  @Post('assignment-rules')
  @Can('assignment_rule.manage')
  createRule(@Body() dto: CreateAssignmentRuleDto) {
    return this.sources.createRule(dto);
  }
}
