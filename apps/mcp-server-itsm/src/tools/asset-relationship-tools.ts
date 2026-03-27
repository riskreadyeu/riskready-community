import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAssetRelationshipTools(server: McpServer) {
  server.tool(
    'get_asset_relationships',
    'Get asset relationships with direction filter. Shows how assets are connected (dependencies, hosting, network, data flows, etc.). If not found, returns a not-found message. Do not invent or assume values.',
    {
      assetId: z.string().describe('Asset UUID'),
      direction: z.enum(['outgoing', 'incoming', 'all']).default('all').describe('Relationship direction: outgoing (this asset depends on), incoming (depends on this asset), or all'),
    },
    withErrorHandling('get_asset_relationships', async ({ assetId, direction }) => {
      // Verify asset exists
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${assetId} not found` }], isError: true };
      }

      const outgoing = direction === 'outgoing' || direction === 'all'
        ? await prisma.assetRelationship.findMany({
            where: { fromAssetId: assetId },
            take: 1000,
            include: {
              toAsset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
            },
          })
        : [];

      const incoming = direction === 'incoming' || direction === 'all'
        ? await prisma.assetRelationship.findMany({
            where: { toAssetId: assetId },
            take: 1000,
            include: {
              fromAsset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
            },
          })
        : [];

      const response: Record<string, unknown> = {
        asset: { id: asset.id, assetTag: asset.assetTag, name: asset.name },
        outgoing,
        incoming,
        totalOutgoing: outgoing.length,
        totalIncoming: incoming.length,
      };
      if (outgoing.length === 0 && incoming.length === 0) {
        response.note = `No relationships found for asset ${asset.assetTag}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_asset_controls',
    'List control linkages for an asset. Shows which security controls are applied and their implementation status. If not found, returns a not-found message. Do not invent or assume values.',
    {
      assetId: z.string().describe('Asset UUID'),
    },
    withErrorHandling('get_asset_controls', async ({ assetId }) => {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${assetId} not found` }], isError: true };
      }

      const controlLinks = await prisma.assetControl.findMany({
        where: { assetId },
        take: 1000,
        include: {
          control: {
            select: {
              id: true,
              controlId: true,
              name: true,
              theme: true,
              framework: true,
              implementationStatus: true,
              applicable: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const response: Record<string, unknown> = {
        asset: { id: asset.id, assetTag: asset.assetTag, name: asset.name },
        controlLinks,
        count: controlLinks.length,
      };
      if (controlLinks.length === 0) {
        response.note = `No controls linked to asset ${asset.assetTag}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_asset_risks',
    'List risk linkages for an asset. Shows which risks are associated and their impact levels. If not found, returns a not-found message. Do not invent or assume values.',
    {
      assetId: z.string().describe('Asset UUID'),
    },
    withErrorHandling('get_asset_risks', async ({ assetId }) => {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${assetId} not found` }], isError: true };
      }

      const riskLinks = await prisma.assetRisk.findMany({
        where: { assetId },
        take: 1000,
        include: {
          risk: {
            select: {
              id: true,
              riskId: true,
              title: true,
              tier: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const response: Record<string, unknown> = {
        asset: { id: asset.id, assetTag: asset.assetTag, name: asset.name },
        riskLinks,
        count: riskLinks.length,
      };
      if (riskLinks.length === 0) {
        response.note = `No risks linked to asset ${asset.assetTag}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_asset_business_processes',
    'List business process linkages for an asset. Shows which business processes depend on this asset. If not found, returns a not-found message. Do not invent or assume values.',
    {
      assetId: z.string().describe('Asset UUID'),
    },
    withErrorHandling('get_asset_business_processes', async ({ assetId }) => {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${assetId} not found` }], isError: true };
      }

      const processLinks = await prisma.assetBusinessProcess.findMany({
        where: { assetId },
        take: 1000,
        include: {
          businessProcess: {
            select: {
              id: true,
              name: true,
              description: true,
              criticalityLevel: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const response: Record<string, unknown> = {
        asset: { id: asset.id, assetTag: asset.assetTag, name: asset.name },
        processLinks,
        count: processLinks.length,
      };
      if (processLinks.length === 0) {
        response.note = `No business processes linked to asset ${asset.assetTag}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );
}
