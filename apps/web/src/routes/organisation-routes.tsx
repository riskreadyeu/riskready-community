import type { RouteObject } from "react-router-dom";

import { lazyNamed, routeElement } from "./lazy";

const OrganisationDashboardPage = lazyNamed(() => import("@/pages/organisation"), "OrganisationDashboardPage");
const DepartmentsPage = lazyNamed(() => import("@/pages/organisation"), "DepartmentsPage");
const LocationsPage = lazyNamed(() => import("@/pages/organisation"), "LocationsPage");
const BusinessProcessesPage = lazyNamed(() => import("@/pages/organisation"), "BusinessProcessesPage");
const SecurityCommitteesPage = lazyNamed(() => import("@/pages/organisation"), "SecurityCommitteesPage");
const MeetingActionItemsPage = lazyNamed(() => import("@/pages/organisation"), "MeetingActionItemsPage");
const MeetingActionItemDetailPage = lazyNamed(() => import("@/pages/organisation"), "MeetingActionItemDetailPage");
const ExternalDependenciesPage = lazyNamed(() => import("@/pages/organisation"), "ExternalDependenciesPage");
const RegulatorsPage = lazyNamed(() => import("@/pages/organisation"), "RegulatorsPage");
const ExecutivePositionsPage = lazyNamed(() => import("@/pages/organisation"), "ExecutivePositionsPage");
const SecurityChampionsPage = lazyNamed(() => import("@/pages/organisation"), "SecurityChampionsPage");
const CommitteeMeetingsPage = lazyNamed(() => import("@/pages/organisation"), "CommitteeMeetingsPage");
const MeetingDecisionsPage = lazyNamed(() => import("@/pages/organisation"), "MeetingDecisionsPage");
const RegulatoryEligibilityPage = lazyNamed(() => import("@/pages/organisation"), "RegulatoryEligibilityPage");
const RegulatoryEligibilitySurveyPage = lazyNamed(() => import("@/pages/organisation"), "RegulatoryEligibilitySurveyPage");
const OrganisationProfilesPage = lazyNamed(() => import("@/pages/organisation"), "OrganisationProfilesPage");
const BusinessProcessDetailPage = lazyNamed(() => import("@/pages/organisation"), "BusinessProcessDetailPage");
const SecurityCommitteeDetailPage = lazyNamed(() => import("@/pages/organisation"), "SecurityCommitteeDetailPage");
const DepartmentDetailPage = lazyNamed(() => import("@/pages/organisation"), "DepartmentDetailPage");
const OrganisationProfileDetailPage = lazyNamed(() => import("@/pages/organisation"), "OrganisationProfileDetailPage");
const ProductsServicesPage = lazyNamed(() => import("@/pages/organisation"), "ProductsServicesPage");
const TechnologyPlatformsPage = lazyNamed(() => import("@/pages/organisation"), "TechnologyPlatformsPage");
const InterestedPartiesPage = lazyNamed(() => import("@/pages/organisation"), "InterestedPartiesPage");
const ContextIssuesPage = lazyNamed(() => import("@/pages/organisation"), "ContextIssuesPage");
const LocationDetailPage = lazyNamed(() => import("@/pages/organisation"), "LocationDetailPage");
const ExternalDependencyDetailPage = lazyNamed(() => import("@/pages/organisation"), "ExternalDependencyDetailPage");
const RegulatorDetailPage = lazyNamed(() => import("@/pages/organisation"), "RegulatorDetailPage");
const ExecutivePositionDetailPage = lazyNamed(() => import("@/pages/organisation"), "ExecutivePositionDetailPage");
const SecurityChampionDetailPage = lazyNamed(() => import("@/pages/organisation"), "SecurityChampionDetailPage");
const ProductServiceDetailPage = lazyNamed(() => import("@/pages/organisation"), "ProductServiceDetailPage");
const TechnologyPlatformDetailPage = lazyNamed(() => import("@/pages/organisation"), "TechnologyPlatformDetailPage");
const InterestedPartyDetailPage = lazyNamed(() => import("@/pages/organisation"), "InterestedPartyDetailPage");
const ContextIssueDetailPage = lazyNamed(() => import("@/pages/organisation"), "ContextIssueDetailPage");
const KeyPersonnelPage = lazyNamed(() => import("@/pages/organisation"), "KeyPersonnelPage");
const KeyPersonnelDetailPage = lazyNamed(() => import("@/pages/organisation"), "KeyPersonnelDetailPage");
const ApplicableFrameworksPage = lazyNamed(() => import("@/pages/organisation"), "ApplicableFrameworksPage");
const ApplicableFrameworkDetailPage = lazyNamed(() => import("@/pages/organisation"), "ApplicableFrameworkDetailPage");
const CommitteeMeetingDetailPage = lazyNamed(() => import("@/pages/organisation"), "CommitteeMeetingDetailPage");
const MeetingDecisionDetailPage = lazyNamed(() => import("@/pages/organisation"), "MeetingDecisionDetailPage");
const OrganisationalUnitsPage = lazyNamed(() => import("@/pages/organisation"), "OrganisationalUnitsPage");
const OrganisationalUnitDetailPage = lazyNamed(() => import("@/pages/organisation"), "OrganisationalUnitDetailPage");
const MeetingAttendancesPage = lazyNamed(() => import("@/pages/organisation"), "MeetingAttendancesPage");

export const organisationRoutes: RouteObject[] = [
  { path: "/organisation", element: routeElement(OrganisationDashboardPage) },
  { path: "/organisation/departments", element: routeElement(DepartmentsPage) },
  { path: "/organisation/locations", element: routeElement(LocationsPage) },
  { path: "/organisation/processes", element: routeElement(BusinessProcessesPage) },
  { path: "/organisation/dependencies", element: routeElement(ExternalDependenciesPage) },
  { path: "/organisation/security-committees", element: routeElement(SecurityCommitteesPage) },
  { path: "/organisation/meeting-action-items", element: routeElement(MeetingActionItemsPage) },
  { path: "/organisation/meeting-action-items/:actionId", element: routeElement(MeetingActionItemDetailPage) },
  { path: "/organisation/regulators", element: routeElement(RegulatorsPage) },
  { path: "/organisation/executive-positions", element: routeElement(ExecutivePositionsPage) },
  { path: "/organisation/security-champions", element: routeElement(SecurityChampionsPage) },
  { path: "/organisation/committee-meetings", element: routeElement(CommitteeMeetingsPage) },
  { path: "/organisation/meeting-decisions", element: routeElement(MeetingDecisionsPage) },
  { path: "/organisation/regulatory-eligibility", element: routeElement(RegulatoryEligibilityPage) },
  { path: "/organisation/regulatory-eligibility/:surveyId", element: routeElement(RegulatoryEligibilitySurveyPage) },
  { path: "/organisation/profiles", element: routeElement(OrganisationProfilesPage) },
  { path: "/organisation/processes/:processId", element: routeElement(BusinessProcessDetailPage) },
  { path: "/organisation/security-committees/:committeeId", element: routeElement(SecurityCommitteeDetailPage) },
  { path: "/organisation/departments/:departmentId", element: routeElement(DepartmentDetailPage) },
  { path: "/organisation/profiles/:profileId", element: routeElement(OrganisationProfileDetailPage) },
  { path: "/organisation/products-services", element: routeElement(ProductsServicesPage) },
  { path: "/organisation/technology-platforms", element: routeElement(TechnologyPlatformsPage) },
  { path: "/organisation/interested-parties", element: routeElement(InterestedPartiesPage) },
  { path: "/organisation/context-issues", element: routeElement(ContextIssuesPage) },
  { path: "/organisation/locations/:locationId", element: routeElement(LocationDetailPage) },
  { path: "/organisation/dependencies/:dependencyId", element: routeElement(ExternalDependencyDetailPage) },
  { path: "/organisation/regulators/:regulatorId", element: routeElement(RegulatorDetailPage) },
  { path: "/organisation/executive-positions/:positionId", element: routeElement(ExecutivePositionDetailPage) },
  { path: "/organisation/security-champions/:championId", element: routeElement(SecurityChampionDetailPage) },
  { path: "/organisation/products-services/:productId", element: routeElement(ProductServiceDetailPage) },
  { path: "/organisation/technology-platforms/:platformId", element: routeElement(TechnologyPlatformDetailPage) },
  { path: "/organisation/interested-parties/:partyId", element: routeElement(InterestedPartyDetailPage) },
  { path: "/organisation/context-issues/:issueId", element: routeElement(ContextIssueDetailPage) },
  { path: "/organisation/key-personnel", element: routeElement(KeyPersonnelPage) },
  { path: "/organisation/key-personnel/:personnelId", element: routeElement(KeyPersonnelDetailPage) },
  { path: "/organisation/applicable-frameworks", element: routeElement(ApplicableFrameworksPage) },
  { path: "/organisation/applicable-frameworks/:frameworkId", element: routeElement(ApplicableFrameworkDetailPage) },
  { path: "/organisation/committee-meetings/:meetingId", element: routeElement(CommitteeMeetingDetailPage) },
  { path: "/organisation/meeting-decisions/:decisionId", element: routeElement(MeetingDecisionDetailPage) },
  { path: "/organisation/organisational-units", element: routeElement(OrganisationalUnitsPage) },
  { path: "/organisation/organisational-units/:unitId", element: routeElement(OrganisationalUnitDetailPage) },
  { path: "/organisation/meeting-attendances", element: routeElement(MeetingAttendancesPage) },
];
