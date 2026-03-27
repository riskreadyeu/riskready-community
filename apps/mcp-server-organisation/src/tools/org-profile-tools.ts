import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';
import { getSingleOrganisation } from './single-org.js';

export function registerOrgProfileTools(server: McpServer) {
  server.tool(
    'get_organisation_profile',
    'Get the organisation profile with full details including ISMS scope and regulatory profile. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().optional().describe('Organisation UUID (uses first org if omitted)'),
    },
    withErrorHandling('get_organisation_profile', async ({ id }) => {
      const org = id
        ? await prisma.organisationProfile.findUnique({ where: { id } })
        : await getSingleOrganisation();

      if (!org) {
        return { content: [{ type: 'text' as const, text: id ? `Organisation ${id} not found` : 'No organisation found in the database' }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(org, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_regulatory_profile',
    'Get the regulatory profile for an organisation — DORA and NIS2 applicability, supervisory authority. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().optional().describe('Organisation UUID (uses first org if omitted)'),
    },
    withErrorHandling('get_regulatory_profile', async ({ id }) => {
      const org = id
        ? await prisma.organisationProfile.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              isDoraApplicable: true,
              doraEntityType: true,
              doraRegime: true,
              doraExemptionReason: true,
              isNis2Applicable: true,
              nis2EntityClassification: true,
              nis2Sector: true,
              nis2AnnexType: true,
              primarySupervisoryAuthority: true,
              supervisoryAuthorityCountry: true,
              supervisoryRegistrationNumber: true,
              supervisoryRegistrationDate: true,
              lastDoraAssessmentId: true,
              lastNis2AssessmentId: true,
              regulatoryProfileUpdatedAt: true,
            },
          })
        : await getSingleOrganisation({
            id: true,
            name: true,
            isDoraApplicable: true,
            doraEntityType: true,
            doraRegime: true,
            doraExemptionReason: true,
            isNis2Applicable: true,
            nis2EntityClassification: true,
            nis2Sector: true,
            nis2AnnexType: true,
            primarySupervisoryAuthority: true,
            supervisoryAuthorityCountry: true,
            supervisoryRegistrationNumber: true,
            supervisoryRegistrationDate: true,
            lastDoraAssessmentId: true,
            lastNis2AssessmentId: true,
            regulatoryProfileUpdatedAt: true,
          });

      if (!org) {
        return { content: [{ type: 'text' as const, text: 'No organisation found' }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(org, null, 2),
        }],
      };
    }),
  );
}
