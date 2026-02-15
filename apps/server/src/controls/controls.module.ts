import { Module } from '@nestjs/common';
// PrismaService provided globally by PrismaModule
// EventEmitter2 provided globally by EventEmitterModule

// Services
import { ControlService } from './services/control.service';
import { SOAService } from './services/soa.service';
import { SOAEntryService } from './services/soa-entry.service';
import { ScopeItemService } from './services/scope-item.service';
import { AssessmentService } from './services/assessment.service';
import { AssessmentTestService } from './services/assessment-test.service';
import { ControlReportingService } from './services/control-reporting.service';
import { GapAnalysisService } from './services/gap-analysis.service';

// Controllers
import { ControlController } from './controllers/control.controller';
import { SOAController } from './controllers/soa.controller';
import { ScopeItemController } from './controllers/scope-item.controller';
import { AssessmentController } from './controllers/assessment.controller';

@Module({
  imports: [],
  controllers: [
    ControlController,
    SOAController,
    ScopeItemController,
    AssessmentController,
  ],
  providers: [
    ControlService,
    SOAService,
    SOAEntryService,
    ScopeItemService,
    AssessmentService,
    AssessmentTestService,
    ControlReportingService,
    GapAnalysisService,
  ],
  exports: [
    ControlService,
    SOAService,
    SOAEntryService,
    ScopeItemService,
    AssessmentService,
    AssessmentTestService,
  ],
})
export class ControlsModule {}
