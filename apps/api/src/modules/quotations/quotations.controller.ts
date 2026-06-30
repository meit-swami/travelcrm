import { Body, Controller, Get, Param, Post, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('quotations')
  @Can('quotation.read_own')
  listRecent(@Query('status') status?: string) {
    return this.quotations.listRecent(status);
  }

  @Get('quotations/:id')
  @Can('quotation.read_own')
  get(@Param('id') id: string) {
    return this.quotations.get(id);
  }

  @Get('quotations/:id/document')
  @Can('quotation.read_own')
  async document(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const f = await this.quotations.renderDocument(id);
    res.set({ 'Content-Type': f.contentType, 'Content-Disposition': `attachment; filename="${f.filename}"` });
    return new StreamableFile(f.body);
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
