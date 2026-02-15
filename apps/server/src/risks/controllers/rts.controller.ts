import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { RiskToleranceStatementService } from '../services/rts.service';
import { ToleranceLevel, RTSStatus, ControlFramework, ImpactCategory } from '@prisma/client';
import { CreateRTSDto, UpdateRTSDto, LinkRisksDto, UnlinkRisksDto } from '../dto/rts.dto';

@Controller('risks/rts')
export class RiskToleranceStatementController {
  constructor(private readonly rtsService: RiskToleranceStatementService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: RTSStatus,
    @Query('level') level?: ToleranceLevel,
    @Query('domain') domain?: string,
    @Query('organisationId') organisationId?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (level) where.proposedToleranceLevel = level;
    if (domain) where.domain = domain;
    if (organisationId) where.organisationId = organisationId;

    return this.rtsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : 100,
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { rtsId: 'asc' },
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId?: string) {
    return this.rtsService.getStats(organisationId);
  }

  @Get('by-risk/:riskId')
  async findByRisk(@Param('riskId') riskId: string) {
    return this.rtsService.findByRisk(riskId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rtsService.findOne(id);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() data: CreateRTSDto,
  ) {
    // Get organisation ID from first available source
    let organisationId = data.organisationId;
    if (!organisationId) {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const org = await prisma.organisationProfile.findFirst();
      organisationId = org?.id;
      await prisma.$disconnect();
    }

    return this.rtsService.create({
      ...data,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      organisationId: organisationId!,
      createdById: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: UpdateRTSDto,
  ) {
    return this.rtsService.update(id, {
      ...data,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      updatedById: req.user.id,
    });
  }

  @Put(':id/approve')
  async approve(@Request() req: any, @Param('id') id: string) {
    return this.rtsService.approve(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.rtsService.delete(id);
  }

  @Put(':id/link-risks')
  async linkRisks(
    @Param('id') id: string,
    @Body() data: LinkRisksDto,
  ) {
    return this.rtsService.linkRisks(id, data.riskIds);
  }

  @Put(':id/unlink-risks')
  async unlinkRisks(
    @Param('id') id: string,
    @Body() data: UnlinkRisksDto,
  ) {
    return this.rtsService.unlinkRisks(id, data.riskIds);
  }
}
