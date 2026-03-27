import { Controller, Get, Post, Put, Param, Query, Body, Req, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ControlService } from '../services/control.service';
import { ControlReportingService } from '../services/control-reporting.service';
import { GapAnalysisService } from '../services/gap-analysis.service';
import {
  CreateControlDto,
  UpdateControlDto,
  FindControlsByIdsDto,
  DisableControlDto,
} from '../dto/control.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('controls')
export class ControlController {
  constructor(
    private readonly service: ControlService,
    private readonly reportingService: ControlReportingService,
    private readonly gapAnalysisService: GapAnalysisService,
  ) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('theme') theme?: string,
    @Query('framework') framework?: string,
    @Query('implementationStatus') implementationStatus?: string,
    @Query('applicable') applicable?: string,
    @Query('enabled') enabled?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.ControlWhereInput = {};

    if (theme) where.theme = theme as Prisma.ControlWhereInput['theme'];
    if (framework) where.framework = framework as Prisma.ControlWhereInput['framework'];
    if (implementationStatus) where.implementationStatus = implementationStatus as Prisma.ControlWhereInput['implementationStatus'];
    if (applicable !== undefined) where.applicable = applicable === 'true';
    if (enabled !== undefined) where.enabled = enabled === 'true';
    // activeOnly = applicable AND enabled (effective "Active" status)
    if (activeOnly === 'true') {
      where.applicable = true;
      where.enabled = true;
    }
    where.organisationId = req.user.organisationId;
    if (search) {
      where.OR = [
        { controlId: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.service.getStats(req.user.organisationId!);
  }

  @Get('effectiveness')
  async getEffectivenessReport(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getEffectivenessReport(req.user.organisationId!);
  }

  @Get('gap-analysis')
  async getGapAnalysis(@Req() req: AuthenticatedRequest) {
    return this.gapAnalysisService.getGapAnalysis(req.user.organisationId!);
  }

  @Post()
  async create(@Body() data: CreateControlDto, @Req() req: AuthenticatedRequest) {
    return this.service.create({
      ...data,
      createdById: req.user?.id,
    });
  }

  /**
   * Find multiple controls by their IDs
   * Optimized endpoint for fetching specific controls (e.g., linked to a risk scenario)
   * Returns controls with effectiveness scores
   */
  @Post('by-ids')
  async findByIds(@Body() data: FindControlsByIdsDto) {
    return this.service.findByIds(data.ids);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const record = await this.service.findOne(id);
    if (!record || record.organisationId !== req.user.organisationId) {
      throw new NotFoundException();
    }
    return record;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateControlDto, @Req() req: AuthenticatedRequest) {
    const record = await this.service.findOne(id);
    if (!record || record.organisationId !== req.user.organisationId) {
      throw new NotFoundException();
    }
    return this.service.update(id, data);
  }

  /**
   * Disable a control manually
   * Requires a reason for audit trail
   */
  @Post(':id/disable')
  async disableControl(
    @Param('id') id: string,
    @Body() data: DisableControlDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.disableControl(id, data.reason, req.user.id);
  }

  /**
   * Enable a control manually
   * Cannot enable if control is not applicable (regulatory scope takes precedence)
   */
  @Post(':id/enable')
  async enableControl(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.enableControl(id, req.user.id);
  }
}
