import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { QuotationsService } from './quotations.service';
import { AddVersionDto, CreateQuotationDto, RejectQuotationDto } from './dto/quotations.dto';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller()
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get('leads/:leadId/quotations')
  @Can('quotation.read_own')
  listForLead(@Param('leadId') leadId: string) {
    return this.quotations.listForLead(leadId);
  }

  @Post('leads/:leadId/quotations')
  @Can('quotation.create')
  create(@Param('leadId') leadId: string, @Body() dto: CreateQuotationDto) {
    return this.quotations.create(leadId, dto);
  }

  @Get('quotations/:id')
  @Can('quotation.read_own')
  get(@Param('id') id: string) {
    return this.quotations.get(id);
  }

  @Post('quotations/:id/versions')
  @Can('quotation.update')
  addVersion(@Param('id') id: string, @Body() dto: AddVersionDto) {
    return this.quotations.addVersion(id, dto);
  }

  @Post('quotations/:id/send')
  @Can('quotation.transition')
  send(@Param('id') id: string) {
    return this.quotations.send(id);
  }

  @Post('quotations/:id/accept')
  @Can('quotation.transition')
  accept(@Param('id') id: string) {
    return this.quotations.accept(id);
  }

  @Post('quotations/:id/reject')
  @Can('quotation.transition')
  reject(@Param('id') id: string, @Body() dto: RejectQuotationDto) {
    return this.quotations.reject(id, dto);
  }
}
