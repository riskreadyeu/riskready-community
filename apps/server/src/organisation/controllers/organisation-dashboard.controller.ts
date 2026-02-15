import { Controller, Get } from '@nestjs/common';
import { OrganisationDashboardService } from '../services/organisation-dashboard.service';

@Controller('organisation/dashboard')
export class OrganisationDashboardController {
  constructor(private readonly service: OrganisationDashboardService) {}

  @Get('overview')
  async getOverview() {
    return this.service.getOverview();
  }

  @Get('insights')
  async getInsights() {
    return this.service.getInsights();
  }

  @Get('department-summary')
  async getDepartmentSummary() {
    return this.service.getDepartmentSummary();
  }
}
