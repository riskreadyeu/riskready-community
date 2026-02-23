import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerSoftwareTools(server: McpServer) {
  server.tool(
    'list_asset_software',
    'List software installed on a specific asset. Includes license information and approval status.',
    {
      assetId: z.string().describe('Asset UUID (the hardware asset)'),
    },
    withErrorHandling('list_asset_software', async ({ assetId }) => {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${assetId} not found` }], isError: true };
      }

      const software = await prisma.assetSoftware.findMany({
        where: { hardwareAssetId: assetId },
        orderBy: { softwareName: 'asc' },
        select: {
          id: true,
          softwareName: true,
          softwareVersion: true,
          vendor: true,
          installDate: true,
          installPath: true,
          licenseType: true,
          licenseKey: true,
          licenseExpiry: true,
          isApproved: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const response: Record<string, unknown> = {
        asset: { id: asset.id, assetTag: asset.assetTag, name: asset.name },
        software,
        count: software.length,
      };
      if (software.length === 0) {
        response.note = `No software records found for asset ${asset.assetTag}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'search_software',
    'Search for software by name across all assets. Returns matching software with the asset it is installed on.',
    {
      query: z.string().max(200).describe('Search term (matches against software name)'),
    },
    withErrorHandling('search_software', async ({ query }) => {
      const results = await prisma.assetSoftware.findMany({
        where: {
          softwareName: { contains: query, mode: 'insensitive' },
        },
        take: 50,
        orderBy: { softwareName: 'asc' },
        select: {
          id: true,
          softwareName: true,
          softwareVersion: true,
          vendor: true,
          licenseType: true,
          licenseExpiry: true,
          isApproved: true,
          hardwareAsset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              assetType: true,
              status: true,
            },
          },
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response.note = `No software matched the search query '${query}'.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );
}
