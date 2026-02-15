import { Module } from '@nestjs/common';
// PrismaService provided globally by PrismaModule

// Services
import { AssetService } from './services/asset.service';
import { AssetRelationshipService } from './services/asset-relationship.service';
import { AssetRiskService } from './services/asset-risk.service';
import { AssetRiskCalculationService } from './services/asset-risk-calculation.service';
import { ChangeService } from './services/change.service';
import { ChangeApprovalService } from './services/change-approval.service';
import { ChangeTemplateService } from './services/change-template.service';
import { CapacityService } from './services/capacity.service';

// Controllers
import { AssetController } from './controllers/asset.controller';
import { AssetRelationshipController } from './controllers/asset-relationship.controller';
import { AssetRiskController } from './controllers/asset-risk.controller';
import { ChangeController } from './controllers/change.controller';
import { ChangeApprovalController } from './controllers/change-approval.controller';
import { ChangeTemplateController } from './controllers/change-template.controller';
import { CapacityController } from './controllers/capacity.controller';
import { ITSMDashboardController } from './controllers/itsm-dashboard.controller';

@Module({
  controllers: [
    AssetController,
    AssetRelationshipController,
    AssetRiskController,
    ChangeController,
    ChangeApprovalController,
    ChangeTemplateController,
    CapacityController,
    ITSMDashboardController,
  ],
  providers: [
    AssetService,
    AssetRelationshipService,
    AssetRiskService,
    AssetRiskCalculationService,
    ChangeService,
    ChangeApprovalService,
    ChangeTemplateService,
    CapacityService,
  ],
  exports: [
    AssetService,
    AssetRelationshipService,
    AssetRiskService,
    AssetRiskCalculationService,
    ChangeService,
    ChangeApprovalService,
    ChangeTemplateService,
    CapacityService,
  ],
})
export class ITSMModule {}
