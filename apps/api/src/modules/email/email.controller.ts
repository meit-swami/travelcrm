import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { EmailService } from './email.service';
import { CreateAutomationDto, UpsertTemplateDto } from './dto/email.dto';

@ApiTags('Email Automation')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Get('templates')
  @Can('settings.read')
  listTemplates() {
    return this.email.listTemplates();
  }

  @Put('templates')
  @Can('settings.manage')
  upsertTemplate(@Body() dto: UpsertTemplateDto) {
    return this.email.upsertTemplate(dto);
  }

  @Get('automations')
  @Can('settings.read')
  listAutomations() {
    return this.email.listAutomations();
  }

  @Post('automations')
  @Can('settings.manage')
  createAutomation(@Body() dto: CreateAutomationDto) {
    return this.email.createAutomation(dto);
  }

  @Get('logs')
  @Can('settings.read')
  listLogs() {
    return this.email.listLogs();
  }
}
