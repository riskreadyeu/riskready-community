import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerProcessTools(server: McpServer) {
  server.tool(
    'list_business_processes',
    'List business processes with optional filters for criticality, BIA status, and BCP enablement. If not found, returns a not-found message. Do not invent or assume values.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      criticalityLevel: z.string().optional().describe('Filter by criticality level (e.g. "critical", "high", "medium", "low")'),
      bcpEnabled: z.boolean().optional().describe('Filter by BCP enablement'),
      biaStatus: z.string().optional().describe('Filter by BIA status (pending, in_progress, completed)'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_business_processes', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.isActive !== undefined) where.isActive = params.isActive;
      if (params.criticalityLevel) where.criticalityLevel = params.criticalityLevel;
      if (params.bcpEnabled !== undefined) where.bcpEnabled = params.bcpEnabled;
      if (params.biaStatus) where.biaStatus = params.biaStatus;

      const [processes, total] = await Promise.all([
        prisma.businessProcess.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { processCode: 'asc' },
          select: {
            id: true,
            name: true,
            processCode: true,
            processType: true,
            criticalityLevel: true,
            bcpEnabled: true,
            bcpCriticality: true,
            biaStatus: true,
            isActive: true,
            recoveryTimeObjectiveMinutes: true,
            recoveryPointObjectiveMinutes: true,
            processOwner: { select: { id: true, firstName: true, lastName: true } },
            department: { select: { id: true, name: true } },
          },
        }),
        prisma.businessProcess.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ processes, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_business_process',
    'Get a single business process with full details including BIA, BCP, and dependency information. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('BusinessProcess UUID'),
    },
    withErrorHandling('get_business_process', async ({ id }) => {
      const process = await prisma.businessProcess.findUnique({
        where: { id },
        include: {
          processOwner: { select: userSelectSafe },
          processManager: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true, departmentCode: true } },
          backupOwner: { select: { id: true, firstName: true, lastName: true } },
          parentProcess: { select: { id: true, name: true, processCode: true } },
          subProcesses: { select: { id: true, name: true, processCode: true, criticalityLevel: true } },
          _count: {
            select: {
              externalDependencies: true,
              assetLinks: true,
            },
          },
        },
      });

      if (!process) {
        return { content: [{ type: 'text' as const, text: `Business process ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(process, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_external_dependencies',
    'List external dependencies (vendors, suppliers, service providers). If not found, returns a not-found message. Do not invent or assume values.',
    {
      dependencyType: z.string().optional().describe('Filter by dependency type'),
      criticalityLevel: z.string().optional().describe('Filter by criticality level'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_external_dependencies', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.dependencyType) where.dependencyType = params.dependencyType;
      if (params.criticalityLevel) where.criticalityLevel = params.criticalityLevel;

      const [dependencies, total] = await Promise.all([
        prisma.externalDependency.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            dependencyType: true,
            description: true,
            criticalityLevel: true,
            singlePointOfFailure: true,
            contractEnd: true,
            annualCost: true,
            riskRating: true,
            lastAssessmentDate: true,
          },
        }),
        prisma.externalDependency.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ dependencies, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_external_dependency',
    'Get a single external dependency with full details. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('ExternalDependency UUID'),
    },
    withErrorHandling('get_external_dependency', async ({ id }) => {
      const dep = await prisma.externalDependency.findUnique({
        where: { id },
        include: {
          departments: { select: { id: true, name: true, departmentCode: true } },
          businessProcesses: { select: { id: true, name: true, processCode: true } },
          _count: { select: { providedAssets: true, vendorChanges: true } },
        },
      });

      if (!dep) {
        return { content: [{ type: 'text' as const, text: `External dependency ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(dep, null, 2),
        }],
      };
    }),
  );
}
