import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { withErrorHandling, getDefaultOrganisationId, ISO27001_REGISTRY } from '#mcp-shared';
import { prisma } from '#src/prisma.js';
import { generateIso27001Documents } from '#src/iso27001/generation-engine.js';

export function registerIso27001Tools(server: McpServer) {
  // -------------------------------------------------------------------------
  // Tool 1: Propose generating ISO 27001 documents for a wave
  // -------------------------------------------------------------------------
  server.tool(
    'propose_generate_iso27001_documents',
    'Generate ISO 27001:2022 ISMS documents for a given implementation wave. Creates pending actions for each document requiring human approval.',
    {
      wave: z.enum(['1', '2', '3']).describe('Implementation wave (1, 2, or 3)'),
      mcpSessionId: z.string().optional().describe('MCP session ID for tracking'),
      organisationId: z.string().optional().describe('Organisation ID (defaults to single org)'),
    },
    withErrorHandling('propose_generate_iso27001_documents', async (params) => {
      const orgId = params.organisationId || await getDefaultOrganisationId();
      const wave = Number(params.wave) as 1 | 2 | 3;

      const result = await generateIso27001Documents(wave, orgId, params.mcpSessionId);

      // Format as markdown summary
      const lines: string[] = [
        `## ISO 27001 Wave ${wave} Generation Results`,
        '',
        result.summary,
        '',
      ];

      if (result.generated.length > 0) {
        lines.push('### Generated Documents (Pending Approval)');
        for (const g of result.generated) {
          lines.push(`- **${g.documentId}** — ${g.title} (action: \`${g.pendingActionId}\`)`);
        }
        lines.push('');
      }

      if (result.skipped.length > 0) {
        lines.push('### Skipped Documents');
        for (const s of result.skipped) {
          lines.push(`- **${s.documentId}** — ${s.title}: _${s.reason}_`);
        }
        lines.push('');
      }

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    }),
  );

  // -------------------------------------------------------------------------
  // Tool 2: Get ISO 27001 generation status / coverage matrix
  // -------------------------------------------------------------------------
  server.tool(
    'get_iso27001_generation_status',
    'Show coverage matrix of ISO 27001:2022 ISMS documents — which exist, which are pending, and overall completion percentage.',
    {
      organisationId: z.string().optional().describe('Organisation ID (defaults to single org)'),
    },
    withErrorHandling('get_iso27001_generation_status', async (params) => {
      const orgId = params.organisationId || await getDefaultOrganisationId();

      // All non-seeded document IDs from registry
      const allDocs = ISO27001_REGISTRY.filter((d) => !d.seeded);
      const allDocIds = allDocs.map((d) => d.documentId);

      // Query existing documents
      const existingDocs = await prisma.policyDocument.findMany({
        where: {
          organisationId: orgId,
          documentId: { in: allDocIds },
        },
        select: { documentId: true, status: true },
      });
      const existingSet = new Map(
        existingDocs.map((d) => [d.documentId, d.status as string]),
      );

      // Query pending actions
      const pendingActions = await prisma.mcpPendingAction.findMany({
        where: {
          organisationId: orgId,
          actionType: 'CREATE_POLICY',
          status: 'PENDING',
        },
        select: { payload: true },
      });
      const pendingSet = new Set<string>();
      for (const pa of pendingActions) {
        const payload = pa.payload as Record<string, unknown> | null;
        if (payload && typeof payload === 'object' && 'documentId' in payload) {
          const docId = payload.documentId as string;
          if (allDocIds.includes(docId)) {
            pendingSet.add(docId);
          }
        }
      }

      // Build coverage matrix by wave
      const lines: string[] = ['## ISO 27001:2022 Document Coverage Matrix', ''];

      let totalDocs = 0;
      let completedDocs = 0;
      let pendingDocs = 0;

      for (const wave of [1, 2, 3] as const) {
        const waveDocs = allDocs.filter((d) => d.wave === wave);
        if (waveDocs.length === 0) continue;

        lines.push(`### Wave ${wave}`);
        lines.push('| Document ID | Title | Type | Status |');
        lines.push('|---|---|---|---|');

        for (const doc of waveDocs) {
          totalDocs++;
          let status: string;
          if (existingSet.has(doc.documentId)) {
            status = `Created (${existingSet.get(doc.documentId)})`;
            completedDocs++;
          } else if (pendingSet.has(doc.documentId)) {
            status = 'Pending Approval';
            pendingDocs++;
          } else {
            status = 'Not Started';
          }
          lines.push(
            `| ${doc.documentId} | ${doc.title} | ${doc.documentType} | ${status} |`,
          );
        }
        lines.push('');
      }

      const missingDocs = totalDocs - completedDocs - pendingDocs;
      const completionPct =
        totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

      lines.push('### Summary');
      lines.push(`- **Total documents**: ${totalDocs}`);
      lines.push(`- **Created**: ${completedDocs}`);
      lines.push(`- **Pending approval**: ${pendingDocs}`);
      lines.push(`- **Not started**: ${missingDocs}`);
      lines.push(`- **Completion**: ${completionPct}%`);

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    }),
  );
}
