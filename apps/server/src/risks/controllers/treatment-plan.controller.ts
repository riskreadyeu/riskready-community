import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { TreatmentPlanService } from '../services/treatment-plan.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TreatmentType, TreatmentStatus, TreatmentPriority, ActionStatus, Prisma } from '@prisma/client';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto, CreateTreatmentActionDto } from '../dto/risk.dto';
import { UpdateProgressDto, UpdateTreatmentActionDto } from '../dto/treatment-plan.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('risks/treatment-plans')
export class TreatmentPlanController {
  constructor(
    private readonly treatmentPlanService: TreatmentPlanService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: TreatmentStatus,
    @Query('type') type?: TreatmentType,
    @Query('priority') priority?: TreatmentPriority,
    @Query('riskId') riskId?: string,
    @Query('organisationId') organisationId?: string,
  ) {
    const where: Prisma.TreatmentPlanWhereInput = {};
    if (status) where.status = status;
    if (type) where.treatmentType = type;
    if (priority) where.priority = priority;
    if (riskId) where.riskId = riskId;
    if (organisationId) where.organisationId = organisationId;

    return this.treatmentPlanService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : 100,
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId?: string) {
    return this.treatmentPlanService.getStats(organisationId);
  }

  @Get('by-risk/:riskId')
  async findByRisk(@Param('riskId') riskId: string) {
    return this.treatmentPlanService.findByRisk(riskId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.treatmentPlanService.findOne(id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateTreatmentPlanDto,
  ) {
    // Auto-fetch organisationId from the risk if not provided
    let organisationId = data.organisationId;
    if (!organisationId) {
      const risk = await this.prisma.risk.findUnique({
        where: { id: data.riskId },
        select: { organisationId: true },
      });
      if (!risk) {
        throw new BadRequestException(`Risk with ID ${data.riskId} not found`);
      }
      organisationId = risk.organisationId;
    }

    return this.treatmentPlanService.create({
      ...data,
      targetStartDate: data.targetStartDate ? new Date(data.targetStartDate) : undefined,
      targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : undefined,
      acceptanceExpiryDate: data.acceptanceExpiryDate ? new Date(data.acceptanceExpiryDate) : undefined,
      organisationId,
      createdById: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateTreatmentPlanDto,
  ) {
    return this.treatmentPlanService.update(id, {
      ...data,
      proposedDate: data.proposedDate ? new Date(data.proposedDate) : undefined,
      approvedDate: data.approvedDate ? new Date(data.approvedDate) : undefined,
      targetStartDate: data.targetStartDate ? new Date(data.targetStartDate) : undefined,
      targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : undefined,
      actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : undefined,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : undefined,
      acceptanceExpiryDate: data.acceptanceExpiryDate ? new Date(data.acceptanceExpiryDate) : undefined,
      updatedById: req.user.id,
    });
  }

  @Put(':id/approve')
  async approve(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.treatmentPlanService.approve(id, req.user.id);
  }

  @Put(':id/progress')
  async updateProgress(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateProgressDto,
  ) {
    return this.treatmentPlanService.updateProgress(
      id,
      data.progressPercentage,
      data.progressNotes,
      req.user.id
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.treatmentPlanService.delete(id);
  }

  // Treatment Actions
  @Post(':id/actions')
  async createAction(
    @Request() req: AuthenticatedRequest,
    @Param('id') treatmentPlanId: string,
    @Body() data: CreateTreatmentActionDto,
  ) {
    return this.treatmentPlanService.createAction({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      treatmentPlanId,
      createdById: req.user.id,
    });
  }

  @Put('actions/:actionId')
  async updateAction(
    @Param('actionId') id: string,
    @Body() data: UpdateTreatmentActionDto,
  ) {
    return this.treatmentPlanService.updateAction(id, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
    });
  }

  @Delete('actions/:actionId')
  async deleteAction(@Param('actionId') id: string) {
    return this.treatmentPlanService.deleteAction(id);
  }
}
