import { Controller, Get, Query } from '@nestjs/common';
import { PolicyDashboardService } from '../services/policy-dashboard.service';
import { PolicyAuditService } from '../services/policy-audit.service';
import { PolicyAuditAction } from '@prisma/client';

@Controller('policies/dashboard')
export class PolicyDashboardController {
  constructor(
    private readonly dashboardService: PolicyDashboardService,
    private readonly auditService: PolicyAuditService,
  ) {}

  @Get('stats')
  async getDashboardStats(@Query('organisationId') organisationId: string) {
    return this.dashboardService.getDashboardStats(organisationId);
  }

  @Get('compliance')
  async getComplianceStatus(@Query('organisationId') organisationId: string) {
    return this.dashboardService.getComplianceStatus(organisationId);
  }

  @Get('actions-needed')
  async getActionsNeeded(@Query('organisationId') organisationId: string) {
    return this.dashboardService.getActionsNeeded(organisationId);
  }

  @Get('recent-activity')
  async getRecentActivity(
    @Query('organisationId') organisationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getRecentActivity(organisationId, limit ? parseInt(limit) : 10);
  }

  @Get('activity-stats')
  async getActivityStats(
    @Query('organisationId') organisationId: string,
    @Query('days') days?: string,
  ) {
    return this.auditService.getActivityStats(organisationId, days ? parseInt(days) : 30);
  }

  @Get('audit-log')
  async getOrganisationAuditLog(
    @Query('organisationId') organisationId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('action') action?: PolicyAuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.getOrganisationAuditLog(organisationId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId,
    });
  }

  @Get('document/:documentId/audit-log')
  async getDocumentAuditLog(
    @Query('documentId') documentId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('action') action?: PolicyAuditAction,
  ) {
    return this.auditService.getDocumentAuditLog(documentId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      action,
    });
  }
}
