import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@Query('organisationId') organisationId?: string) {
    return this.dashboardService.getMetrics(organisationId);
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(limit ? parseInt(limit, 10) : 10);
  }

  @Get('upcoming-tasks')
  async getUpcomingTasks(@Query('limit') limit?: string) {
    return this.dashboardService.getUpcomingTasks(limit ? parseInt(limit, 10) : 10);
  }

  @Get('risk-trends')
  async getRiskTrends(@Query('months') months?: string) {
    return this.dashboardService.getRiskTrendData(months ? parseInt(months, 10) : 6);
  }

  @Get('compliance')
  async getComplianceData() {
    return this.dashboardService.getComplianceData();
  }
}
