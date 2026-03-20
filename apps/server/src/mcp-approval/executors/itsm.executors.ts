import { ChangeService } from '../../itsm/services/change.service';
import { AssetService } from '../../itsm/services/asset.service';
import { CapacityService } from '../../itsm/services/capacity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';

export interface ItsmExecutorServices {
  changeService: ChangeService;
  assetService: AssetService;
  capacityService: CapacityService;
  prismaService: PrismaService;
}

export function registerItsmExecutors(executors: ExecutorMap, services: ItsmExecutorServices): void {
  const { changeService, assetService, capacityService, prismaService } = services;

  // --- Change management ---

  executors.set('UPDATE_CHANGE', (p, userId) => {
    const { changeId, ...data } = p as { changeId: string; [k: string]: any };
    return changeService.update(changeId, stripMcpMeta(data) as any, userId);
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
    return capacityService.updateCapacityPlan(capacityPlanId, stripMcpMeta(data) as any);
  });

  // --- Asset management ---

  executors.set('CREATE_ASSET', (p) =>
    assetService.create(prepareCreatePayload(p) as any),
  );

  executors.set('UPDATE_ASSET', (p) => {
    const { assetId, ...data } = p as { assetId: string; [k: string]: any };
    return assetService.update(assetId, stripMcpMeta(data) as any);
  });

  executors.set('DELETE_ASSET', (p) =>
    assetService.delete(p['assetId']),
  );

  executors.set('CREATE_ASSET_RELATIONSHIP', (p, userId) =>
    prismaService.assetRelationship.create({
      data: {
        fromAssetId: p['fromAssetId'],
        toAssetId: p['toAssetId'],
        relationshipType: p['relationshipType'],
        isCritical: p['isCritical'] ?? false,
        description: p['description'],
        notes: p['notes'],
        createdById: userId,
      },
    }),
  );

  executors.set('LINK_ASSET_CONTROL', (p) =>
    prismaService.assetControl.create({
      data: {
        assetId: p['assetId'],
        controlId: p['controlId'],
        status: p['status'] || 'planned',
        implementationNotes: p['implementationNotes'],
        implementedDate: p['implementedDate'] ? new Date(p['implementedDate']) : undefined,
        evidenceUrl: p['evidenceUrl'],
        lastVerified: p['lastVerified'] ? new Date(p['lastVerified']) : undefined,
      },
    }),
  );

  executors.set('LINK_ASSET_RISK', (p) =>
    prismaService.assetRisk.create({
      data: {
        assetId: p['assetId'],
        riskId: p['riskId'],
        impactLevel: p['impactLevel'],
        notes: p['notes'],
      },
    }),
  );

  // --- Change management (create) ---

  executors.set('CREATE_CHANGE', (p, userId) =>
    changeService.create(prepareCreatePayload(p) as any, userId),
  );

  // --- Capacity planning (create) ---

  executors.set('CREATE_CAPACITY_PLAN', (p) =>
    capacityService.createCapacityPlan(prepareCreatePayload(p) as any),
  );
}
