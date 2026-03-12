import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { RiskService } from '../services/risk.service';
import { RiskAuditService } from '../services/risk-audit.service';
import { RiskExportService } from '../services/risk-export.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskStatus, RiskTier, ControlFramework, LikelihoodLevel, ImpactLevel, Prisma } from '@prisma/client';
import { CreateRiskDto, UpdateRiskDto, DisableRiskDto } from '../dto/risk.dto';
import { AuthenticatedRequest } from '../../shared/types';
import { resolveSingleOrganisationId } from '../../shared/utils/single-organisation.util';

@Controller('risks')
export class RiskController {
  constructor(
    private readonly service: RiskService,
    private readonly prisma: PrismaService,
    private readonly auditService: RiskAuditService,
    private readonly exportService: RiskExportService,
  ) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('tier') tier?: RiskTier,
    @Query('status') status?: RiskStatus,
    @Query('framework') framework?: ControlFramework,
    @Query('organisationId') organisationId?: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.RiskWhereInput = {};
    if (tier) where.tier = tier;
    if (status) where.status = status;
    if (framework) where.framework = framework;
    if (organisationId) where.organisationId = organisationId;
    if (search) {
      where.OR = [
        { riskId: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where,
      orderBy: { riskId: 'asc' },
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId?: string) {
    return this.service.getStats(organisationId);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateRiskDto,
  ) {
    const organisationId = await resolveSingleOrganisationId(
      this.prisma,
      data.organisationId || req.user?.organisationId,
    );

    return this.service.create({
      ...data,
      likelihood: data.likelihood as LikelihoodLevel | undefined,
      impact: data.impact as ImpactLevel | undefined,
      organisationId: organisationId!,
      createdById: req.user.id,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateRiskDto,
  ) {
    return this.service.update(id, {
      ...data,
      likelihood: data.likelihood as LikelihoodLevel | undefined,
      impact: data.impact as ImpactLevel | undefined,
    });
  }

  // NOTE: Risk-level control linking endpoints have been removed.
  // Use /risk-scenarios/:id/controls endpoints for scenario-level control linking.

  /**
   * Disable a risk manually
   * Requires a reason for audit trail
   */
  @Post(':id/disable')
  async disableRisk(
    @Param('id') id: string,
    @Body() data: DisableRiskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.disableRisk(id, data.reason, req.user.id);
  }

  /**
   * Enable a risk manually
   * Cannot enable if risk is not applicable (regulatory scope takes precedence)
   */
  @Post(':id/enable')
  async enableRisk(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.enableRisk(id, req.user.id);
  }

  /**
   * Get audit trail for a risk
   */
  @Get(':id/audit')
  async getAuditTrail(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getRiskAuditTrail(id, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Get audit summary for a risk
   */
  @Get(':id/audit/summary')
  async getAuditSummary(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.auditService.getRiskAuditSummary(id, days ? parseInt(days, 10) : 30);
  }

  /**
   * Export risk register
   */
  @Get('export/register')
  async exportRiskRegister(
    @Query('organisationId') organisationId?: string,
    @Query('format') format?: 'json' | 'csv',
  ) {
    return this.exportService.exportRiskRegister({
      organisationId,
      format: format || 'json',
    });
  }

  /**
   * Export heat map data
   */
  @Get('export/heatmap')
  async exportHeatMap(@Query('organisationId') organisationId?: string) {
    return this.exportService.exportHeatMapData(organisationId);
  }

  /**
   * Export treatment summary
   */
  @Get('export/treatments')
  async exportTreatments(@Query('organisationId') organisationId?: string) {
    return this.exportService.exportTreatmentSummary(organisationId);
  }

  /**
   * Export KRI dashboard
   */
  @Get('export/kris')
  async exportKRIs(@Query('organisationId') organisationId?: string) {
    return this.exportService.exportKRIDashboard(organisationId);
  }
}
