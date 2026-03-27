import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerIncidentTools(server: McpServer) {
  server.tool(
    'list_incidents',
    'List incidents with optional filters. Returns incident details with pagination. If not found, returns a not-found message. Do not invent or assume values.',
    {
      status: z.enum(['DETECTED', 'TRIAGED', 'INVESTIGATING', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'POST_INCIDENT', 'CLOSED']).optional().describe('Filter by incident status'),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Filter by severity'),
      category: z.enum(['MALWARE', 'PHISHING', 'DENIAL_OF_SERVICE', 'DATA_BREACH', 'UNAUTHORIZED_ACCESS', 'INSIDER_THREAT', 'PHYSICAL', 'SUPPLY_CHAIN', 'SYSTEM_FAILURE', 'CONFIGURATION_ERROR', 'OTHER']).optional().describe('Filter by category'),
      organisationId: z.string().optional().describe('Organisation UUID'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_incidents', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.organisationId) where.organisationId = params.organisationId;
      if (params.status) where.status = params.status;
      if (params.severity) where.severity = params.severity;
      if (params.category) where.category = params.category;

      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { detectedAt: 'desc' },
          select: {
            id: true,
            referenceNumber: true,
            title: true,
            status: true,
            severity: true,
            category: true,
            detectedAt: true,
            classifiedAt: true,
            closedAt: true,
            isConfirmed: true,
            source: true,
            confidentialityBreach: true,
            integrityBreach: true,
            availabilityBreach: true,
            handler: { select: { id: true, firstName: true, lastName: true } },
            incidentManager: { select: { id: true, firstName: true, lastName: true } },
            organisationId: true,
          },
        }),
        prisma.incident.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ incidents, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_incident',
    'Get a single incident with full details including timeline count, affected assets count, lessons learned count, and control links. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('Incident UUID'),
    },
    withErrorHandling('get_incident', async ({ id }) => {
      const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
          handler: { select: userSelectSafe },
          incidentManager: { select: userSelectSafe },
          reporter: { select: userSelectSafe },
          incidentType: { select: { id: true, name: true, category: true } },
          attackVector: { select: { id: true, name: true, mitreAttackId: true } },
          _count: {
            select: {
              affectedAssets: true,
              evidence: true,
              timeline: true,
              lessonsLearned: true,
              controlLinks: true,
              nonconformityLinks: true,
            },
          },
        },
      });

      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(incident, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'search_incidents',
    'Search incidents by reference number, title, or description. If not found, returns a not-found message. Do not invent or assume values.',
    {
      query: z.string().max(200).describe('Search term (matches against referenceNumber, title, description)'),
      organisationId: z.string().optional().describe('Organisation UUID'),
    },
    withErrorHandling('search_incidents', async ({ query, organisationId }) => {
      const incidents = await prisma.incident.findMany({
        where: {
          ...(organisationId && { organisationId }),
          OR: [
            { referenceNumber: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { detectedAt: 'desc' },
        select: {
          id: true,
          referenceNumber: true,
          title: true,
          status: true,
          severity: true,
          category: true,
          detectedAt: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ incidents, count: incidents.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_incident_stats',
    'Get aggregate incident statistics: total count, by status, by severity, by category, open incidents, and CIA breach counts. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_incident_stats', async () => {
      const [
        total,
        byStatus,
        bySeverity,
        byCategory,
        confidentialityBreaches,
        integrityBreaches,
        availabilityBreaches,
      ] = await Promise.all([
        prisma.incident.count(),
        prisma.incident.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.incident.groupBy({ by: ['severity'], _count: { _all: true } }),
        prisma.incident.groupBy({ by: ['category'], _count: { _all: true } }),
        prisma.incident.count({ where: { confidentialityBreach: true } }),
        prisma.incident.count({ where: { integrityBreach: true } }),
        prisma.incident.count({ where: { availabilityBreach: true } }),
      ]);

      const openStatuses = ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'POST_INCIDENT'] as const;
      const openCount = byStatus
        .filter((s: typeof byStatus[number]) => (openStatuses as readonly string[]).includes(s.status))
        .reduce((sum: number, s: typeof byStatus[number]) => sum + s._count._all, 0);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            openCount,
            byStatus: Object.fromEntries(byStatus.map((s: typeof byStatus[number]) => [s.status, s._count._all])),
            bySeverity: Object.fromEntries(bySeverity.map((s: typeof bySeverity[number]) => [s.severity, s._count._all])),
            byCategory: Object.fromEntries(byCategory.map((s: typeof byCategory[number]) => [s.category, s._count._all])),
            ciaBreaches: {
              confidentiality: confidentialityBreaches,
              integrity: integrityBreaches,
              availability: availabilityBreaches,
            },
          }, null, 2),
        }],
      };
    }),
  );
}
