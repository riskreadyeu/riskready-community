import { Injectable, Logger } from '@nestjs/common';
import { McpActionType } from '@prisma/client';
import { ControlService } from '../controls/services/control.service';
import { AssessmentService } from '../controls/services/assessment.service';
import { AssessmentTestService } from '../controls/services/assessment-test.service';
import { SOAService } from '../controls/services/soa.service';
import { SOAEntryService } from '../controls/services/soa-entry.service';
import { ScopeItemService } from '../controls/services/scope-item.service';
import { ExecutorMap } from './executors/types';
import { registerControlExecutors } from './executors/control.executors';

@Injectable()
export class McpApprovalExecutorService {
  private readonly logger = new Logger(McpApprovalExecutorService.name);
  private readonly executors: ExecutorMap = new Map();

  constructor(
    private controlService: ControlService,
    private assessmentService: AssessmentService,
    private assessmentTestService: AssessmentTestService,
    private soaService: SOAService,
    private soaEntryService: SOAEntryService,
    private scopeItemService: ScopeItemService,
  ) {
    registerControlExecutors(this.executors, {
      controlService: this.controlService,
      assessmentService: this.assessmentService,
      assessmentTestService: this.assessmentTestService,
      soaService: this.soaService,
      soaEntryService: this.soaEntryService,
      scopeItemService: this.scopeItemService,
    });
  }

  canExecute(actionType: McpActionType): boolean {
    return this.executors.has(actionType);
  }

  async execute(actionType: McpActionType, payload: Record<string, any>, reviewedById: string): Promise<unknown> {
    const executor = this.executors.get(actionType);
    if (!executor) {
      this.logger.warn(`No executor registered for action type: ${actionType}`);
      return null;
    }

    this.logger.log(`Executing action type: ${actionType}`);
    return executor(payload, reviewedById);
  }
}
