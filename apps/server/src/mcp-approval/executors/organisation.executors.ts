import { OrganisationProfileService } from '../../organisation/services/organisation-profile.service';
import { DepartmentService } from '../../organisation/services/department.service';
import { LocationService } from '../../organisation/services/location.service';
import { BusinessProcessService } from '../../organisation/services/business-process.service';
import { SecurityCommitteeService } from '../../organisation/services/security-committee.service';
import { CommitteeMeetingService } from '../../organisation/services/committee-meeting.service';
import { ExternalDependencyService } from '../../organisation/services/external-dependency.service';
import { ExecutorMap } from './types';

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
    const { organisationId, ...data } = p as { organisationId: string; [k: string]: any };
    return organisationProfileService.updateWithAppetite(organisationId, data, userId);
  });

  // --- Departments ---

  executors.set('CREATE_DEPARTMENT', (p) =>
    departmentService.create(p as any),
  );

  executors.set('UPDATE_DEPARTMENT', (p) => {
    const { departmentId, ...data } = p as { departmentId: string; [k: string]: any };
    return departmentService.update(departmentId, data as any);
  });

  // --- Locations ---

  executors.set('CREATE_LOCATION', (p) =>
    locationService.create(p as any),
  );

  executors.set('UPDATE_LOCATION', (p) => {
    const { locationId, ...data } = p as { locationId: string; [k: string]: any };
    return locationService.update(locationId, data as any);
  });

  // --- Business Processes ---

  executors.set('CREATE_BUSINESS_PROCESS', (p) =>
    businessProcessService.create(p as any),
  );

  executors.set('UPDATE_BUSINESS_PROCESS', (p) => {
    const { processId, ...data } = p as { processId: string; [k: string]: any };
    return businessProcessService.update(processId, data as any);
  });

  // --- Security Committees ---

  executors.set('CREATE_COMMITTEE', (p) =>
    securityCommitteeService.create(p as any),
  );

  executors.set('UPDATE_COMMITTEE', (p) => {
    const { committeeId, ...data } = p as { committeeId: string; [k: string]: any };
    return securityCommitteeService.update(committeeId, data as any);
  });

  executors.set('CREATE_COMMITTEE_MEETING', (p) =>
    committeeMeetingService.create(p as any),
  );

  // --- External Dependencies ---

  executors.set('CREATE_EXTERNAL_DEPENDENCY', (p) =>
    externalDependencyService.create(p as any),
  );

  executors.set('UPDATE_EXTERNAL_DEPENDENCY', (p) => {
    const { dependencyId, ...data } = p as { dependencyId: string; [k: string]: any };
    return externalDependencyService.update(dependencyId, data as any);
  });
}
