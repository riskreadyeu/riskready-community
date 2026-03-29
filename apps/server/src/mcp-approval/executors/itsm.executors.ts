import { ChangeService } from '../../itsm/services/change.service';
import { AssetService } from '../../itsm/services/asset.service';
import { CapacityService } from '../../itsm/services/capacity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  UpdateChangePayload,
  ApproveChangePayload,
  RejectChangePayload,
  ImplementChangePayload,
  CompleteChangePayload,
  CancelChangePayload,
  UpdateCapacityPlanPayload,
  CreateAssetPayload,
  UpdateAssetPayload,
  DeleteAssetPayload,
  CreateAssetRelationshipPayload,
  LinkAssetControlPayload,
  LinkAssetRiskPayload,
  CreateChangePayload,
  CreateCapacityPlanPayload,
} from './payload-schemas';

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
    const { changeId, ...data } = validatePayload(UpdateChangePayload, p, 'UPDATE_CHANGE');
    return changeService.update(changeId, stripMcpMeta(data) as any, userId);
  });

  executors.set('APPROVE_CHANGE', (p, userId) => {
    const validated = validatePayload(ApproveChangePayload, p, 'APPROVE_CHANGE');
    return changeService.update(
      validated.changeId,
      { status: 'APPROVED', approvalComments: validated.comments } as any,
      userId,
    );
  });

  executors.set('REJECT_CHANGE', (p, userId) => {
    const validated = validatePayload(RejectChangePayload, p, 'REJECT_CHANGE');
    return changeService.update(
      validated.changeId,
      { status: 'REJECTED', rejectionReason: validated.rejectionReason } as any,
      userId,
    );
  });

  executors.set('IMPLEMENT_CHANGE', (p, userId) => {
    const validated = validatePayload(ImplementChangePayload, p, 'IMPLEMENT_CHANGE');
    return changeService.update(validated.changeId, {
      status: 'IMPLEMENTING',
      implementationNotes: validated.implementationNotes,
      actualStart: validated.actualStart ? new Date(validated.actualStart) : undefined,
    } as any, userId);
  });

  executors.set('COMPLETE_CHANGE', (p, userId) => {
    const validated = validatePayload(CompleteChangePayload, p, 'COMPLETE_CHANGE');
    return changeService.update(validated.changeId, {
      status: validated.successful ? 'COMPLETED' : 'FAILED',
      completionNotes: validated.completionNotes,
      testResults: validated.testResults,
      lessonsLearned: validated.lessonsLearned,
      pirRequired: validated.pirRequired,
      pirNotes: validated.pirNotes,
      actualEnd: new Date(),
    } as any, userId);
  });

  executors.set('CANCEL_CHANGE', (p, userId) => {
    const validated = validatePayload(CancelChangePayload, p, 'CANCEL_CHANGE');
    return changeService.update(
      validated.changeId,
      { status: 'CANCELLED', cancellationReason: validated.cancellationReason } as any,
      userId,
    );
  });

  // --- Capacity planning ---

  executors.set('UPDATE_CAPACITY_PLAN', (p) => {
    const { capacityPlanId, ...data } = validatePayload(UpdateCapacityPlanPayload, p, 'UPDATE_CAPACITY_PLAN');
    return capacityService.updateCapacityPlan(capacityPlanId, stripMcpMeta(data) as any);
  });

  // --- Asset management ---

  executors.set('CREATE_ASSET', (p) => {
    const validated = validatePayload(CreateAssetPayload, p, 'CREATE_ASSET');
    return assetService.create(prepareCreatePayload(validated) as any);
  });

  executors.set('UPDATE_ASSET', (p) => {
    const { assetId, ...data } = validatePayload(UpdateAssetPayload, p, 'UPDATE_ASSET');
    return assetService.update(assetId, stripMcpMeta(data) as any);
  });

  executors.set('DELETE_ASSET', (p) => {
    const validated = validatePayload(DeleteAssetPayload, p, 'DELETE_ASSET');
    return assetService.delete(validated.assetId);
  });

  executors.set('CREATE_ASSET_RELATIONSHIP', (p, userId) => {
    const validated = validatePayload(CreateAssetRelationshipPayload, p, 'CREATE_ASSET_RELATIONSHIP');
    return prismaService.assetRelationship.create({
      data: {
        fromAssetId: validated.fromAssetId,
        toAssetId: validated.toAssetId,
        relationshipType: validated.relationshipType as any, // Prisma enum
        isCritical: validated.isCritical ?? false,
        description: validated.description,
        notes: validated.notes,
        createdById: userId,
      },
    });
  });

  executors.set('LINK_ASSET_CONTROL', (p) => {
    const validated = validatePayload(LinkAssetControlPayload, p, 'LINK_ASSET_CONTROL');
    return prismaService.assetControl.create({
      data: {
        assetId: validated.assetId,
        controlId: validated.controlId,
        status: validated.status || 'planned',
        implementationNotes: validated.implementationNotes,
        implementedDate: validated.implementedDate ? new Date(validated.implementedDate) : undefined,
        evidenceUrl: validated.evidenceUrl,
        lastVerified: validated.lastVerified ? new Date(validated.lastVerified) : undefined,
      },
    });
  });

  executors.set('LINK_ASSET_RISK', (p) => {
    const validated = validatePayload(LinkAssetRiskPayload, p, 'LINK_ASSET_RISK');
    return prismaService.assetRisk.create({
      data: {
        assetId: validated.assetId,
        riskId: validated.riskId,
        impactLevel: validated.impactLevel,
        notes: validated.notes,
      },
    });
  });

  // --- Change management (create) ---

  executors.set('CREATE_CHANGE', (p, userId) => {
    const validated = validatePayload(CreateChangePayload, p, 'CREATE_CHANGE');
    return changeService.create(prepareCreatePayload(validated) as any, userId);
  });

  // --- Capacity planning (create) ---

  executors.set('CREATE_CAPACITY_PLAN', (p) => {
    const validated = validatePayload(CreateCapacityPlanPayload, p, 'CREATE_CAPACITY_PLAN');
    return capacityService.createCapacityPlan(prepareCreatePayload(validated) as any);
  });
}
