import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { CallsService } from './calls.service';
import { LogCallDto } from './dto/calls.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get()
  @Can('call.read_own')
  list(@Query('leadId') leadId?: string) {
    return this.calls.list(leadId);
  }

  @Post()
  @Can('call.create')
  log(@Body() dto: LogCallDto) {
    return this.calls.log(dto);
  }

  @Get(':id')
  @Can('call.read_own')
  get(@Param('id') id: string) {
    return this.calls.get(id);
  }
}
