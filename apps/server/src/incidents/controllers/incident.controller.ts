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
import { IncidentService } from '../services/incident.service';
import { IncidentClassificationService } from '../services/incident-classification.service';
import { IncidentNotificationService } from '../services/incident-notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIncidentDto, UpdateIncidentDto } from '../dto/incident.dto';
import {
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory,
  IncidentSource,
} from '@prisma/client';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('incidents')
export class IncidentController {
  constructor(
    private readonly service: IncidentService,
    private readonly classificationService: IncidentClassificationService,
    private readonly notificationService: IncidentNotificationService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: IncidentStatus,
    @Query('severity') severity?: IncidentSeverity,
    @Query('category') category?: IncidentCategory,
    @Query('source') source?: IncidentSource,
    @Query('handlerId') handlerId?: string,
    @Query('incidentManagerId') incidentManagerId?: string,
    @Query('organisationId') organisationId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('isConfirmed') isConfirmed?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      filters: {
        status,
        severity,
        category,
        source,
        handlerId,
        incidentManagerId,
        organisationId,
        search,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        isConfirmed: isConfirmed ? isConfirmed === 'true' : undefined,
      },
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId?: string) {
    return this.service.getStats(organisationId);
  }

  @Get('dashboard')
  async getDashboard(@Query('organisationId') organisationId?: string) {
    return this.service.getDashboardData(organisationId);
  }

  @Get('types')
  async getTypes(@Query('organisationId') organisationId?: string) {
    return this.prisma.incidentType.findMany({
      where: {
        isActive: true,
        ...(organisationId && { organisationId }),
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get('attack-vectors')
  async getAttackVectors(@Query('organisationId') organisationId?: string) {
    return this.prisma.attackVector.findMany({
      where: {
        isActive: true,
        ...(organisationId && { organisationId }),
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateIncidentDto,
  ) {
    return this.service.create(
      {
        ...data,
        detectedAt: new Date(data.detectedAt),
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
      },
      req.user.id,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() data: UpdateIncidentDto,
  ) {
    return this.service.update(id, data, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() data: { status: IncidentStatus; notes?: string },
  ) {
    return this.service.updateStatus(id, data.status, req.user.id, data.notes);
  }

  // ============================================
  // CLASSIFICATION ENDPOINTS
  // ============================================

  @Post(':id/classify')
  async autoClassify(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classificationService.autoClassifyIncident(id, req.user.id);
  }

  @Get(':id/compliance-status')
  async getComplianceStatus(@Param('id') id: string) {
    return this.classificationService.getComplianceStatus(id);
  }

  @Post(':id/nis2-assessment')
  async assessNIS2(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body()
    data: {
      entityType?: string;
      sector?: string;
      causedSevereOperationalDisruption?: boolean;
      causedFinancialLoss?: boolean;
      financialLossAmount?: number;
      financialLossCurrency?: string;
      affectedOtherPersons?: boolean;
      affectedPersonsCount?: number;
      causedMaterialDamage?: boolean;
      materialDamageDescription?: string;
      hasCrossBorderImpact?: boolean;
      affectedMemberStates?: string[];
      serviceAvailabilityImpactPercent?: number;
      serviceDegradationDurationHours?: number;
      affectedServiceIds?: string[];
    },
  ) {
    return this.classificationService.assessNIS2(id, data as Record<string, unknown>, req.user.id);
  }

  @Post(':id/dora-assessment')
  async assessDORA(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body()
    data: {
      financialEntityType?: string;
      affectedIctServiceIds?: string[];
      thirdPartyProviderInvolved?: boolean;
      thirdPartyProviderId?: string;
      affectsCriticalFunction?: boolean;
      criticalFunctionIds?: string[];
      clientsAffectedCount?: number;
      counterpartiesAffectedCount?: number;
      clientsAffectedPercent?: number;
      mediaCoverageOccurred?: boolean;
      mediaCoverageType?: string;
      clientComplaintsReceived?: number;
      regulatoryInquiryTriggered?: boolean;
      serviceDowntimeHours?: number;
      recoveryTimeHours?: number;
      affectedMemberStates?: string[];
      affectedThirdCountries?: string[];
      dataIntegrityAffected?: boolean;
      dataConfidentialityAffected?: boolean;
      dataAvailabilityAffected?: boolean;
      recordsAffectedCount?: number;
      involvesPersonalData?: boolean;
      directCosts?: number;
      indirectCosts?: number;
      economicImpactPercentOfCET1?: number;
      transactionsAffectedCount?: number;
      transactionsAffectedValue?: number;
      dailyAverageTransactions?: number;
      transactionsAffectedPercent?: number;
    },
  ) {
    return this.classificationService.assessDORA(id, data as Record<string, unknown>, req.user.id);
  }

  @Put(':id/nis2-override')
  async overrideNIS2(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() data: { isSignificant: boolean; justification: string },
  ) {
    return this.classificationService.overrideNIS2Classification(
      id,
      data.isSignificant,
      data.justification,
      req.user.id,
    );
  }

  @Put(':id/dora-override')
  async overrideDORA(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() data: { isMajor: boolean; justification: string },
  ) {
    return this.classificationService.overrideDORAClassification(
      id,
      data.isMajor,
      data.justification,
      req.user.id,
    );
  }

  // ============================================
  // ASSET MANAGEMENT
  // ============================================

  @Post(':id/assets')
  async addAsset(
    @Param('id') id: string,
    @Body() data: { assetId: string; impactType: string; notes?: string },
  ) {
    return this.service.addAffectedAsset(id, data.assetId, data.impactType, data.notes);
  }

  @Delete(':id/assets/:assetId')
  async removeAsset(@Param('id') id: string, @Param('assetId') assetId: string) {
    return this.service.removeAffectedAsset(id, assetId);
  }

  // ============================================
  // CONTROL LINKS
  // ============================================

  @Post(':id/controls')
  async linkControl(
    @Param('id') id: string,
    @Body() data: { controlId: string; linkType: string; notes?: string },
  ) {
    return this.service.linkControl(id, data.controlId, data.linkType, data.notes);
  }

  @Delete(':id/controls/:controlId')
  async unlinkControl(@Param('id') id: string, @Param('controlId') controlId: string) {
    return this.service.unlinkControl(id, controlId);
  }

  // ============================================
  // NOTIFICATION SHORTCUTS
  // ============================================

  @Post(':id/create-notifications')
  async createNotifications(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.notificationService.createRequiredNotifications(id, req.user.id);
  }
}

