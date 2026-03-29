import { IncidentService } from '../../incidents/services/incident.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  TransitionIncidentPayload,
  CloseIncidentPayload,
  AddIncidentAssetPayload,
  LinkIncidentControlPayload,
  AddTimelineEntryPayload,
  CreateLessonLearnedPayload,
} from './payload-schemas';

export interface IncidentExecutorServices {
  incidentService: IncidentService;
  prismaService: PrismaService;
}

export function registerIncidentExecutors(executors: ExecutorMap, services: IncidentExecutorServices): void {
  const { incidentService, prismaService } = services;

  // --- Incident CRUD ---

  executors.set('CREATE_INCIDENT', (p, userId) => {
    const validated = validatePayload(CreateIncidentPayload, p, 'CREATE_INCIDENT');
    return incidentService.create(
      { ...prepareCreatePayload(validated), detectedAt: validated.detectedAt || new Date().toISOString() } as any,
      userId,
    );
  });

  executors.set('UPDATE_INCIDENT', (p, userId) => {
    const { incidentId, ...data } = validatePayload(UpdateIncidentPayload, p, 'UPDATE_INCIDENT');
    return incidentService.update(incidentId, stripMcpMeta(data) as any, userId);
  });

  // --- Status transitions ---

  executors.set('TRANSITION_INCIDENT', (p, userId) => {
    const validated = validatePayload(TransitionIncidentPayload, p, 'TRANSITION_INCIDENT');
    return incidentService.updateStatus(validated.incidentId, validated.targetStatus as any, userId, validated.notes);
  });

  executors.set('CLOSE_INCIDENT', (p, userId) => {
    const validated = validatePayload(CloseIncidentPayload, p, 'CLOSE_INCIDENT');
    return incidentService.updateStatus(validated.incidentId, 'CLOSED' as any, userId, validated.notes);
  });

  // --- Assets & Controls ---

  executors.set('ADD_INCIDENT_ASSET', (p) => {
    const validated = validatePayload(AddIncidentAssetPayload, p, 'ADD_INCIDENT_ASSET');
    return incidentService.addAffectedAsset(
      validated.incidentId,
      validated.assetId,
      validated.impactType as any, // Prisma enum
      validated.notes as any,
    );
  });

  executors.set('LINK_INCIDENT_CONTROL', (p) => {
    const validated = validatePayload(LinkIncidentControlPayload, p, 'LINK_INCIDENT_CONTROL');
    return incidentService.linkControl(
      validated.incidentId,
      validated.controlId,
      validated.linkType as any, // Prisma enum
      validated.notes as any,
    );
  });

  // --- Timeline (via PrismaService -- no dedicated service) ---

  executors.set('ADD_TIMELINE_ENTRY', (p, userId) => {
    const validated = validatePayload(AddTimelineEntryPayload, p, 'ADD_TIMELINE_ENTRY');
    return prismaService.incidentTimelineEntry.create({
      data: {
        incidentId: validated.incidentId,
        timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date(),
        entryType: validated.entryType as any, // Prisma enum
        title: validated.title,
        description: validated.description,
        visibility: (validated.visibility || 'INTERNAL') as any, // Prisma enum
        isAutomated: false,
        sourceSystem: validated.sourceSystem,
        createdById: userId,
      },
    });
  });

  // --- Lessons Learned (via PrismaService -- no dedicated service) ---

  executors.set('CREATE_LESSON_LEARNED', (p, userId) => {
    const validated = validatePayload(CreateLessonLearnedPayload, p, 'CREATE_LESSON_LEARNED');
    return prismaService.incidentLessonsLearned.create({
      data: {
        incidentId: validated.incidentId,
        category: validated.category as any, // Prisma enum
        observation: validated.observation,
        recommendation: validated.recommendation as any,
        priority: validated.priority as any, // Prisma enum (number)
        targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
        completedDate: validated.completedDate ? new Date(validated.completedDate) : undefined,
        status: (validated.status || 'OPEN') as any, // Prisma enum
        assignedToId: validated.assignedToId,
        createdById: userId,
      },
    });
  });
}
