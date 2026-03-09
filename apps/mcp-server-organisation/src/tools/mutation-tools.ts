import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, withErrorHandling } from '#mcp-shared';

// ---------------------------------------------------------------------------
// Profile mutations
// ---------------------------------------------------------------------------
function registerProfileMutations(server: McpServer) {
  server.tool(
    'propose_update_org_profile',
    'Propose updating the organisation profile. Requires human approval.',
    {
      organisationId: z.string().optional().describe('Organisation UUID (uses first org if omitted)'),
      name: z.string().optional().describe('New organisation name'),
      description: z.string().optional().describe('New description'),
      employeeCount: z.number().int().optional().describe('Updated employee count'),
      ismsScope: z.string().optional().describe('Updated ISMS scope'),
      riskAppetite: z.string().optional().describe('Updated risk appetite'),
      stackType: z.string().optional().describe('Stack type (Cloud_Native, Hybrid, On_Prem)'),
      securityMaturity: z.string().optional().describe('Security maturity (Initial, Defined, Managed, Optimized)'),
      riskPhilosophy: z.string().optional().describe('Risk philosophy (Fortress, Agile, Disruptor)'),
      // Identity
      legalName: z.string().optional().describe('Legal entity name'),
      industrySector: z.string().optional().describe('Industry sector'),
      industrySubsector: z.string().optional().describe('Industry subsector'),
      size: z.string().optional().describe('Organisation size (e.g. "MICRO", "SMALL", "MEDIUM", "LARGE")'),
      foundedYear: z.number().int().optional().describe('Year founded'),
      website: z.string().optional().describe('Website URL'),
      contactEmail: z.string().optional().describe('Contact email'),
      contactPhone: z.string().optional().describe('Contact phone'),
      // Registration
      registrationNumber: z.string().optional().describe('Company registration number'),
      taxIdentification: z.string().optional().describe('Tax identification number'),
      naceCode: z.string().optional().describe('NACE economic activity code'),
      // ISMS
      ismsPolicy: z.string().optional().describe('ISMS policy reference'),
      ismsObjectives: z.array(z.string()).optional().describe('ISMS objectives (JSON array of objective strings)'),
      scopeExclusions: z.string().optional().describe('ISMS scope exclusions'),
      exclusionJustification: z.string().optional().describe('Justification for scope exclusions'),
      // Certification
      isoCertificationStatus: z.string().optional().describe('ISO certification status'),
      certificationBody: z.string().optional().describe('Certification body name'),
      certificationDate: z.string().datetime().optional().describe('Certification date (ISO 8601)'),
      certificationExpiry: z.string().datetime().optional().describe('Certification expiry date (ISO 8601)'),
      certificateNumber: z.string().optional().describe('Certificate number'),
      nextAuditDate: z.string().datetime().optional().describe('Next audit date (ISO 8601)'),
      // Regulatory
      isDoraApplicable: z.boolean().optional().describe('Whether DORA applies'),
      doraEntityType: z.string().optional().describe('DORA entity type'),
      doraRegime: z.string().optional().describe('DORA regime'),
      isNis2Applicable: z.boolean().optional().describe('Whether NIS2 applies'),
      nis2EntityClassification: z.string().optional().describe('NIS2 entity classification'),
      nis2Sector: z.string().optional().describe('NIS2 sector'),
      nis2AnnexType: z.string().optional().describe('NIS2 annex type'),
      // Risk
      riskTolerance: z.record(z.string(), z.unknown()).optional().describe('Risk tolerance (JSON object)'),
      riskAcceptanceThreshold: z.string().optional().describe('Risk acceptance threshold'),
      maxTolerableDowntime: z.string().optional().describe('Maximum tolerable downtime'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_update_org_profile', async (params) => {
      const org = params.organisationId
        ? await prisma.organisationProfile.findUnique({ where: { id: params.organisationId }, select: { id: true, name: true } })
        : await prisma.organisationProfile.findFirst({ select: { id: true, name: true } });

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
    'Propose creating a new department. Requires human approval.',
    {
      name: z.string().describe('Department name'),
      departmentCode: z.string().describe('Unique department code'),
      description: z.string().optional().describe('Department description'),
      departmentCategory: z.string().optional().describe('Department category'),
      criticalityLevel: z.string().optional().describe('Criticality level'),
      parentId: z.string().optional().describe('Parent department UUID'),
      functionType: z.string().optional().describe('Function type'),
      departmentHeadId: z.string().optional().describe('Department head user UUID'),
      deputyHeadId: z.string().optional().describe('Deputy head user UUID'),
      headcount: z.number().int().optional().describe('Headcount'),
      costCenter: z.string().optional().describe('Cost center'),
      contactEmail: z.string().optional().describe('Contact email'),
      contactPhone: z.string().optional().describe('Contact phone'),
      handlesPersonalData: z.boolean().optional().describe('Whether department handles personal data'),
      handlesFinancialData: z.boolean().optional().describe('Whether department handles financial data'),
      establishedDate: z.string().datetime().optional().describe('Established date (ISO 8601)'),
      reason: z.string().optional().describe('Reason for creation'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose updating an existing department. Requires human approval.',
    {
      departmentId: z.string().describe('Department UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      departmentCategory: z.string().optional().describe('New category'),
      criticalityLevel: z.string().optional().describe('New criticality level'),
      isActive: z.boolean().optional().describe('Active status'),
      functionType: z.string().optional().describe('Function type'),
      departmentHeadId: z.string().optional().describe('Department head user UUID'),
      deputyHeadId: z.string().optional().describe('Deputy head user UUID'),
      headcount: z.number().int().optional().describe('Headcount'),
      costCenter: z.string().optional().describe('Cost center'),
      contactEmail: z.string().optional().describe('Contact email'),
      contactPhone: z.string().optional().describe('Contact phone'),
      handlesPersonalData: z.boolean().optional().describe('Whether department handles personal data'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose creating a new location. Requires human approval.',
    {
      name: z.string().describe('Location name'),
      locationCode: z.string().optional().describe('Unique location code'),
      locationType: z.string().optional().describe('Location type'),
      address: z.string().optional().describe('Address'),
      city: z.string().optional().describe('City'),
      country: z.string().optional().describe('Country'),
      inIsmsScope: z.boolean().optional().describe('Whether in ISMS scope'),
      isDataCenter: z.boolean().optional().describe('Whether this is a data center'),
      state: z.string().optional().describe('State/province'),
      postalCode: z.string().optional().describe('Postal code'),
      region: z.string().optional().describe('Region'),
      timezone: z.string().optional().describe('Timezone'),
      employeeCount: z.number().int().optional().describe('Employee count at this location'),
      physicalSecurityLevel: z.string().optional().describe('Physical security level'),
      accessControlType: z.string().optional().describe('Access control type'),
      hasServerRoom: z.boolean().optional().describe('Whether location has a server room'),
      backupPower: z.boolean().optional().describe('Whether location has backup power'),
      networkType: z.string().optional().describe('Network type'),
      isActive: z.boolean().optional().describe('Whether location is active'),
      scopeJustification: z.string().optional().describe('Scope justification'),
      reason: z.string().optional().describe('Reason for creation'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose updating an existing location. Requires human approval.',
    {
      locationId: z.string().describe('Location UUID'),
      name: z.string().optional().describe('New name'),
      locationType: z.string().optional().describe('New location type'),
      address: z.string().optional().describe('New address'),
      city: z.string().optional().describe('New city'),
      country: z.string().optional().describe('New country'),
      inIsmsScope: z.boolean().optional().describe('Whether in ISMS scope'),
      isActive: z.boolean().optional().describe('Active status'),
      state: z.string().optional().describe('State/province'),
      postalCode: z.string().optional().describe('Postal code'),
      region: z.string().optional().describe('Region'),
      timezone: z.string().optional().describe('Timezone'),
      physicalSecurityLevel: z.string().optional().describe('Physical security level'),
      hasServerRoom: z.boolean().optional().describe('Whether location has a server room'),
      backupPower: z.boolean().optional().describe('Whether location has backup power'),
      scopeJustification: z.string().optional().describe('Scope justification'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose creating a new business process. Requires human approval.',
    {
      name: z.string().describe('Process name'),
      processCode: z.string().describe('Unique process code'),
      processType: z.string().describe('Process type'),
      description: z.string().optional().describe('Process description'),
      criticalityLevel: z.string().optional().describe('Criticality level (critical, high, medium, low)'),
      departmentId: z.string().optional().describe('Department UUID'),
      processOwnerId: z.string().optional().describe('Process owner user UUID'),
      processManagerId: z.string().optional().describe('Process manager user UUID'),
      frequency: z.string().optional().describe('Process frequency'),
      automationLevel: z.string().optional().describe('Automation level'),
      isActive: z.boolean().optional().describe('Whether the process is active'),
      biaStatus: z.string().optional().describe('BIA status'),
      bcpEnabled: z.boolean().optional().describe('Whether BCP is enabled'),
      bcpCriticality: z.string().optional().describe('BCP criticality'),
      recoveryTimeObjectiveMinutes: z.number().int().optional().describe('Recovery Time Objective in minutes'),
      recoveryPointObjectiveMinutes: z.number().int().optional().describe('Recovery Point Objective in minutes'),
      maximumTolerableDowntimeMinutes: z.number().int().optional().describe('Maximum tolerable downtime in minutes'),
      parentProcessId: z.string().optional().describe('Parent process UUID'),
      reason: z.string().optional().describe('Reason for creation'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose updating an existing business process. Requires human approval.',
    {
      processId: z.string().describe('BusinessProcess UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      criticalityLevel: z.string().optional().describe('New criticality level'),
      processType: z.string().optional().describe('New process type'),
      isActive: z.boolean().optional().describe('Active status'),
      processOwnerId: z.string().optional().describe('Process owner user UUID'),
      processManagerId: z.string().optional().describe('Process manager user UUID'),
      frequency: z.string().optional().describe('Process frequency'),
      automationLevel: z.string().optional().describe('Automation level'),
      biaStatus: z.string().optional().describe('BIA status'),
      bcpEnabled: z.boolean().optional().describe('Whether BCP is enabled'),
      bcpCriticality: z.string().optional().describe('BCP criticality'),
      parentProcessId: z.string().optional().describe('Parent process UUID'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose creating a new external dependency (vendor/supplier). Requires human approval.',
    {
      name: z.string().describe('Dependency name'),
      dependencyType: z.string().describe('Dependency type'),
      description: z.string().describe('Description'),
      criticalityLevel: z.string().describe('Criticality level'),
      contractStart: z.string().datetime().describe('Contract start date (ISO 8601)'),
      contractEnd: z.string().datetime().describe('Contract end date (ISO 8601)'),
      contactEmail: z.string().describe('Contact email'),
      singlePointOfFailure: z.boolean().optional().describe('Is single point of failure'),
      vendorWebsite: z.string().optional().describe('Vendor website URL'),
      contractReference: z.string().optional().describe('Contract reference'),
      annualCost: z.number().optional().describe('Annual cost'),
      dataLocation: z.string().optional().describe('Data location/jurisdiction'),
      riskRating: z.string().optional().describe('Risk rating'),
      primaryContact: z.string().optional().describe('Primary contact name'),
      contactPhone: z.string().optional().describe('Contact phone'),
      exitStrategy: z.string().optional().describe('Exit strategy'),
      reason: z.string().optional().describe('Reason for creation'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose updating an existing external dependency. Requires human approval.',
    {
      dependencyId: z.string().describe('ExternalDependency UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      criticalityLevel: z.string().optional().describe('New criticality level'),
      dependencyType: z.string().optional().describe('New dependency type'),
      contractEnd: z.string().datetime().optional().describe('New contract end date (ISO 8601)'),
      contractReference: z.string().optional().describe('Contract reference'),
      annualCost: z.number().optional().describe('Annual cost'),
      dataLocation: z.string().optional().describe('Data location/jurisdiction'),
      primaryContact: z.string().optional().describe('Primary contact name'),
      riskRating: z.string().optional().describe('New risk rating'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose creating a new security committee. Requires human approval.',
    {
      name: z.string().describe('Committee name'),
      committeeType: z.string().describe('Committee type'),
      description: z.string().optional().describe('Committee description'),
      meetingFrequency: z.string().describe('Meeting frequency (e.g. "monthly", "quarterly")'),
      establishedDate: z.string().datetime().describe('Established date (ISO 8601)'),
      chairId: z.string().optional().describe('Chair user UUID'),
      authorityLevel: z.string().optional().describe('Authority level'),
      isActive: z.boolean().optional().describe('Whether the committee is active'),
      reason: z.string().optional().describe('Reason for creation'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose updating an existing committee. Requires human approval.',
    {
      committeeId: z.string().describe('SecurityCommittee UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      meetingFrequency: z.string().optional().describe('New meeting frequency'),
      isActive: z.boolean().optional().describe('Active status'),
      chairId: z.string().optional().describe('Chair user UUID'),
      authorityLevel: z.string().optional().describe('Authority level'),
      committeeType: z.string().optional().describe('Committee type'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
    'Propose scheduling a new committee meeting. Requires human approval.',
    {
      committeeId: z.string().describe('SecurityCommittee UUID'),
      title: z.string().describe('Meeting title'),
      meetingDate: z.string().datetime().describe('Meeting date (ISO 8601)'),
      startTime: z.string().describe('Start time (HH:MM)'),
      endTime: z.string().optional().describe('End time (HH:MM)'),
      locationType: z.string().optional().describe('Location type (virtual, physical, hybrid)'),
      agenda: z.string().optional().describe('Meeting agenda'),
      meetingType: z.string().optional().describe('Meeting type (e.g. regular, ad-hoc, emergency)'),
      physicalLocation: z.string().optional().describe('Physical location address'),
      virtualMeetingLink: z.string().optional().describe('Virtual meeting link/URL'),
      objectives: z.string().optional().describe('Meeting objectives'),
      status: z.string().optional().describe('Initial meeting status'),
      quorumRequirement: z.number().int().optional().describe('Minimum attendees for quorum'),
      reason: z.string().optional().describe('Reason for scheduling'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
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
