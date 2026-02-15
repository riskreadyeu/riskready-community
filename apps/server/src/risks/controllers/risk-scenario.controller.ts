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
  NotFoundException,
} from '@nestjs/common';
import { RiskScenarioService } from '../services/risk-scenario.service';
import { RiskCalculationService } from '../services/risk-calculation.service';
import { ToleranceEngineService } from '../services/tolerance-engine.service';
import { ControlFramework, LikelihoodLevel, ImpactLevel, ImpactCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/risk.dto';
import {
  UpdateFactorScoresDto,
  UpdateResidualFactorScoresDto,
  SaveImpactAssessmentsDto,
  LinkControlDto,
  UpdateControlLinkDto,
} from '../dto/risk-scenario.dto';

@Controller('risk-scenarios')
export class RiskScenarioController {
  constructor(
    private readonly service: RiskScenarioService,
    private readonly calculationService: RiskCalculationService,
    private readonly toleranceEngine: ToleranceEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() data: CreateScenarioDto,
  ) {
    return this.service.create({
      ...data,
      createdById: req.user.id,
    });
  }

  @Get('risk/:riskId')
  async findByRisk(@Param('riskId') riskId: string) {
    return this.service.findByRisk(riskId);
  }

  /**
   * Get F1-F6 likelihood factor scores for a scenario
   */
  @Get(':id/factor-scores')
  async getFactorScores(@Param('id') id: string) {
    return this.service.getLikelihoodFactorScores(id);
  }

  /**
   * Update F1-F6 likelihood factor scores for a scenario
   */
  @Put(':id/factor-scores')
  async updateFactorScores(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: UpdateFactorScoresDto,
  ) {
    return this.service.updateLikelihoodFactorScores(id, data, req.user.id);
  }

  /**
   * Get evidence data for F1-F6 likelihood factors
   */
  @Get(':id/factor-evidence')
  async getFactorEvidence(@Param('id') id: string) {
    return this.service.getFactorEvidence(id);
  }

  /**
   * Get residual likelihood factor scores for a scenario
   */
  @Get(':id/residual-factor-scores')
  async getResidualFactorScores(@Param('id') id: string) {
    return this.service.getResidualFactorScores(id);
  }

  /**
   * Update residual likelihood factor scores for a scenario
   */
  @Put(':id/residual-factor-scores')
  async updateResidualFactorScores(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: UpdateResidualFactorScoresDto,
  ) {
    return this.service.updateResidualFactorScores(id, data, req.user.id);
  }

  // ============================================
  // CALCULATION & TOLERANCE ENDPOINTS
  // ============================================

  /**
   * Get calculation history for a scenario
   */
  @Get(':id/calculation-history')
  async getCalculationHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.calculationService.getCalculationHistory(
      id,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Evaluate tolerance for this scenario's parent risk
   */
  @Get(':id/tolerance-evaluation')
  async getToleranceEvaluation(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const scenario = await this.service.findOne(id);
    if (!scenario || !scenario.riskId) {
      return {
        status: 'NO_RISK_LINKED',
        message: 'Scenario is not linked to a risk',
      };
    }
    return this.toleranceEngine.evaluateRisk(scenario.riskId, req.user?.id);
  }

  /**
   * Trigger manual recalculation for this scenario
   */
  @Post(':id/recalculate')
  async recalculate(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.calculationService.calculateScenario(
      id,
      'MANUAL',
      undefined,
      req.user?.id,
    );
  }

  // ============================================
  // BIRT IMPACT ASSESSMENT ENDPOINTS
  // ============================================

  @Get(':id/impact-assessments')
  async getImpactAssessments(
    @Param('id') id: string,
    @Query('isResidual') isResidual?: string,
  ) {
    const isResidualBool = isResidual === 'true';
    return this.service.getImpactAssessments(id, isResidualBool);
  }

  @Post(':id/impact-assessments')
  async saveImpactAssessments(
    @Param('id') id: string,
    @Body() data: SaveImpactAssessmentsDto,
  ) {
    return this.service.saveImpactAssessments(
      id,
      data.assessments,
      data.isResidual ?? false,
      data.organisationId,
    );
  }

  @Delete(':id/impact-assessments/:category')
  async deleteImpactAssessment(
    @Param('id') id: string,
    @Param('category') category: ImpactCategory,
    @Query('isResidual') isResidual?: string,
  ) {
    const isResidualBool = isResidual === 'true';
    return this.service.deleteImpactAssessment(id, category, isResidualBool);
  }

  @Delete(':id/impact-assessments')
  async clearImpactAssessments(
    @Param('id') id: string,
    @Query('isResidual') isResidual?: string,
  ) {
    const isResidualBool = isResidual !== undefined ? isResidual === 'true' : undefined;
    return this.service.clearImpactAssessments(id, isResidualBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const scenario = await this.service.findOne(id);
    if (!scenario) {
      throw new NotFoundException(`Scenario ${id} not found`);
    }
    return scenario;
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: UpdateScenarioDto,
  ) {
    return this.service.update(id, {
      ...data,
      updatedById: req.user.id,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ============================================
  // CONTROL LINKING ENDPOINTS
  // ============================================

  @Get(':id/controls')
  async getLinkedControls(@Param('id') id: string) {
    return this.service.getLinkedControls(id);
  }

  @Post(':id/controls')
  async linkControl(
    @Param('id') id: string,
    @Body() data: LinkControlDto,
  ) {
    return this.service.linkControl(id, data.controlId, data);
  }

  @Put(':id/controls/:controlId')
  async updateControlLink(
    @Param('id') id: string,
    @Param('controlId') controlId: string,
    @Body() data: UpdateControlLinkDto,
  ) {
    return this.service.updateControlLink(id, controlId, data);
  }

  @Delete(':id/controls/:controlId')
  async unlinkControl(
    @Param('id') id: string,
    @Param('controlId') controlId: string,
  ) {
    return this.service.unlinkControl(id, controlId);
  }
}
