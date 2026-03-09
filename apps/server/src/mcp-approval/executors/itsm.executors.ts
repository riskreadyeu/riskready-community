import { ChangeService } from '../../itsm/services/change.service';
import { AssetService } from '../../itsm/services/asset.service';
import { CapacityService } from '../../itsm/services/capacity.service';
import { ExecutorMap } from './types';

export interface ItsmExecutorServices {
  changeService: ChangeService;
  assetService: AssetService;
  capacityService: CapacityService;
}

export function registerItsmExecutors(executors: ExecutorMap, services: ItsmExecutorServices): void {
  const { changeService, assetService, capacityService } = services;

  // --- Change management ---

  executors.set('UPDATE_CHANGE', (p, userId) => {
    const { changeId, ...data } = p as { changeId: string; [k: string]: any };
    return changeService.update(changeId, data as any, userId);
  });

  executors.set('APPROVE_CHANGE', (p, userId) => {
    const { changeId, comments } = p as { changeId: string; comments?: string; [k: string]: any };
    return changeService.update(changeId, { status: 'APPROVED', approvalComments: comments } as any, userId);
  });

  executors.set('REJECT_CHANGE', (p, userId) => {
    const { changeId, rejectionReason } = p as { changeId: string; rejectionReason: string; [k: string]: any };
    return changeService.update(changeId, { status: 'REJECTED', rejectionReason } as any, userId);
  });

  executors.set('IMPLEMENT_CHANGE', (p, userId) => {
    const { changeId, implementationNotes, actualStart } = p as {
      changeId: string;
      implementationNotes?: string;
      actualStart?: string;
      [k: string]: any;
    };
    return changeService.update(changeId, {
      status: 'IMPLEMENTING',
      implementationNotes,
      actualStart: actualStart ? new Date(actualStart) : undefined,
    } as any, userId);
  });

  executors.set('COMPLETE_CHANGE', (p, userId) => {
    const { changeId, successful, completionNotes, testResults, lessonsLearned, pirRequired, pirNotes } = p as {
      changeId: string;
      successful: boolean;
      completionNotes?: string;
      testResults?: string;
      lessonsLearned?: string;
      pirRequired?: boolean;
      pirNotes?: string;
      [k: string]: any;
    };
    return changeService.update(changeId, {
      status: successful ? 'COMPLETED' : 'FAILED',
      completionNotes,
      testResults,
      lessonsLearned,
      pirRequired,
      pirNotes,
      actualEnd: new Date(),
    } as any, userId);
  });

  executors.set('CANCEL_CHANGE', (p, userId) => {
    const { changeId, cancellationReason } = p as { changeId: string; cancellationReason: string; [k: string]: any };
    return changeService.update(changeId, { status: 'CANCELLED', cancellationReason } as any, userId);
  });

  // --- Capacity planning ---

  executors.set('UPDATE_CAPACITY_PLAN', (p) => {
    const { capacityPlanId, ...data } = p as { capacityPlanId: string; [k: string]: any };
    return capacityService.updateCapacityPlan(capacityPlanId, data as any);
  });

  // --- Asset management ---

  executors.set('DELETE_ASSET', (p) =>
    assetService.delete(p['assetId']),
  );
}
