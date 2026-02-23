import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CapacityService } from '../services/capacity.service';
import { RecordCapacityDto, CreateCapacityPlanDto, UpdateCapacityPlanDto } from '../dto/capacity.dto';

@Controller('itsm/capacity')
export class CapacityController {
  constructor(private readonly service: CapacityService) {}

  @Get('summary')
  async getSummary() {
    return this.service.getCapacitySummary();
  }

  @Get('at-risk')
  async getAssetsAtRisk() {
    return this.service.getAssetsAtRisk();
  }

  @Get('history/:assetId')
  async getCapacityHistory(
    @Param('assetId') assetId: string,
    @Query('days') days?: string,
  ) {
    return this.service.getCapacityHistory(assetId, days ? parseInt(days) : 30);
  }

  @Get('trend/:assetId')
  async getCapacityTrend(@Param('assetId') assetId: string) {
    return this.service.getCapacityTrend(assetId);
  }

  @Post('record/:assetId')
  async recordCapacity(
    @Param('assetId') assetId: string,
    @Body() data: RecordCapacityDto,
  ) {
    return this.service.recordCapacity(assetId, data);
  }

  // Capacity Plans
  @Get('plans')
  async findCapacityPlans(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('assetId') assetId?: string,
  ) {
    const where: Prisma.CapacityPlanWhereInput = {};
    if (status) where.status = status as Prisma.CapacityPlanWhereInput['status'];
    if (assetId) where.assetId = assetId;

    return this.service.findCapacityPlans({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('plans/:id')
  async findCapacityPlanById(@Param('id') id: string) {
    return this.service.findCapacityPlanById(id);
  }

  @Post('plans')
  async createCapacityPlan(@Body() data: CreateCapacityPlanDto) {
    return this.service.createCapacityPlan(data);
  }

  @Put('plans/:id')
  async updateCapacityPlan(@Param('id') id: string, @Body() data: UpdateCapacityPlanDto) {
    return this.service.updateCapacityPlan(id, data);
  }
}
