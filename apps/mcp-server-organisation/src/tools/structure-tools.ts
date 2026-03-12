import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerStructureTools(server: McpServer) {
  server.tool(
    'list_departments',
    'List departments with optional filters for active status.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_departments', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.isActive !== undefined) where.isActive = params.isActive;

      const [departments, total] = await Promise.all([
        prisma.department.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { departmentCode: 'asc' },
          select: {
            id: true,
            name: true,
            departmentCode: true,
            description: true,
            departmentCategory: true,
            criticalityLevel: true,
            headcount: true,
            isActive: true,
            parentId: true,
            departmentHead: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        prisma.department.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ departments, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_department',
    'Get a single department with full details including members and hierarchy.',
    {
      id: z.string().describe('Department UUID'),
    },
    withErrorHandling('get_department', async ({ id }) => {
      const dept = await prisma.department.findUnique({
        where: { id },
        include: {
          departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
          deputyHead: { select: { id: true, firstName: true, lastName: true, email: true } },
          parent: { select: { id: true, name: true, departmentCode: true } },
          children: { select: { id: true, name: true, departmentCode: true } },
          _count: {
            select: {
              members: true,
              businessProcesses: true,
              securityChampions: true,
              externalDependencies: true,
              assets: true,
            },
          },
        },
      });

      if (!dept) {
        return { content: [{ type: 'text' as const, text: `Department ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(dept, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_locations',
    'List organisation locations with optional filters.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      country: z.string().optional().describe('Filter by country'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_locations', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.isActive !== undefined) where.isActive = params.isActive;
      if (params.country) where.country = params.country;

      const [locations, total] = await Promise.all([
        prisma.location.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            locationCode: true,
            name: true,
            locationType: true,
            city: true,
            country: true,
            employeeCount: true,
            isDataCenter: true,
            inIsmsScope: true,
            isActive: true,
          },
        }),
        prisma.location.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ locations, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_location',
    'Get a single location with full details.',
    {
      id: z.string().describe('Location UUID'),
    },
    withErrorHandling('get_location', async ({ id }) => {
      const location = await prisma.location.findUnique({
        where: { id },
        include: {
          _count: { select: { assets: true } },
        },
      });

      if (!location) {
        return { content: [{ type: 'text' as const, text: `Location ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(location, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_key_personnel',
    'List key ISMS personnel and their roles.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      ismsRole: z.string().optional().describe('Filter by ISMS role'),
    },
    withErrorHandling('list_key_personnel', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.isActive !== undefined) where.isActive = params.isActive;
      if (params.ismsRole) where.ismsRole = params.ismsRole;

      const personnel = await prisma.keyPersonnel.findMany({
        where,
        orderBy: { personCode: 'asc' },
        select: {
          id: true,
          personCode: true,
          name: true,
          jobTitle: true,
          email: true,
          ismsRole: true,
          authorityLevel: true,
          trainingCompleted: true,
          lastTrainingDate: true,
          isActive: true,
          user: { select: { id: true, firstName: true, lastName: true } },
          backupPerson: { select: { id: true, personCode: true, name: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ personnel, count: personnel.length }, null, 2),
        }],
      };
    }),
  );
}
