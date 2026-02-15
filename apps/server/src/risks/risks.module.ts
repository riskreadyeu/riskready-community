import { Module } from '@nestjs/common';

// Core services
import { RiskService } from './services/risk.service';
import { RiskScenarioService } from './services/risk-scenario.service';
import { RiskAuditService } from './services/risk-audit.service';
import { RiskExportService } from './services/risk-export.service';
import { RiskToleranceStatementService } from './services/rts.service';
import { TreatmentPlanService } from './services/treatment-plan.service';
import { TreatmentNotificationService } from './services/treatment-notification.service';
import { TreatmentHistoryService } from './services/treatment-history.service';
import { ControlRiskIntegrationService } from './services/control-risk-integration.service';
import { RiskCalculationService } from './services/risk-calculation.service';
import { ToleranceEngineService } from './services/tolerance-engine.service';
import { RiskEventBusService } from './services/risk-event-bus.service';
import { ScenarioEntityResolverService } from './services/scenario-entity-resolver.service';
import { KRIService } from './services/kri.service';

// Controllers
import { RiskController } from './controllers/risk.controller';
import { RiskScenarioController } from './controllers/risk-scenario.controller';
import { RiskToleranceStatementController } from './controllers/rts.controller';
import { TreatmentPlanController } from './controllers/treatment-plan.controller';
import { ControlRiskIntegrationController } from './controllers/control-risk-integration.controller';
import { RiskScoringController } from './controllers/risk-scoring.controller';
import { KRIController } from './controllers/kri.controller';

@Module({
  imports: [],
  controllers: [
    ControlRiskIntegrationController,
    RiskToleranceStatementController,
    TreatmentPlanController,
    RiskController,
    RiskScoringController,
    RiskScenarioController,
    KRIController,
  ],
  providers: [
    RiskService,
    RiskScenarioService,
    RiskAuditService,
    RiskExportService,
    RiskToleranceStatementService,
    TreatmentPlanService,
    TreatmentNotificationService,
    TreatmentHistoryService,
    ControlRiskIntegrationService,
    RiskCalculationService,
    ToleranceEngineService,
    RiskEventBusService,
    ScenarioEntityResolverService,
    KRIService,
  ],
  exports: [
    RiskService,
    RiskScenarioService,
    RiskToleranceStatementService,
    TreatmentPlanService,
    ControlRiskIntegrationService,
    RiskCalculationService,
    ToleranceEngineService,
    KRIService,
  ],
})
export class RisksModule { }
