import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { ReportsService } from './reports.service';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('lead-funnel')
  @Can('report.read')
  funnel() {
    return this.reports.leadFunnel();
  }

  @Get('conversion')
  @Can('report.read')
  conversion() {
    return this.reports.conversion();
  }

  @Get('source-performance')
  @Can('report.read')
  sources() {
    return this.reports.sourcePerformance();
  }

  @Get('employee-performance')
  @Can('report.read')
  employees() {
    return this.reports.employeePerformance();
  }

  @Get('revenue')
  @Can('report.read')
  revenue(@Query('groupBy') groupBy?: 'destination' | 'month') {
    return this.reports.revenue(groupBy ?? 'destination');
  }

  @Get('dashboard')
  @Can('dashboard.read')
  dashboard() {
    return this.reports.dashboard();
  }
}
