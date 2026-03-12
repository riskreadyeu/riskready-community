import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerCapacityTools(server: McpServer) {
  server.tool(
    'get_capacity_records',
    'List capacity utilization records for an asset with optional date range filter. Sorted by recorded date descending.',
    {
      assetId: z.string().describe('Asset UUID'),
      fromDate: z.string().datetime().optional().describe('Start date filter (ISO 8601)'),
      toDate: z.string().datetime().optional().describe('End date filter (ISO 8601)'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('get_capacity_records', async ({ assetId, fromDate, toDate, skip, take }) => {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${assetId} not found` }], isError: true };
      }

      const where: Record<string, unknown> = { assetId };
      if (fromDate || toDate) {
        const dateFilter: Record<string, Date> = {};
        if (fromDate) dateFilter.gte = new Date(fromDate);
        if (toDate) dateFilter.lte = new Date(toDate);
        where.recordedAt = dateFilter;
      }

      const [results, count] = await Promise.all([
        prisma.capacityRecord.findMany({
          where,
          skip,
          take,
          orderBy: { recordedAt: 'desc' },
          select: {
            id: true,
            recordedAt: true,
            cpuUsagePercent: true,
            memoryUsagePercent: true,
            storageUsagePercent: true,
            networkUsagePercent: true,
            customMetrics: true,
            source: true,
          },
        }),
        prisma.capacityRecord.count({ where }),
      ]);

      const response: Record<string, unknown> = {
        asset: { id: asset.id, assetTag: asset.assetTag, name: asset.name },
        results,
        total: count,
        skip,
        take,
      };
      if (count === 0) {
        response.note = `No capacity records found for asset ${asset.assetTag}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'list_capacity_plans',
    'List capacity plans with optional filters. Returns plan title, status, asset, and projection details.',
    {
      status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().describe('Filter by capacity plan status'),
      assetId: z.string().optional().describe('Filter by asset UUID'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_capacity_plans', async ({ status, assetId, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;

      const [results, count] = await Promise.all([
        prisma.capacityPlan.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            currentCapacity: true,
            currentUtilizationPercent: true,
            projectedGrowthPercent: true,
            projectionPeriodMonths: true,
            projectedExhaustionDate: true,
            recommendedAction: true,
            recommendedDate: true,
            estimatedCost: true,
            costCurrency: true,
            reviewDate: true,
            nextReviewDate: true,
            createdAt: true,
            asset: { select: { id: true, assetTag: true, name: true, assetType: true } },
          },
        }),
        prisma.capacityPlan.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No capacity plans found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_capacity_plan',
    'Get a single capacity plan with full details including associated asset.',
    {
      id: z.string().describe('Capacity plan UUID'),
    },
    withErrorHandling('get_capacity_plan', async ({ id }) => {
      const plan = await prisma.capacityPlan.findUnique({
        where: { id },
        include: {
          asset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              assetType: true,
              status: true,
              businessCriticality: true,
              cpuCapacity: true,
              cpuUsagePercent: true,
              memoryCapacityGB: true,
              memoryUsagePercent: true,
              storageCapacityGB: true,
              storageUsagePercent: true,
              capacityStatus: true,
            },
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!plan) {
        return { content: [{ type: 'text' as const, text: `Capacity plan with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(plan, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_capacity_alerts',
    'Find assets where resource utilization exceeds configured thresholds. Returns assets with usage vs threshold details for CPU, memory, and storage.',
    {},
    withErrorHandling('get_capacity_alerts', async () => {
      // Find assets where any usage exceeds its threshold
      const assets = await prisma.asset.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              AND: [
                { cpuUsagePercent: { not: null } },
                { cpuThresholdPercent: { not: null } },
              ],
            },
            {
              AND: [
                { memoryUsagePercent: { not: null } },
                { memoryThresholdPercent: { not: null } },
              ],
            },
            {
              AND: [
                { storageUsagePercent: { not: null } },
                { storageThresholdPercent: { not: null } },
              ],
            },
          ],
        },
        select: {
          id: true,
          assetTag: true,
          name: true,
          assetType: true,
          businessCriticality: true,
          capacityStatus: true,
          cpuUsagePercent: true,
          cpuThresholdPercent: true,
          memoryUsagePercent: true,
          memoryThresholdPercent: true,
          storageUsagePercent: true,
          storageThresholdPercent: true,
          projectedExhaustionDate: true,
        },
        orderBy: { businessCriticality: 'asc' },
      });

      // Filter to only those actually exceeding thresholds
      const alerts = assets
        .filter(a => {
          const cpuExceeded = a.cpuUsagePercent != null && a.cpuThresholdPercent != null && a.cpuUsagePercent > a.cpuThresholdPercent;
          const memExceeded = a.memoryUsagePercent != null && a.memoryThresholdPercent != null && a.memoryUsagePercent > a.memoryThresholdPercent;
          const storExceeded = a.storageUsagePercent != null && a.storageThresholdPercent != null && a.storageUsagePercent > a.storageThresholdPercent;
          return cpuExceeded || memExceeded || storExceeded;
        })
        .map(a => ({
          id: a.id,
          assetTag: a.assetTag,
          name: a.name,
          assetType: a.assetType,
          businessCriticality: a.businessCriticality,
          capacityStatus: a.capacityStatus,
          cpuAlert: a.cpuUsagePercent != null && a.cpuThresholdPercent != null && a.cpuUsagePercent > a.cpuThresholdPercent
            ? { usage: a.cpuUsagePercent, threshold: a.cpuThresholdPercent }
            : null,
          memoryAlert: a.memoryUsagePercent != null && a.memoryThresholdPercent != null && a.memoryUsagePercent > a.memoryThresholdPercent
            ? { usage: a.memoryUsagePercent, threshold: a.memoryThresholdPercent }
            : null,
          storageAlert: a.storageUsagePercent != null && a.storageThresholdPercent != null && a.storageUsagePercent > a.storageThresholdPercent
            ? { usage: a.storageUsagePercent, threshold: a.storageThresholdPercent }
            : null,
          projectedExhaustionDate: a.projectedExhaustionDate,
        }));

      const response: Record<string, unknown> = { alerts, count: alerts.length };
      if (alerts.length === 0) {
        response.note = 'No assets currently exceeding capacity thresholds.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );
}
