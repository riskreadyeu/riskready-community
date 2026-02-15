import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";

import AppShell from "@/components/app-shell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoginPage from "@/pages/LoginPage";

// ITSM Module
import {
  ITSMDashboardPage,
  AssetRegisterPage,
  AssetDetailPage,
  AssetFormPage,
  ChangeRegisterPage,
  ChangeDetailPage,
  ChangeFormPage,
  ChangeCalendarPage,
  CABDashboardPage,
  DataQualityPage,
  CapacityPlanListPage,
  CapacityPlanDetailPage,
  CapacityPlanCreatePage,
  ChangeTemplateListPage,
  ChangeTemplateDetailPage,
  ChangeTemplateCreatePage,
} from "@/pages/itsm";
import AuditsPage from "@/pages/AuditsPage";
import NonconformityRegisterPage from "@/pages/audits/NonconformityRegisterPage";
import NonconformityDetailPage from "@/pages/audits/NonconformityDetailPage";
import DashboardPage from "@/pages/DashboardPage";

// Evidence Module
import {
  EvidenceDashboardPage,
  EvidenceRepositoryPage,
  EvidenceRequestsPage,
  EvidenceDetailPage,
} from "@/pages/evidence";

// Incidents Module
import {
  IncidentsDashboardPage,
  IncidentRegisterPage,
  IncidentDetailPage,
  IncidentFormPage,
  IncidentLessonsPage,
} from "@/pages/incidents";

// Policies Module
import {
  PoliciesDashboardPage,
  PolicyDocumentListPage,
  PolicyDocumentDetailPage,
  DocumentEditorPage,
  ChangeRequestsPage,
  ExceptionsPage,
  AcknowledgmentsPage,
  DocumentHierarchyPage,
  VersionHistoryPage,
  ApprovalsPage,
  ReviewsPage,
  ControlMappingsPage,
} from "@/pages/policies";

// Risks Module
import {
  RisksDashboardPage,
  RiskRegisterPage,
  RiskDetailPage,
  RiskScenarioDetailPage,
  TreatmentPlanListPage,
  TreatmentPlanDetailPage,
  RTSListPage,
  RTSDetailPage,
  RiskCreatePage,
  RTSCreatePage,
  TreatmentPlanCreatePage,
  ScenarioCreatePage,
} from "@/pages/risks";

import SettingsPage from "@/pages/SettingsPage";
import McpApprovalsPage from "@/pages/McpApprovalsPage";

// Controls Module
import {
  ControlsCommandCenterPage,
  ControlsDashboardPage,
  ControlsLibraryPage,
  ControlDetailPage,
  ControlCreatePage,
  AssessmentListPage,
  AssessmentCreatePage,
  AssessmentDetailPage,
} from "@/pages/controls";
import SOAListPage from "@/pages/controls/soa/SOAListPage";
import SOADetailPage from "@/pages/controls/soa/SOADetailPage";
import SOACreatePage from "@/pages/controls/soa/SOACreatePage";
import ScopeRegistryPage from "@/pages/controls/scope/ScopeRegistryPage";

// Organisation Module
import {
  OrganisationDashboardPage,
  DepartmentsPage,
  LocationsPage,
  BusinessProcessesPage,
  SecurityCommitteesPage,
  MeetingActionItemsPage,
  ExternalDependenciesPage,
  RegulatorsPage,
  ExecutivePositionsPage,
  SecurityChampionsPage,
  CommitteeMeetingsPage,
  MeetingDecisionsPage,
  RegulatoryEligibilityPage,
  RegulatoryEligibilitySurveyPage,
  OrganisationProfilesPage,
  BusinessProcessDetailPage,
  SecurityCommitteeDetailPage,
  DepartmentDetailPage,
  OrganisationProfileDetailPage,
  ProductsServicesPage,
  TechnologyPlatformsPage,
  InterestedPartiesPage,
  ContextIssuesPage,
  LocationDetailPage,
  ExternalDependencyDetailPage,
  RegulatorDetailPage,
  ExecutivePositionDetailPage,
  SecurityChampionDetailPage,
  ProductServiceDetailPage,
  TechnologyPlatformDetailPage,
  InterestedPartyDetailPage,
  ContextIssueDetailPage,
  KeyPersonnelPage,
  KeyPersonnelDetailPage,
  ApplicableFrameworksPage,
  ApplicableFrameworkDetailPage,
  CommitteeMeetingDetailPage,
  MeetingDecisionDetailPage,
  MeetingActionItemDetailPage,
  OrganisationalUnitsPage,
  OrganisationalUnitDetailPage,
  MeetingAttendancesPage,
} from "@/pages/organisation";

import { getMe, login, logout } from "@/lib/api";

type User = { id: string; email: string };

function AppInner() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={async (email, password) => {
                const res = await login(email, password);
                setUser(res.user);
                const from = (location.state as any)?.from ?? "/dashboard";
                navigate(from, { replace: true });
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location.pathname }} />} />
      </Routes>
    );
  }

  return (
    <AppShell
      user={user}
      onLogout={async () => {
        await logout();
        setUser(null);
        navigate("/login", { replace: true });
      }}
    >
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Risks Module Routes */}
        <Route path="/risks" element={<RisksDashboardPage />} />
        <Route path="/risks/register" element={<RiskRegisterPage />} />
        <Route path="/risks/register/new" element={<RiskCreatePage />} />
        <Route path="/risks/tolerance" element={<RTSListPage />} />
        <Route path="/risks/tolerance/new" element={<RTSCreatePage />} />
        <Route path="/risks/tolerance/:id" element={<RTSDetailPage />} />
        <Route path="/risks/treatments" element={<TreatmentPlanListPage />} />
        <Route path="/risks/treatments/new" element={<TreatmentPlanCreatePage />} />
        <Route path="/risks/treatments/:id" element={<TreatmentPlanDetailPage />} />
        <Route path="/risks/scenarios/new" element={<ScenarioCreatePage />} />
        <Route path="/risks/scenarios/:id" element={<RiskScenarioDetailPage />} />
        <Route path="/risks/:id" element={<RiskDetailPage />} />

        {/* Controls Module Routes */}
        <Route path="/controls" element={<ControlsCommandCenterPage />} />
        <Route path="/controls/dashboard" element={<ControlsDashboardPage />} />
        <Route path="/controls/library" element={<ControlsLibraryPage />} />
        <Route path="/controls/library/new" element={<ControlCreatePage />} />
        <Route path="/controls/assessments" element={<AssessmentListPage />} />
        <Route path="/controls/assessments/new" element={<AssessmentCreatePage />} />
        <Route path="/controls/assessments/:id" element={<AssessmentDetailPage />} />
        <Route path="/controls/:controlId" element={<ControlDetailPage />} />
        <Route path="/controls/soa" element={<SOAListPage />} />
        <Route path="/controls/soa/new" element={<SOACreatePage />} />
        <Route path="/controls/soa/:id" element={<SOADetailPage />} />
        <Route path="/controls/scope" element={<ScopeRegistryPage />} />

        {/* Policies Module Routes */}
        <Route path="/policies" element={<PoliciesDashboardPage />} />
        <Route path="/policies/documents" element={<PolicyDocumentListPage />} />
        <Route path="/policies/documents/new" element={<DocumentEditorPage />} />
        <Route path="/policies/documents/:id/edit" element={<DocumentEditorPage />} />
        <Route path="/policies/documents/:id" element={<PolicyDocumentDetailPage />} />
        <Route path="/policies/hierarchy" element={<DocumentHierarchyPage />} />
        <Route path="/policies/versions" element={<VersionHistoryPage />} />
        <Route path="/policies/approvals" element={<ApprovalsPage />} />
        <Route path="/policies/changes" element={<ChangeRequestsPage />} />
        <Route path="/policies/exceptions" element={<ExceptionsPage />} />
        <Route path="/policies/acknowledgments" element={<AcknowledgmentsPage />} />
        <Route path="/policies/reviews" element={<ReviewsPage />} />
        <Route path="/policies/mappings" element={<ControlMappingsPage />} />

        {/* Audits Module Routes */}
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/audits/nonconformities" element={<NonconformityRegisterPage />} />
        <Route path="/audits/nonconformities/:id" element={<NonconformityDetailPage />} />

        {/* Incidents Module Routes */}
        <Route path="/incidents" element={<IncidentsDashboardPage />} />
        <Route path="/incidents/register" element={<IncidentRegisterPage />} />
        <Route path="/incidents/new" element={<IncidentFormPage />} />
        <Route path="/incidents/lessons" element={<IncidentLessonsPage />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route path="/incidents/:id/edit" element={<IncidentFormPage />} />

        {/* Evidence Module Routes */}
        <Route path="/evidence" element={<EvidenceDashboardPage />} />
        <Route path="/evidence/repository" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/requests" element={<EvidenceRequestsPage />} />
        <Route path="/evidence/requests/:id" element={<EvidenceDetailPage />} />
        <Route path="/evidence/pending" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/approved" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/expiring" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/search" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/links" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/coverage" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/archive" element={<EvidenceRepositoryPage />} />
        <Route path="/evidence/:id" element={<EvidenceDetailPage />} />

        {/* ITSM Module Routes */}
        <Route path="/itsm" element={<ITSMDashboardPage />} />
        <Route path="/itsm/assets" element={<AssetRegisterPage />} />
        <Route path="/itsm/assets/new" element={<AssetFormPage />} />
        <Route path="/itsm/assets/:id" element={<AssetDetailPage />} />
        <Route path="/itsm/assets/:id/edit" element={<AssetFormPage />} />
        <Route path="/itsm/data-quality" element={<DataQualityPage />} />
        <Route path="/itsm/changes" element={<ChangeRegisterPage />} />
        <Route path="/itsm/changes/calendar" element={<ChangeCalendarPage />} />
        <Route path="/itsm/changes/cab" element={<CABDashboardPage />} />
        <Route path="/itsm/changes/new" element={<ChangeFormPage />} />
        <Route path="/itsm/changes/:id" element={<ChangeDetailPage />} />
        <Route path="/itsm/changes/:id/edit" element={<ChangeFormPage />} />
        <Route path="/itsm/capacity-plans" element={<CapacityPlanListPage />} />
        <Route path="/itsm/capacity-plans/new" element={<CapacityPlanCreatePage />} />
        <Route path="/itsm/capacity-plans/:id" element={<CapacityPlanDetailPage />} />
        <Route path="/itsm/change-templates" element={<ChangeTemplateListPage />} />
        <Route path="/itsm/change-templates/new" element={<ChangeTemplateCreatePage />} />
        <Route path="/itsm/change-templates/:id" element={<ChangeTemplateDetailPage />} />
        <Route path="/assets" element={<Navigate to="/itsm/assets" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/mcp-approvals" element={<McpApprovalsPage />} />

        {/* Organisation Module Routes */}
        <Route path="/organisation" element={<OrganisationDashboardPage />} />
        <Route path="/organisation/departments" element={<DepartmentsPage />} />
        <Route path="/organisation/locations" element={<LocationsPage />} />
        <Route path="/organisation/processes" element={<BusinessProcessesPage />} />
        <Route path="/organisation/dependencies" element={<ExternalDependenciesPage />} />
        <Route path="/organisation/security-committees" element={<SecurityCommitteesPage />} />
        <Route path="/organisation/meeting-action-items" element={<MeetingActionItemsPage />} />
        <Route path="/organisation/meeting-action-items/:actionId" element={<MeetingActionItemDetailPage />} />
        <Route path="/organisation/regulators" element={<RegulatorsPage />} />
        <Route path="/organisation/executive-positions" element={<ExecutivePositionsPage />} />
        <Route path="/organisation/security-champions" element={<SecurityChampionsPage />} />
        <Route path="/organisation/committee-meetings" element={<CommitteeMeetingsPage />} />
        <Route path="/organisation/meeting-decisions" element={<MeetingDecisionsPage />} />
        <Route path="/organisation/regulatory-eligibility" element={<RegulatoryEligibilityPage />} />
        <Route path="/organisation/regulatory-eligibility/:surveyId" element={<RegulatoryEligibilitySurveyPage />} />
        <Route path="/organisation/profiles" element={<OrganisationProfilesPage />} />
        <Route path="/organisation/processes/:processId" element={<BusinessProcessDetailPage />} />
        <Route path="/organisation/security-committees/:committeeId" element={<SecurityCommitteeDetailPage />} />
        <Route path="/organisation/departments/:departmentId" element={<DepartmentDetailPage />} />
        <Route path="/organisation/profiles/:profileId" element={<OrganisationProfileDetailPage />} />
        <Route path="/organisation/products-services" element={<ProductsServicesPage />} />
        <Route path="/organisation/technology-platforms" element={<TechnologyPlatformsPage />} />
        <Route path="/organisation/interested-parties" element={<InterestedPartiesPage />} />
        <Route path="/organisation/context-issues" element={<ContextIssuesPage />} />
        <Route path="/organisation/locations/:locationId" element={<LocationDetailPage />} />
        <Route path="/organisation/dependencies/:dependencyId" element={<ExternalDependencyDetailPage />} />
        <Route path="/organisation/regulators/:regulatorId" element={<RegulatorDetailPage />} />
        <Route path="/organisation/executive-positions/:positionId" element={<ExecutivePositionDetailPage />} />
        <Route path="/organisation/security-champions/:championId" element={<SecurityChampionDetailPage />} />
        <Route path="/organisation/products-services/:productId" element={<ProductServiceDetailPage />} />
        <Route path="/organisation/technology-platforms/:platformId" element={<TechnologyPlatformDetailPage />} />
        <Route path="/organisation/interested-parties/:partyId" element={<InterestedPartyDetailPage />} />
        <Route path="/organisation/context-issues/:issueId" element={<ContextIssueDetailPage />} />
        <Route path="/organisation/key-personnel" element={<KeyPersonnelPage />} />
        <Route path="/organisation/key-personnel/:personnelId" element={<KeyPersonnelDetailPage />} />
        <Route path="/organisation/applicable-frameworks" element={<ApplicableFrameworksPage />} />
        <Route path="/organisation/applicable-frameworks/:frameworkId" element={<ApplicableFrameworkDetailPage />} />
        <Route path="/organisation/committee-meetings/:meetingId" element={<CommitteeMeetingDetailPage />} />
        <Route path="/organisation/meeting-decisions/:decisionId" element={<MeetingDecisionDetailPage />} />
        <Route path="/organisation/organisational-units" element={<OrganisationalUnitsPage />} />
        <Route path="/organisation/organisational-units/:unitId" element={<OrganisationalUnitDetailPage />} />
        <Route path="/organisation/meeting-attendances" element={<MeetingAttendancesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <AppInner />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
