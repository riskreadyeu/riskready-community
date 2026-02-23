import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerControlTools(server: McpServer) {
  server.tool(
    'list_controls',
    'List controls from the library with optional filters. Returns control ID, name, theme, framework, implementation status, and applicability.',
    {
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('Filter by control framework'),
      theme: z.enum(['ORGANISATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL']).optional().describe('Filter by ISO 27001 control theme'),
      implementationStatus: z.enum(['NOT_STARTED', 'PARTIAL', 'IMPLEMENTED']).optional().describe('Filter by implementation status'),
      applicable: z.boolean().optional().describe('Filter by applicability (true/false)'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_controls', async ({ framework, theme, implementationStatus, applicable, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (framework) where.framework = framework;
      if (theme) where.theme = theme;
      if (implementationStatus) where.implementationStatus = implementationStatus;
      if (applicable !== undefined) where.applicable = applicable;

      const [results, count] = await Promise.all([
        prisma.control.findMany({
          where,
          skip,
          take,
          orderBy: { controlId: 'asc' },
          select: {
            id: true,
            controlId: true,
            name: true,
            description: true,
            theme: true,
            framework: true,
            sourceStandard: true,
            soc2Criteria: true,
            tscCategory: true,
            implementationStatus: true,
            implementationDesc: true,
            applicable: true,
            justificationIfNa: true,
            enabled: true,
            _count: { select: { metrics: true, assessmentControls: true } },
          },
        }),
        prisma.control.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No controls found matching the specified filters.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_control',
    'Get a single control with full details: metrics, evidence links, risk scenario links, and audit metadata.',
    {
      id: z.string().describe('Control UUID'),
    },
    withErrorHandling('get_control', async ({ id }) => {
      const control = await prisma.control.findUnique({
        where: { id },
        include: {
          metrics: {
            select: {
              id: true,
              metricId: true,
              name: true,
              status: true,
              trend: true,
              currentValue: true,
              unit: true,
              formula: true,
              owner: true,
            },
          },
          evidenceLinks: {
            include: {
              evidence: { select: { id: true, title: true, status: true } },
            },
          },
          scenarioLinks: {
            include: {
              scenario: { select: { id: true, scenarioId: true, title: true, inherentScore: true, residualScore: true } },
            },
          },
          documentMappings: {
            include: {
              document: { select: { id: true, title: true, status: true } },
            },
          },
          nonconformities: {
            select: { id: true, ncId: true, title: true, severity: true, status: true },
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          organisation: { select: { id: true, name: true } },
        },
      });

      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(control, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_control_stats',
    'Get aggregate statistics for the control library: total count, by theme, by framework, by implementation status.',
    {},
    withErrorHandling('get_control_stats', async () => {
      const [total, applicable, implemented, partial, notStarted, byTheme, byFramework] = await Promise.all([
        prisma.control.count(),
        prisma.control.count({ where: { applicable: true } }),
        prisma.control.count({ where: { implementationStatus: 'IMPLEMENTED' } }),
        prisma.control.count({ where: { implementationStatus: 'PARTIAL' } }),
        prisma.control.count({ where: { implementationStatus: 'NOT_STARTED' } }),
        prisma.control.groupBy({ by: ['theme'], _count: true }),
        prisma.control.groupBy({ by: ['framework'], _count: true }),
      ]);

      const stats = {
        total,
        applicable,
        notApplicable: total - applicable,
        byImplementationStatus: { implemented, partial, notStarted },
        byTheme: Object.fromEntries(byTheme.map(t => [t.theme, t._count])),
        byFramework: Object.fromEntries(byFramework.map(f => [f.framework, f._count])),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }],
      };
    }),
  );

  server.tool(
    'search_controls',
    'Search controls by name or controlId pattern. Returns matching controls with basic info.',
    {
      query: z.string().max(200).describe('Search term (matches against name and controlId)'),
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('Limit search to a specific framework'),
    },
    withErrorHandling('search_controls', async ({ query, framework }) => {
      const where: Record<string, unknown> = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { controlId: { contains: query, mode: 'insensitive' } },
        ],
      };
      if (framework) where.framework = framework;

      const results = await prisma.control.findMany({
        where,
        take: 50,
        orderBy: { controlId: 'asc' },
        select: {
          id: true,
          controlId: true,
          name: true,
          description: true,
          theme: true,
          framework: true,
          sourceStandard: true,
          soc2Criteria: true,
          tscCategory: true,
          implementationStatus: true,
          implementationDesc: true,
          applicable: true,
          justificationIfNa: true,
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response.note = `No controls matched the search query '${query}'.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'list_scope_items',
    'List scope items (applications, asset classes, locations, etc.) used in assessment testing. Supports filtering by type, criticality, and active status.',
    {
      scopeType: z.enum(['APPLICATION', 'ASSET_CLASS', 'LOCATION', 'PERSONNEL_TYPE', 'BUSINESS_UNIT', 'PLATFORM', 'PROVIDER', 'NETWORK_ZONE', 'PROCESS']).optional().describe('Filter by scope type'),
      criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Filter by criticality level'),
      isActive: z.boolean().optional().describe('Filter by active status (default: all)'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_scope_items', async ({ scopeType, criticality, isActive, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (scopeType) where.scopeType = scopeType;
      if (criticality) where.criticality = criticality;
      if (isActive !== undefined) where.isActive = isActive;

      const [results, count] = await Promise.all([
        prisma.scopeItem.findMany({
          where,
          skip,
          take,
          orderBy: [{ scopeType: 'asc' }, { code: 'asc' }],
          select: {
            id: true,
            scopeType: true,
            code: true,
            name: true,
            description: true,
            criticality: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
            _count: { select: { assessmentScopes: true, assessmentTests: true } },
          },
        }),
        prisma.scopeItem.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No scope items found matching the specified filters.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_effectiveness_report',
    'Get a control implementation effectiveness report showing implementation rates across applicable, enabled controls.',
    {
      organisationId: z.string().optional().describe('Organisation UUID (uses first org if omitted)'),
    },
    withErrorHandling('get_effectiveness_report', async ({ organisationId }) => {
      const where: Record<string, unknown> = { applicable: true, enabled: true };
      if (organisationId) where.organisationId = organisationId;

      const controls = await prisma.control.findMany({
        where,
        select: {
          controlId: true,
          name: true,
          theme: true,
          implementationStatus: true,
        },
        orderBy: { controlId: 'asc' },
      });

      const total = controls.length;
      const implemented = controls.filter(c => c.implementationStatus === 'IMPLEMENTED').length;
      const partial = controls.filter(c => c.implementationStatus === 'PARTIAL').length;
      const notStarted = controls.filter(c => c.implementationStatus === 'NOT_STARTED').length;

      const response: Record<string, unknown> = {
        controls,
        summary: {
          total,
          implemented,
          partial,
          notStarted,
          implementationRate: total > 0 ? Math.round((implemented / total) * 100) : 0,
        },
      };
      if (total === 0) {
        response.note = 'No applicable, enabled controls found for this organisation.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'find_controls_by_ids',
    'Retrieve multiple controls by their UUIDs in a single query. Useful for bulk lookups.',
    {
      ids: z.array(z.string()).describe('Array of control UUIDs'),
    },
    withErrorHandling('find_controls_by_ids', async ({ ids }) => {
      const results = await prisma.control.findMany({
        where: { id: { in: ids } },
        orderBy: { controlId: 'asc' },
        select: {
          id: true,
          controlId: true,
          name: true,
          description: true,
          theme: true,
          framework: true,
          sourceStandard: true,
          soc2Criteria: true,
          tscCategory: true,
          implementationStatus: true,
          implementationDesc: true,
          applicable: true,
          justificationIfNa: true,
          enabled: true,
          _count: { select: { metrics: true, assessmentControls: true } },
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response.note = 'None of the specified control IDs were found.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_scope_item',
    'Get a single scope item with full details including usage counts across assessments and tests.',
    {
      id: z.string().describe('Scope item UUID'),
    },
    withErrorHandling('get_scope_item', async ({ id }) => {
      const item = await prisma.scopeItem.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { assessmentScopes: true, assessmentTests: true } },
        },
      });

      if (!item) {
        return { content: [{ type: 'text' as const, text: `Scope item with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(item, null, 2) }],
      };
    }),
  );
}
