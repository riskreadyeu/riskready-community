import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Request,
} from '@nestjs/common';
import { KRIService } from '../services/kri.service';
import { Prisma, RAGStatus, RiskTier } from '@prisma/client';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('kris')
export class KRIController {
  constructor(private readonly service: KRIService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: RAGStatus,
    @Query('tier') tier?: RiskTier,
  ) {
    const where: Prisma.KeyRiskIndicatorWhereInput = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;

    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      where,
      orderBy: { kriId: 'asc' },
    });
  }

  @Get('dashboard')
  async getDashboard(@Query('organisationId') organisationId?: string) {
    const stats = await this.service.getStats(organisationId);
    // Map ragDistribution to statusCounts expected by the frontend
    return {
      total: stats.total,
      statusCounts: stats.ragDistribution,
      byTier: stats.byTier,
    };
  }

  @Get('risk/:riskId')
  async findByRisk(@Param('riskId') riskId: string) {
    const result = await this.service.findAll({
      where: { riskId },
      orderBy: { kriId: 'asc' },
    });
    return result.results;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() data: {
      kriId: string;
      name: string;
      description?: string;
      formula?: string;
      unit?: string;
      thresholdGreen?: string;
      thresholdAmber?: string;
      thresholdRed?: string;
      frequency?: string;
      dataSource?: string;
      automated?: boolean;
      tier?: string;
      framework?: string;
      soc2Criteria?: string;
      riskId: string;
    },
  ) {
    return this.service.create({
      ...data,
      createdById: req.user.id,
    } as Parameters<KRIService['create']>[0]);
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.service.update(id, {
      ...data,
      updatedById: req.user.id,
    } as Parameters<KRIService['update']>[0]);
  }

  @Put(':id/value')
  async recordMeasurement(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: { value: string; notes?: string },
  ) {
    return this.service.recordMeasurement(id, {
      value: data.value,
      notes: data.notes,
      measuredById: req.user.id,
    });
  }
}
