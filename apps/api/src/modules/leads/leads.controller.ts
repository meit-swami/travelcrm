import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { LeadsService } from './leads.service';
import {
  AssignLeadDto,
  CreateLeadDto,
  CreateNoteDto,
  ListLeadsQuery,
  TransitionStageDto,
  UpdateLeadDto,
} from './dto/leads.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @Can('lead.read_own')
  list(@Query() query: ListLeadsQuery) {
    return this.leads.list(query);
  }

  @Post()
  @Can('lead.create')
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto);
  }

  @Get(':id')
  @Can('lead.read_own')
  get(@Param('id') id: string) {
    return this.leads.get(id);
  }

  @Patch(':id')
  @Can('lead.update')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leads.update(id, dto);
  }

  @Delete(':id')
  @Can('lead.delete')
  remove(@Param('id') id: string) {
    return this.leads.softDelete(id);
  }

  @Post(':id/stage')
  @Can('lead.transition')
  transition(@Param('id') id: string, @Body() dto: TransitionStageDto) {
    return this.leads.transitionStage(id, dto);
  }

  @Post(':id/assign')
  @Can('lead.assign')
  assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.leads.assign(id, dto.assignedUserId, dto.assignedTeamId);
  }

  @Get(':id/timeline')
  @Can('lead.read_own')
  timeline(@Param('id') id: string) {
    return this.leads.timeline(id);
  }

  @Get(':id/duplicates')
  @Can('lead.read_own')
  duplicates(@Param('id') id: string) {
    return this.leads.listDuplicates(id);
  }

  @Get(':id/notes')
  @Can('note.read')
  notes(@Param('id') id: string) {
    return this.leads.listNotes(id);
  }

  @Post(':id/notes')
  @Can('note.create')
  addNote(@Param('id') id: string, @Body() dto: CreateNoteDto) {
    return this.leads.addNote(id, dto.body, dto.isPinned);
  }
}
