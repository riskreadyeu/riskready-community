import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerIncidentDetailTools(server: McpServer) {
  server.tool(
    'list_incident_timeline',
    'List timeline entries for an incident, ordered chronologically.',
    {
      incidentId: z.string().describe('Incident UUID'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size'),
    },
    withErrorHandling('list_incident_timeline', async (params) => {
      const incident = await prisma.incident.findUnique({
        where: { id: params.incidentId },
        select: { id: true, referenceNumber: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }

      const [entries, total] = await Promise.all([
        prisma.incidentTimelineEntry.findMany({
          where: { incidentId: params.incidentId },
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            timestamp: true,
            entryType: true,
            title: true,
            description: true,
            visibility: true,
            isAutomated: true,
            sourceSystem: true,
            createdBy: { select: { id: true, name: true } },
          },
        }),
        prisma.incidentTimelineEntry.count({ where: { incidentId: params.incidentId } }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ incidentRef: incident.referenceNumber, entries, total }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_incident_lessons',
    'List lessons learned for an incident.',
    {
      incidentId: z.string().describe('Incident UUID'),
    },
    withErrorHandling('list_incident_lessons', async ({ incidentId }) => {
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        select: { id: true, referenceNumber: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${incidentId} not found` }], isError: true };
      }

      const lessons = await prisma.incidentLessonsLearned.findMany({
        where: { incidentId },
        take: 1000,
        orderBy: { priority: 'asc' },
        select: {
          id: true,
          category: true,
          observation: true,
          recommendation: true,
          status: true,
          priority: true,
          targetDate: true,
          completedDate: true,
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ incidentRef: incident.referenceNumber, lessons, count: lessons.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_incident_assets',
    'Get affected assets for an incident.',
    {
      incidentId: z.string().describe('Incident UUID'),
    },
    withErrorHandling('get_incident_assets', async ({ incidentId }) => {
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        select: { id: true, referenceNumber: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${incidentId} not found` }], isError: true };
      }

      const assets = await prisma.incidentAsset.findMany({
        where: { incidentId },
        take: 1000,
        select: {
          id: true,
          impactType: true,
          confirmedAt: true,
          notes: true,
          asset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              assetType: true,
              businessCriticality: true,
              status: true,
            },
          },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ incidentRef: incident.referenceNumber, assets, count: assets.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_incident_controls',
    'Get control links for an incident (failed, bypassed, effective controls).',
    {
      incidentId: z.string().describe('Incident UUID'),
    },
    withErrorHandling('get_incident_controls', async ({ incidentId }) => {
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        select: { id: true, referenceNumber: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${incidentId} not found` }], isError: true };
      }

      const controls = await prisma.incidentControl.findMany({
        where: { incidentId },
        take: 1000,
        select: {
          id: true,
          linkType: true,
          notes: true,
          control: {
            select: {
              id: true,
              controlId: true,
              name: true,
              theme: true,
              implementationStatus: true,
            },
          },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ incidentRef: incident.referenceNumber, controls, count: controls.length }, null, 2),
        }],
      };
    }),
  );
}
