import {
  Controller,
  Get,
  Post,
  Param,
  Request,
} from '@nestjs/common';
import { ControlRiskIntegrationService } from '../services/control-risk-integration.service';
import { AuthenticatedRequest } from '../../shared/types';

/**
 * Control-Risk Integration Controller
 * 
 * Provides API endpoints for:
 * - Getting control effectiveness for risks/scenarios
 * - Calculating residual scores based on linked controls
 * - Triggering recalculation when controls are updated
 */
@Controller('risks/control-effectiveness')
export class ControlRiskIntegrationController {
  constructor(private readonly service: ControlRiskIntegrationService) {}

  /**
   * Get control effectiveness summary for a risk
   *
   * @deprecated Control linking is now at the scenario level.
   * Use GET scenario/:scenarioId instead.
   * This endpoint will be removed in a future version.
   *
   * @param riskId - The risk ID
   * @returns Control effectiveness summary with strength ratings
   */
  @Get('risk/:riskId')
  async getControlEffectivenessForRisk(@Param('riskId') riskId: string) {
    return this.service.getControlEffectivenessSummary(riskId);
  }

  /**
   * Get aggregated control effectiveness data for a risk
   * Returns detailed effectiveness data for all linked controls
   *
   * @deprecated Control linking is now at the scenario level.
   * Use GET scenario/:scenarioId instead.
   * This endpoint will be removed in a future version.
   *
   * @param riskId - The risk ID
   * @returns Aggregated control effectiveness
   */
  @Get('risk/:riskId/aggregate')
  async getAggregatedEffectiveness(@Param('riskId') riskId: string) {
    return this.service.getControlEffectivenessForRisk(riskId);
  }

  /**
   * Get control effectiveness for a scenario (uses parent risk's controls)
   * 
   * @param scenarioId - The scenario ID
   * @returns Control effectiveness for the scenario's parent risk
   */
  @Get('scenario/:scenarioId')
  async getControlEffectivenessForScenario(@Param('scenarioId') scenarioId: string) {
    return this.service.getControlEffectivenessForScenario(scenarioId);
  }

  /**
   * Calculate and update residual scores for a scenario based on linked controls
   * 
   * This endpoint:
   * 1. Gets the scenario's parent risk's linked controls
   * 2. Calculates aggregate control effectiveness
   * 3. Maps effectiveness to control strength
   * 4. Calculates residual likelihood and impact
   * 5. Updates the scenario with new residual values
   * 6. Recalculates the parent risk's aggregate scores
   * 
   * @param scenarioId - The scenario ID to update
   * @returns Updated residual scores and control effectiveness details
   */
  @Post('scenario/:scenarioId/calculate-residual')
  async calculateResidualFromControls(
    @Request() req: AuthenticatedRequest,
    @Param('scenarioId') scenarioId: string
  ) {
    return this.service.calculateResidualFromControls(scenarioId, req.user?.id);
  }

  /**
   * Recalculate residual scores for all scenarios of a risk
   *
   * @deprecated Uses deprecated risk-level control linking internally.
   * Prefer POST scenario/:scenarioId/calculate-residual per scenario instead.
   *
   * Useful when controls are updated and all scenarios need to be refreshed
   *
   * @param riskId - The risk ID
   * @returns Summary of updated scenarios and new risk scores
   */
  @Post('risk/:riskId/recalculate-all')
  async recalculateAllScenarioResiduals(
    @Request() req: AuthenticatedRequest,
    @Param('riskId') riskId: string
  ) {
    return this.service.recalculateAllScenarioResiduals(riskId, req.user?.id);
  }
}

