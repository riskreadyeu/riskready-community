import { Controller, Get, Post, Put, Param, Query, Body, Req } from '@nestjs/common';
import { ControlService } from '../services/control.service';
import { ControlReportingService } from '../services/control-reporting.service';
import { GapAnalysisService } from '../services/gap-analysis.service';
import { CreateControlDto, UpdateControlDto } from '../dto/control.dto';

@Controller('controls')
export class ControlController {
  constructor(
    private readonly service: ControlService,
    private readonly reportingService: ControlReportingService,
    private readonly gapAnalysisService: GapAnalysisService,
  ) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('theme') theme?: string,
    @Query('framework') framework?: string,
    @Query('implementationStatus') implementationStatus?: string,
    @Query('applicable') applicable?: string,
    @Query('enabled') enabled?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('organisationId') organisationId?: string,
    @Query('search') search?: string,
  ) {
    const where: any = {};

    if (theme) where.theme = theme;
    if (framework) where.framework = framework;
    if (implementationStatus) where.implementationStatus = implementationStatus;
    if (applicable !== undefined) where.applicable = applicable === 'true';
    if (enabled !== undefined) where.enabled = enabled === 'true';
    // activeOnly = applicable AND enabled (effective "Active" status)
    if (activeOnly === 'true') {
      where.applicable = true;
      where.enabled = true;
    }
    if (organisationId) where.organisationId = organisationId;
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
  async getStats(@Query('organisationId') organisationId: string) {
    return this.service.getStats(organisationId);
  }

  @Get('effectiveness')
  async getEffectivenessReport(@Query('organisationId') organisationId: string) {
    return this.reportingService.getEffectivenessReport(organisationId);
  }

  @Get('gap-analysis')
  async getGapAnalysis(@Query('organisationId') organisationId: string) {
    return this.gapAnalysisService.getGapAnalysis(organisationId);
  }

  @Post()
  async create(@Body() data: CreateControlDto, @Req() req: any) {
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
  async findByIds(@Body() data: { ids: string[] }) {
    return this.service.findByIds(data.ids);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateControlDto) {
    return this.service.update(id, data);
  }

  /**
   * Disable a control manually
   * Requires a reason for audit trail
   */
  @Post(':id/disable')
  async disableControl(
    @Param('id') id: string,
    @Body() data: { reason: string },
    @Req() req: any,
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
    @Req() req: any,
  ) {
    return this.service.enableControl(id, req.user.id);
  }
}
