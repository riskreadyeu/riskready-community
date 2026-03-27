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
import { CreateScenarioDto, UpdateScenarioDto } from '../dto/risk.dto';
import {
  LinkControlDto,
  UpdateControlLinkDto,
} from '../dto/risk-scenario.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('risk-scenarios')
export class RiskScenarioController {
  constructor(
    private readonly service: RiskScenarioService,
    private readonly calculationService: RiskCalculationService,
    private readonly toleranceEngine: ToleranceEngineService,
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
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
  ) {
    return this.calculationService.calculateScenario(
      id,
      'MANUAL',
      undefined,
      req.user?.id,
    );
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
    @Request() req: AuthenticatedRequest,
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
