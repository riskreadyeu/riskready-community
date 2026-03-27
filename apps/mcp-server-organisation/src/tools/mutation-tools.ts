import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, withErrorHandling, zId, zSessionId, zOrgId, zReason } from '#mcp-shared';
import { getSingleOrganisation } from './single-org.js';

// ---------------------------------------------------------------------------
// Profile mutations
// ---------------------------------------------------------------------------
function registerProfileMutations(server: McpServer) {
  server.tool(
    'propose_update_org_profile',
    'Propose updating the organisation profile. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      organisationId: zOrgId,
      name: z.string().max(500).optional().describe('New organisation name'),
      description: z.string().max(5000).optional().describe('New description'),
      employeeCount: z.number().int().optional().describe('Updated employee count'),
      ismsScope: z.string().max(5000).optional().describe('Updated ISMS scope'),
      riskAppetite: z.string().max(5000).optional().describe('Updated risk appetite'),
      stackType: z.string().max(200).optional().describe('Stack type (Cloud_Native, Hybrid, On_Prem)'),
      securityMaturity: z.string().max(200).optional().describe('Security maturity (Initial, Defined, Managed, Optimized)'),
      riskPhilosophy: z.string().max(200).optional().describe('Risk philosophy (Fortress, Agile, Disruptor)'),
      // Identity
      legalName: z.string().max(200).optional().describe('Legal entity name'),
      industrySector: z.string().max(200).optional().describe('Industry sector'),
      industrySubsector: z.string().max(200).optional().describe('Industry subsector'),
      size: z.string().max(200).optional().describe('Organisation size (e.g. "MICRO", "SMALL", "MEDIUM", "LARGE")'),
      foundedYear: z.number().int().optional().describe('Year founded'),
      website: z.string().max(200).optional().describe('Website URL'),
      contactEmail: z.string().max(200).optional().describe('Contact email'),
      contactPhone: z.string().max(200).optional().describe('Contact phone'),
      // Registration
      registrationNumber: z.string().max(200).optional().describe('Company registration number'),
      taxIdentification: z.string().max(200).optional().describe('Tax identification number'),
      naceCode: z.string().max(200).optional().describe('NACE economic activity code'),
      // ISMS
      ismsPolicy: z.string().max(5000).optional().describe('ISMS policy reference'),
      ismsObjectives: z.array(z.string()).max(50).optional().describe('ISMS objectives (JSON array of objective strings)'),
      scopeExclusions: z.string().max(5000).optional().describe('ISMS scope exclusions'),
      exclusionJustification: z.string().max(5000).optional().describe('Justification for scope exclusions'),
      // Certification
      isoCertificationStatus: z.string().max(200).optional().describe('ISO certification status'),
      certificationBody: z.string().max(200).optional().describe('Certification body name'),
      certificationDate: z.string().datetime().optional().describe('Certification date (ISO 8601)'),
      certificationExpiry: z.string().datetime().optional().describe('Certification expiry date (ISO 8601)'),
      certificateNumber: z.string().max(200).optional().describe('Certificate number'),
      nextAuditDate: z.string().datetime().optional().describe('Next audit date (ISO 8601)'),
      // Regulatory
      isDoraApplicable: z.boolean().optional().describe('Whether DORA applies'),
      doraEntityType: z.string().max(200).optional().describe('DORA entity type'),
      doraRegime: z.string().max(200).optional().describe('DORA regime'),
      isNis2Applicable: z.boolean().optional().describe('Whether NIS2 applies'),
      nis2EntityClassification: z.string().max(200).optional().describe('NIS2 entity classification'),
      nis2Sector: z.string().max(200).optional().describe('NIS2 sector'),
      nis2AnnexType: z.string().max(200).optional().describe('NIS2 annex type'),
      // Risk
      riskTolerance: z.record(z.string().max(100), z.unknown()).optional().refine(
        (val) => !val || JSON.stringify(val).length < 10_000,
        'JSON object too large (max 10KB)'
      ).describe('Risk tolerance (JSON object)'),
      riskAcceptanceThreshold: z.number().int().optional().describe('Risk acceptance threshold score (e.g. 6, 12, 16)'),
      maxTolerableDowntime: z.number().int().optional().describe('Maximum tolerable downtime in hours'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_org_profile', async (params) => {
      const org = params.organisationId
        ? await prisma.organisationProfile.findUnique({ where: { id: params.organisationId }, select: { id: true, name: true } })
        : await getSingleOrganisation({ id: true, name: true });

      if (!org) {
        return { content: [{ type: 'text' as const, text: 'Organisation not found' }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_ORG_PROFILE,
        summary: `Update organisation profile "${org.name}"`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_org_profile',
        organisationId: org.id,
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Structure mutations (departments, locations)
// ---------------------------------------------------------------------------
function registerStructureMutations(server: McpServer) {
  server.tool(
    'propose_create_department',
    'Propose creating a new department. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      name: z.string().max(500).describe('Department name'),
      departmentCode: z.string().max(200).describe('Unique department code'),
      description: z.string().max(5000).optional().describe('Department description'),
      departmentCategory: z.string().max(200).optional().describe('Department category'),
      criticalityLevel: z.string().max(200).optional().describe('Criticality level'),
      parentId: zId.optional().describe('Parent department UUID'),
      functionType: z.string().max(200).optional().describe('Function type'),
      departmentHeadId: zId.optional().describe('Department head user UUID'),
      deputyHeadId: zId.optional().describe('Deputy head user UUID'),
      headcount: z.number().int().optional().describe('Headcount'),
      costCenter: z.string().max(200).optional().describe('Cost center'),
      contactEmail: z.string().max(200).optional().describe('Contact email'),
      contactPhone: z.string().max(200).optional().describe('Contact phone'),
      handlesPersonalData: z.boolean().optional().describe('Whether department handles personal data'),
      handlesFinancialData: z.boolean().optional().describe('Whether department handles financial data'),
      establishedDate: z.string().datetime().optional().describe('Established date (ISO 8601)'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_department', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_DEPARTMENT,
        summary: `Create department "${params.name}" (${params.departmentCode})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_department',
      });
    }),
  );

  server.tool(
    'propose_update_department',
    'Propose updating an existing department. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      departmentId: zId.describe('Department UUID'),
      name: z.string().max(500).optional().describe('New name'),
      description: z.string().max(5000).optional().describe('New description'),
      departmentCategory: z.string().max(200).optional().describe('New category'),
      criticalityLevel: z.string().max(200).optional().describe('New criticality level'),
      isActive: z.boolean().optional().describe('Active status'),
      functionType: z.string().max(200).optional().describe('Function type'),
      departmentHeadId: zId.optional().describe('Department head user UUID'),
      deputyHeadId: zId.optional().describe('Deputy head user UUID'),
      headcount: z.number().int().optional().describe('Headcount'),
      costCenter: z.string().max(200).optional().describe('Cost center'),
      contactEmail: z.string().max(200).optional().describe('Contact email'),
      contactPhone: z.string().max(200).optional().describe('Contact phone'),
      handlesPersonalData: z.boolean().optional().describe('Whether department handles personal data'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_department', async (params) => {
      const dept = await prisma.department.findUnique({
        where: { id: params.departmentId },
        select: { id: true, name: true, departmentCode: true },
      });
      if (!dept) {
        return { content: [{ type: 'text' as const, text: `Department ${params.departmentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_DEPARTMENT,
        summary: `Update department "${dept.name}" (${dept.departmentCode})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_department',
      });
    }),
  );

  server.tool(
    'propose_create_location',
    'Propose creating a new location. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      name: z.string().max(500).describe('Location name'),
      locationCode: z.string().max(200).optional().describe('Unique location code'),
      locationType: z.string().max(200).optional().describe('Location type'),
      address: z.string().max(200).optional().describe('Address'),
      city: z.string().max(200).optional().describe('City'),
      country: z.string().max(200).optional().describe('Country'),
      inIsmsScope: z.boolean().optional().describe('Whether in ISMS scope'),
      isDataCenter: z.boolean().optional().describe('Whether this is a data center'),
      state: z.string().max(200).optional().describe('State/province'),
      postalCode: z.string().max(200).optional().describe('Postal code'),
      region: z.string().max(200).optional().describe('Region'),
      timezone: z.string().max(200).optional().describe('Timezone'),
      employeeCount: z.number().int().optional().describe('Employee count at this location'),
      physicalSecurityLevel: z.string().max(200).optional().describe('Physical security level'),
      accessControlType: z.string().max(200).optional().describe('Access control type'),
      hasServerRoom: z.boolean().optional().describe('Whether location has a server room'),
      backupPower: z.boolean().optional().describe('Whether location has backup power'),
      networkType: z.string().max(200).optional().describe('Network type'),
      isActive: z.boolean().optional().describe('Whether location is active'),
      scopeJustification: z.string().max(5000).optional().describe('Scope justification'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_location', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_LOCATION,
        summary: `Create location "${params.name}"${params.locationCode ? ` (${params.locationCode})` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_location',
      });
    }),
  );

  server.tool(
    'propose_update_location',
    'Propose updating an existing location. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      locationId: zId.describe('Location UUID'),
      name: z.string().max(500).optional().describe('New name'),
      locationType: z.string().max(200).optional().describe('New location type'),
      address: z.string().max(200).optional().describe('New address'),
      city: z.string().max(200).optional().describe('New city'),
      country: z.string().max(200).optional().describe('New country'),
      inIsmsScope: z.boolean().optional().describe('Whether in ISMS scope'),
      isActive: z.boolean().optional().describe('Active status'),
      state: z.string().max(200).optional().describe('State/province'),
      postalCode: z.string().max(200).optional().describe('Postal code'),
      region: z.string().max(200).optional().describe('Region'),
      timezone: z.string().max(200).optional().describe('Timezone'),
      physicalSecurityLevel: z.string().max(200).optional().describe('Physical security level'),
      hasServerRoom: z.boolean().optional().describe('Whether location has a server room'),
      backupPower: z.boolean().optional().describe('Whether location has backup power'),
      scopeJustification: z.string().max(5000).optional().describe('Scope justification'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_location', async (params) => {
      const loc = await prisma.location.findUnique({
        where: { id: params.locationId },
        select: { id: true, name: true, locationCode: true },
      });
      if (!loc) {
        return { content: [{ type: 'text' as const, text: `Location ${params.locationId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_LOCATION,
        summary: `Update location "${loc.name}"${loc.locationCode ? ` (${loc.locationCode})` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_location',
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Process mutations (business processes, external dependencies)
// ---------------------------------------------------------------------------
function registerProcessMutations(server: McpServer) {
  server.tool(
    'propose_create_business_process',
    'Propose creating a new business process. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      name: z.string().max(500).describe('Process name'),
      processCode: z.string().max(200).describe('Unique process code'),
      processType: z.string().max(200).describe('Process type'),
      description: z.string().max(5000).optional().describe('Process description'),
      criticalityLevel: z.string().max(200).optional().describe('Criticality level (critical, high, medium, low)'),
      departmentId: zId.optional().describe('Department UUID'),
      processOwnerId: zId.optional().describe('Process owner user UUID'),
      processManagerId: zId.optional().describe('Process manager user UUID'),
      frequency: z.string().max(200).optional().describe('Process frequency'),
      automationLevel: z.string().max(200).optional().describe('Automation level'),
      isActive: z.boolean().optional().describe('Whether the process is active'),
      biaStatus: z.string().max(200).optional().describe('BIA status'),
      bcpEnabled: z.boolean().optional().describe('Whether BCP is enabled'),
      bcpCriticality: z.string().max(200).optional().describe('BCP criticality'),
      recoveryTimeObjectiveMinutes: z.number().int().optional().describe('Recovery Time Objective in minutes'),
      recoveryPointObjectiveMinutes: z.number().int().optional().describe('Recovery Point Objective in minutes'),
      maximumTolerableDowntimeMinutes: z.number().int().optional().describe('Maximum tolerable downtime in minutes'),
      parentProcessId: zId.optional().describe('Parent process UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_business_process', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_BUSINESS_PROCESS,
        summary: `Create business process "${params.name}" (${params.processCode})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_business_process',
      });
    }),
  );

  server.tool(
    'propose_update_business_process',
    'Propose updating an existing business process. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      processId: zId.describe('BusinessProcess UUID'),
      name: z.string().max(500).optional().describe('New name'),
      description: z.string().max(5000).optional().describe('New description'),
      criticalityLevel: z.string().max(200).optional().describe('New criticality level'),
      processType: z.string().max(200).optional().describe('New process type'),
      isActive: z.boolean().optional().describe('Active status'),
      processOwnerId: zId.optional().describe('Process owner user UUID'),
      processManagerId: zId.optional().describe('Process manager user UUID'),
      frequency: z.string().max(200).optional().describe('Process frequency'),
      automationLevel: z.string().max(200).optional().describe('Automation level'),
      biaStatus: z.string().max(200).optional().describe('BIA status'),
      bcpEnabled: z.boolean().optional().describe('Whether BCP is enabled'),
      bcpCriticality: z.string().max(200).optional().describe('BCP criticality'),
      parentProcessId: zId.optional().describe('Parent process UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_business_process', async (params) => {
      const process = await prisma.businessProcess.findUnique({
        where: { id: params.processId },
        select: { id: true, name: true, processCode: true },
      });
      if (!process) {
        return { content: [{ type: 'text' as const, text: `Business process ${params.processId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_BUSINESS_PROCESS,
        summary: `Update business process "${process.name}" (${process.processCode})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_business_process',
      });
    }),
  );

  server.tool(
    'propose_create_external_dependency',
    'Propose creating a new external dependency (vendor/supplier). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      name: z.string().max(500).describe('Dependency name'),
      dependencyType: z.string().max(200).describe('Dependency type'),
      description: z.string().max(5000).describe('Description'),
      criticalityLevel: z.string().max(200).describe('Criticality level'),
      contractStart: z.string().datetime().describe('Contract start date (ISO 8601)'),
      contractEnd: z.string().datetime().describe('Contract end date (ISO 8601)'),
      contactEmail: z.string().max(200).describe('Contact email'),
      singlePointOfFailure: z.boolean().optional().describe('Is single point of failure'),
      vendorWebsite: z.string().max(200).optional().describe('Vendor website URL'),
      contractReference: z.string().max(200).optional().describe('Contract reference'),
      annualCost: z.number().max(1_000_000_000).optional().describe('Annual cost'),
      dataLocation: z.string().max(200).optional().describe('Data location/jurisdiction'),
      riskRating: z.string().max(200).optional().describe('Risk rating'),
      primaryContact: z.string().max(200).optional().describe('Primary contact name'),
      contactPhone: z.string().max(200).optional().describe('Contact phone'),
      exitStrategy: z.string().max(5000).optional().describe('Exit strategy'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_external_dependency', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_EXTERNAL_DEPENDENCY,
        summary: `Create ${params.criticalityLevel} external dependency "${params.name}" (${params.dependencyType})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_external_dependency',
      });
    }),
  );

  server.tool(
    'propose_update_external_dependency',
    'Propose updating an existing external dependency. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      dependencyId: zId.describe('ExternalDependency UUID'),
      name: z.string().max(500).optional().describe('New name'),
      description: z.string().max(5000).optional().describe('New description'),
      criticalityLevel: z.string().max(200).optional().describe('New criticality level'),
      dependencyType: z.string().max(200).optional().describe('New dependency type'),
      contractEnd: z.string().datetime().optional().describe('New contract end date (ISO 8601)'),
      contractReference: z.string().max(200).optional().describe('Contract reference'),
      annualCost: z.number().max(1_000_000_000).optional().describe('Annual cost'),
      dataLocation: z.string().max(200).optional().describe('Data location/jurisdiction'),
      primaryContact: z.string().max(200).optional().describe('Primary contact name'),
      riskRating: z.string().max(200).optional().describe('New risk rating'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_external_dependency', async (params) => {
      const dep = await prisma.externalDependency.findUnique({
        where: { id: params.dependencyId },
        select: { id: true, name: true },
      });
      if (!dep) {
        return { content: [{ type: 'text' as const, text: `External dependency ${params.dependencyId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_EXTERNAL_DEPENDENCY,
        summary: `Update external dependency "${dep.name}"`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_external_dependency',
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Governance mutations (committees, meetings)
// ---------------------------------------------------------------------------
function registerGovernanceMutations(server: McpServer) {
  server.tool(
    'propose_create_committee',
    'Propose creating a new security committee. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      name: z.string().max(500).describe('Committee name'),
      committeeType: z.string().max(200).describe('Committee type'),
      description: z.string().max(5000).optional().describe('Committee description'),
      meetingFrequency: z.string().max(200).describe('Meeting frequency (e.g. "monthly", "quarterly")'),
      establishedDate: z.string().datetime().describe('Established date (ISO 8601)'),
      chairId: zId.optional().describe('Chair user UUID'),
      authorityLevel: z.string().max(200).optional().describe('Authority level'),
      isActive: z.boolean().optional().describe('Whether the committee is active'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_committee', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_COMMITTEE,
        summary: `Create ${params.committeeType} committee "${params.name}"`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_committee',
      });
    }),
  );

  server.tool(
    'propose_update_committee',
    'Propose updating an existing committee. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      committeeId: zId.describe('SecurityCommittee UUID'),
      name: z.string().max(500).optional().describe('New name'),
      description: z.string().max(5000).optional().describe('New description'),
      meetingFrequency: z.string().max(200).optional().describe('New meeting frequency'),
      isActive: z.boolean().optional().describe('Active status'),
      chairId: zId.optional().describe('Chair user UUID'),
      authorityLevel: z.string().max(200).optional().describe('Authority level'),
      committeeType: z.string().max(200).optional().describe('Committee type'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_committee', async (params) => {
      const committee = await prisma.securityCommittee.findUnique({
        where: { id: params.committeeId },
        select: { id: true, name: true },
      });
      if (!committee) {
        return { content: [{ type: 'text' as const, text: `Committee ${params.committeeId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_COMMITTEE,
        summary: `Update committee "${committee.name}"`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_committee',
      });
    }),
  );

  server.tool(
    'propose_create_meeting',
    'Propose scheduling a new committee meeting. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      committeeId: zId.describe('SecurityCommittee UUID'),
      title: z.string().max(500).describe('Meeting title'),
      meetingDate: z.string().datetime().describe('Meeting date (ISO 8601)'),
      startTime: z.string().max(200).describe('Start time (HH:MM)'),
      endTime: z.string().max(200).optional().describe('End time (HH:MM)'),
      locationType: z.string().max(200).optional().describe('Location type (virtual, physical, hybrid)'),
      agenda: z.string().max(5000).optional().describe('Meeting agenda'),
      meetingType: z.string().max(200).optional().describe('Meeting type (e.g. regular, ad-hoc, emergency)'),
      physicalLocation: z.string().max(200).optional().describe('Physical location address'),
      virtualMeetingLink: z.string().max(200).optional().describe('Virtual meeting link/URL'),
      objectives: z.string().max(5000).optional().describe('Meeting objectives'),
      status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).optional().describe('Initial meeting status'),
      quorumRequirement: z.number().int().optional().describe('Minimum attendees for quorum'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_meeting', async (params) => {
      const committee = await prisma.securityCommittee.findUnique({
        where: { id: params.committeeId },
        select: { id: true, name: true },
      });
      if (!committee) {
        return { content: [{ type: 'text' as const, text: `Committee ${params.committeeId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_COMMITTEE_MEETING,
        summary: `Schedule meeting "${params.title}" for ${committee.name} on ${params.meetingDate}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_meeting',
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------
export function registerMutationTools(server: McpServer) {
  registerProfileMutations(server);
  registerStructureMutations(server);
  registerProcessMutations(server);
  registerGovernanceMutations(server);
}
