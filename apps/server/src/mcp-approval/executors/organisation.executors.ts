import { OrganisationProfileService } from '../../organisation/services/organisation-profile.service';
import { DepartmentService } from '../../organisation/services/department.service';
import { LocationService } from '../../organisation/services/location.service';
import { BusinessProcessService } from '../../organisation/services/business-process.service';
import { SecurityCommitteeService } from '../../organisation/services/security-committee.service';
import { CommitteeMeetingService } from '../../organisation/services/committee-meeting.service';
import { ExternalDependencyService } from '../../organisation/services/external-dependency.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  UpdateOrgProfilePayload,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  CreateLocationPayload,
  UpdateLocationPayload,
  CreateBusinessProcessPayload,
  UpdateBusinessProcessPayload,
  CreateCommitteePayload,
  UpdateCommitteePayload,
  CreateCommitteeMeetingPayload,
  CreateExternalDependencyPayload,
  UpdateExternalDependencyPayload,
} from './payload-schemas';

export interface OrganisationExecutorServices {
  organisationProfileService: OrganisationProfileService;
  departmentService: DepartmentService;
  locationService: LocationService;
  businessProcessService: BusinessProcessService;
  securityCommitteeService: SecurityCommitteeService;
  committeeMeetingService: CommitteeMeetingService;
  externalDependencyService: ExternalDependencyService;
}

export function registerOrganisationExecutors(executors: ExecutorMap, services: OrganisationExecutorServices): void {
  const {
    organisationProfileService,
    departmentService,
    locationService,
    businessProcessService,
    securityCommitteeService,
    committeeMeetingService,
    externalDependencyService,
  } = services;

  // --- Organisation profile ---

  executors.set('UPDATE_ORG_PROFILE', (p, userId) => {
    const { organisationId, ...data } = validatePayload(UpdateOrgProfilePayload, p, 'UPDATE_ORG_PROFILE');
    return organisationProfileService.updateWithAppetite(organisationId, stripMcpMeta(data), userId);
  });

  // --- Departments ---

  executors.set('CREATE_DEPARTMENT', (p) => {
    const validated = validatePayload(CreateDepartmentPayload, p, 'CREATE_DEPARTMENT');
    const cleaned = prepareCreatePayload(validated);
    // Department has no organisationId column; strip it along with MCP metadata
    delete cleaned['organisationId'];
    return departmentService.create(cleaned as any);
  });

  executors.set('UPDATE_DEPARTMENT', (p) => {
    const { departmentId, ...data } = validatePayload(UpdateDepartmentPayload, p, 'UPDATE_DEPARTMENT');
    return departmentService.update(departmentId, stripMcpMeta(data) as any);
  });

  // --- Locations ---

  executors.set('CREATE_LOCATION', (p) => {
    const validated = validatePayload(CreateLocationPayload, p, 'CREATE_LOCATION');
    const cleaned = prepareCreatePayload(validated);
    // Location has no organisationId column; strip it along with MCP metadata
    delete cleaned['organisationId'];
    return locationService.create(cleaned as any);
  });

  executors.set('UPDATE_LOCATION', (p) => {
    const { locationId, ...data } = validatePayload(UpdateLocationPayload, p, 'UPDATE_LOCATION');
    return locationService.update(locationId, stripMcpMeta(data) as any);
  });

  // --- Business Processes ---

  executors.set('CREATE_BUSINESS_PROCESS', (p) => {
    const validated = validatePayload(CreateBusinessProcessPayload, p, 'CREATE_BUSINESS_PROCESS');
    return businessProcessService.create(prepareCreatePayload(validated) as any);
  });

  executors.set('UPDATE_BUSINESS_PROCESS', (p) => {
    const { processId, ...data } = validatePayload(UpdateBusinessProcessPayload, p, 'UPDATE_BUSINESS_PROCESS');
    return businessProcessService.update(processId, stripMcpMeta(data) as any);
  });

  // --- Security Committees ---

  executors.set('CREATE_COMMITTEE', (p) => {
    const validated = validatePayload(CreateCommitteePayload, p, 'CREATE_COMMITTEE');
    return securityCommitteeService.create(prepareCreatePayload(validated) as any);
  });

  executors.set('UPDATE_COMMITTEE', (p) => {
    const { committeeId, ...data } = validatePayload(UpdateCommitteePayload, p, 'UPDATE_COMMITTEE');
    return securityCommitteeService.update(committeeId, stripMcpMeta(data) as any);
  });

  executors.set('CREATE_COMMITTEE_MEETING', (p) => {
    const validated = validatePayload(CreateCommitteeMeetingPayload, p, 'CREATE_COMMITTEE_MEETING');
    return committeeMeetingService.create(prepareCreatePayload(validated) as any);
  });

  // --- External Dependencies ---

  executors.set('CREATE_EXTERNAL_DEPENDENCY', (p) => {
    const validated = validatePayload(CreateExternalDependencyPayload, p, 'CREATE_EXTERNAL_DEPENDENCY');
    return externalDependencyService.create(prepareCreatePayload(validated) as any);
  });

  executors.set('UPDATE_EXTERNAL_DEPENDENCY', (p) => {
    const { dependencyId, ...data } = validatePayload(UpdateExternalDependencyPayload, p, 'UPDATE_EXTERNAL_DEPENDENCY');
    return externalDependencyService.update(dependencyId, stripMcpMeta(data) as any);
  });
}
