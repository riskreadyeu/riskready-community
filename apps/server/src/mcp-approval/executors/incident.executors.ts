import { IncidentService } from '../../incidents/services/incident.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutorMap, stripMcpMeta } from './types';

export interface IncidentExecutorServices {
  incidentService: IncidentService;
  prismaService: PrismaService;
}

export function registerIncidentExecutors(executors: ExecutorMap, services: IncidentExecutorServices): void {
  const { incidentService, prismaService } = services;

  // --- Incident CRUD ---

  executors.set('CREATE_INCIDENT', (p, userId) =>
    incidentService.create({ ...p, detectedAt: p['detectedAt'] || new Date().toISOString() } as any, userId),
  );

  executors.set('UPDATE_INCIDENT', (p, userId) => {
    const { incidentId, ...data } = p as { incidentId: string; [k: string]: any };
    return incidentService.update(incidentId, stripMcpMeta(data) as any, userId);
  });

  // --- Status transitions ---

  executors.set('TRANSITION_INCIDENT', (p, userId) =>
    incidentService.updateStatus(p['incidentId'], p['targetStatus'], userId, p['notes']),
  );

  executors.set('CLOSE_INCIDENT', (p, userId) =>
    incidentService.updateStatus(p['incidentId'], 'CLOSED' as any, userId, p['notes']),
  );

  // --- Assets & Controls ---

  executors.set('ADD_INCIDENT_ASSET', (p) =>
    incidentService.addAffectedAsset(p['incidentId'], p['assetId'], p['impactType'], p['notes']),
  );

  executors.set('LINK_INCIDENT_CONTROL', (p) =>
    incidentService.linkControl(p['incidentId'], p['controlId'], p['linkType'], p['notes']),
  );

  // --- Timeline (via PrismaService — no dedicated service) ---

  executors.set('ADD_TIMELINE_ENTRY', (p, userId) =>
    prismaService.incidentTimelineEntry.create({
      data: {
        incidentId: p['incidentId'],
        timestamp: p['timestamp'] ? new Date(p['timestamp']) : new Date(),
        entryType: p['entryType'],
        title: p['title'],
        description: p['description'],
        visibility: p['visibility'] || 'INTERNAL',
        isAutomated: false,
        createdById: userId,
      },
    }),
  );

  // --- Lessons Learned (via PrismaService — no dedicated service) ---

  executors.set('CREATE_LESSON_LEARNED', (p, userId) =>
    prismaService.incidentLessonsLearned.create({
      data: {
        incidentId: p['incidentId'],
        category: p['category'],
        observation: p['observation'],
        recommendation: p['recommendation'],
        priority: p['priority'],
        targetDate: p['targetDate'] ? new Date(p['targetDate']) : undefined,
        assignedToId: p['assignedToId'],
        createdById: userId,
      },
    }),
  );
}
