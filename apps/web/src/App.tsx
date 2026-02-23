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
                const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
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
        <Route path="/risks" element={<ErrorBoundary><RisksDashboardPage /></ErrorBoundary>} />
        <Route path="/risks/register" element={<ErrorBoundary><RiskRegisterPage /></ErrorBoundary>} />
        <Route path="/risks/register/new" element={<ErrorBoundary><RiskCreatePage /></ErrorBoundary>} />
        <Route path="/risks/tolerance" element={<ErrorBoundary><RTSListPage /></ErrorBoundary>} />
        <Route path="/risks/tolerance/new" element={<ErrorBoundary><RTSCreatePage /></ErrorBoundary>} />
        <Route path="/risks/tolerance/:id" element={<ErrorBoundary><RTSDetailPage /></ErrorBoundary>} />
        <Route path="/risks/treatments" element={<ErrorBoundary><TreatmentPlanListPage /></ErrorBoundary>} />
        <Route path="/risks/treatments/new" element={<ErrorBoundary><TreatmentPlanCreatePage /></ErrorBoundary>} />
        <Route path="/risks/treatments/:id" element={<ErrorBoundary><TreatmentPlanDetailPage /></ErrorBoundary>} />
        <Route path="/risks/scenarios/new" element={<ErrorBoundary><ScenarioCreatePage /></ErrorBoundary>} />
        <Route path="/risks/scenarios/:id" element={<ErrorBoundary><RiskScenarioDetailPage /></ErrorBoundary>} />
        <Route path="/risks/:id" element={<ErrorBoundary><RiskDetailPage /></ErrorBoundary>} />

        {/* Controls Module Routes */}
        <Route path="/controls" element={<ErrorBoundary><ControlsCommandCenterPage /></ErrorBoundary>} />
        <Route path="/controls/dashboard" element={<ErrorBoundary><ControlsDashboardPage /></ErrorBoundary>} />
        <Route path="/controls/library" element={<ErrorBoundary><ControlsLibraryPage /></ErrorBoundary>} />
        <Route path="/controls/library/new" element={<ErrorBoundary><ControlCreatePage /></ErrorBoundary>} />
        <Route path="/controls/assessments" element={<ErrorBoundary><AssessmentListPage /></ErrorBoundary>} />
        <Route path="/controls/assessments/new" element={<ErrorBoundary><AssessmentCreatePage /></ErrorBoundary>} />
        <Route path="/controls/assessments/:id" element={<ErrorBoundary><AssessmentDetailPage /></ErrorBoundary>} />
        <Route path="/controls/:controlId" element={<ErrorBoundary><ControlDetailPage /></ErrorBoundary>} />
        <Route path="/controls/soa" element={<ErrorBoundary><SOAListPage /></ErrorBoundary>} />
        <Route path="/controls/soa/new" element={<ErrorBoundary><SOACreatePage /></ErrorBoundary>} />
        <Route path="/controls/soa/:id" element={<ErrorBoundary><SOADetailPage /></ErrorBoundary>} />
        <Route path="/controls/scope" element={<ErrorBoundary><ScopeRegistryPage /></ErrorBoundary>} />

        {/* Policies Module Routes */}
        <Route path="/policies" element={<ErrorBoundary><PoliciesDashboardPage /></ErrorBoundary>} />
        <Route path="/policies/documents" element={<ErrorBoundary><PolicyDocumentListPage /></ErrorBoundary>} />
        <Route path="/policies/documents/new" element={<ErrorBoundary><DocumentEditorPage /></ErrorBoundary>} />
        <Route path="/policies/documents/:id/edit" element={<ErrorBoundary><DocumentEditorPage /></ErrorBoundary>} />
        <Route path="/policies/documents/:id" element={<ErrorBoundary><PolicyDocumentDetailPage /></ErrorBoundary>} />
        <Route path="/policies/hierarchy" element={<ErrorBoundary><DocumentHierarchyPage /></ErrorBoundary>} />
        <Route path="/policies/versions" element={<ErrorBoundary><VersionHistoryPage /></ErrorBoundary>} />
        <Route path="/policies/approvals" element={<ErrorBoundary><ApprovalsPage /></ErrorBoundary>} />
        <Route path="/policies/changes" element={<ErrorBoundary><ChangeRequestsPage /></ErrorBoundary>} />
        <Route path="/policies/exceptions" element={<ErrorBoundary><ExceptionsPage /></ErrorBoundary>} />
        <Route path="/policies/acknowledgments" element={<ErrorBoundary><AcknowledgmentsPage /></ErrorBoundary>} />
        <Route path="/policies/reviews" element={<ErrorBoundary><ReviewsPage /></ErrorBoundary>} />
        <Route path="/policies/mappings" element={<ErrorBoundary><ControlMappingsPage /></ErrorBoundary>} />

        {/* Audits Module Routes */}
        <Route path="/audits" element={<ErrorBoundary><AuditsPage /></ErrorBoundary>} />
        <Route path="/audits/nonconformities" element={<ErrorBoundary><NonconformityRegisterPage /></ErrorBoundary>} />
        <Route path="/audits/nonconformities/:id" element={<ErrorBoundary><NonconformityDetailPage /></ErrorBoundary>} />

        {/* Incidents Module Routes */}
        <Route path="/incidents" element={<ErrorBoundary><IncidentsDashboardPage /></ErrorBoundary>} />
        <Route path="/incidents/register" element={<ErrorBoundary><IncidentRegisterPage /></ErrorBoundary>} />
        <Route path="/incidents/new" element={<ErrorBoundary><IncidentFormPage /></ErrorBoundary>} />
        <Route path="/incidents/lessons" element={<ErrorBoundary><IncidentLessonsPage /></ErrorBoundary>} />
        <Route path="/incidents/:id" element={<ErrorBoundary><IncidentDetailPage /></ErrorBoundary>} />
        <Route path="/incidents/:id/edit" element={<ErrorBoundary><IncidentFormPage /></ErrorBoundary>} />

        {/* Evidence Module Routes */}
        <Route path="/evidence" element={<ErrorBoundary><EvidenceDashboardPage /></ErrorBoundary>} />
        <Route path="/evidence/repository" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/requests" element={<ErrorBoundary><EvidenceRequestsPage /></ErrorBoundary>} />
        <Route path="/evidence/requests/:id" element={<ErrorBoundary><EvidenceDetailPage /></ErrorBoundary>} />
        <Route path="/evidence/pending" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/approved" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/expiring" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/search" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/links" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/coverage" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/archive" element={<ErrorBoundary><EvidenceRepositoryPage /></ErrorBoundary>} />
        <Route path="/evidence/:id" element={<ErrorBoundary><EvidenceDetailPage /></ErrorBoundary>} />

        {/* ITSM Module Routes */}
        <Route path="/itsm" element={<ErrorBoundary><ITSMDashboardPage /></ErrorBoundary>} />
        <Route path="/itsm/assets" element={<ErrorBoundary><AssetRegisterPage /></ErrorBoundary>} />
        <Route path="/itsm/assets/new" element={<ErrorBoundary><AssetFormPage /></ErrorBoundary>} />
        <Route path="/itsm/assets/:id" element={<ErrorBoundary><AssetDetailPage /></ErrorBoundary>} />
        <Route path="/itsm/assets/:id/edit" element={<ErrorBoundary><AssetFormPage /></ErrorBoundary>} />
        <Route path="/itsm/data-quality" element={<ErrorBoundary><DataQualityPage /></ErrorBoundary>} />
        <Route path="/itsm/changes" element={<ErrorBoundary><ChangeRegisterPage /></ErrorBoundary>} />
        <Route path="/itsm/changes/calendar" element={<ErrorBoundary><ChangeCalendarPage /></ErrorBoundary>} />
        <Route path="/itsm/changes/cab" element={<ErrorBoundary><CABDashboardPage /></ErrorBoundary>} />
        <Route path="/itsm/changes/new" element={<ErrorBoundary><ChangeFormPage /></ErrorBoundary>} />
        <Route path="/itsm/changes/:id" element={<ErrorBoundary><ChangeDetailPage /></ErrorBoundary>} />
        <Route path="/itsm/changes/:id/edit" element={<ErrorBoundary><ChangeFormPage /></ErrorBoundary>} />
        <Route path="/itsm/capacity-plans" element={<ErrorBoundary><CapacityPlanListPage /></ErrorBoundary>} />
        <Route path="/itsm/capacity-plans/new" element={<ErrorBoundary><CapacityPlanCreatePage /></ErrorBoundary>} />
        <Route path="/itsm/capacity-plans/:id" element={<ErrorBoundary><CapacityPlanDetailPage /></ErrorBoundary>} />
        <Route path="/itsm/change-templates" element={<ErrorBoundary><ChangeTemplateListPage /></ErrorBoundary>} />
        <Route path="/itsm/change-templates/new" element={<ErrorBoundary><ChangeTemplateCreatePage /></ErrorBoundary>} />
        <Route path="/itsm/change-templates/:id" element={<ErrorBoundary><ChangeTemplateDetailPage /></ErrorBoundary>} />
        <Route path="/assets" element={<Navigate to="/itsm/assets" replace />} />
        <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
        <Route path="/settings/mcp-approvals" element={<ErrorBoundary><McpApprovalsPage /></ErrorBoundary>} />

        {/* Organisation Module Routes */}
        <Route path="/organisation" element={<ErrorBoundary><OrganisationDashboardPage /></ErrorBoundary>} />
        <Route path="/organisation/departments" element={<ErrorBoundary><DepartmentsPage /></ErrorBoundary>} />
        <Route path="/organisation/locations" element={<ErrorBoundary><LocationsPage /></ErrorBoundary>} />
        <Route path="/organisation/processes" element={<ErrorBoundary><BusinessProcessesPage /></ErrorBoundary>} />
        <Route path="/organisation/dependencies" element={<ErrorBoundary><ExternalDependenciesPage /></ErrorBoundary>} />
        <Route path="/organisation/security-committees" element={<ErrorBoundary><SecurityCommitteesPage /></ErrorBoundary>} />
        <Route path="/organisation/meeting-action-items" element={<ErrorBoundary><MeetingActionItemsPage /></ErrorBoundary>} />
        <Route path="/organisation/meeting-action-items/:actionId" element={<ErrorBoundary><MeetingActionItemDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/regulators" element={<ErrorBoundary><RegulatorsPage /></ErrorBoundary>} />
        <Route path="/organisation/executive-positions" element={<ErrorBoundary><ExecutivePositionsPage /></ErrorBoundary>} />
        <Route path="/organisation/security-champions" element={<ErrorBoundary><SecurityChampionsPage /></ErrorBoundary>} />
        <Route path="/organisation/committee-meetings" element={<ErrorBoundary><CommitteeMeetingsPage /></ErrorBoundary>} />
        <Route path="/organisation/meeting-decisions" element={<ErrorBoundary><MeetingDecisionsPage /></ErrorBoundary>} />
        <Route path="/organisation/regulatory-eligibility" element={<ErrorBoundary><RegulatoryEligibilityPage /></ErrorBoundary>} />
        <Route path="/organisation/regulatory-eligibility/:surveyId" element={<ErrorBoundary><RegulatoryEligibilitySurveyPage /></ErrorBoundary>} />
        <Route path="/organisation/profiles" element={<ErrorBoundary><OrganisationProfilesPage /></ErrorBoundary>} />
        <Route path="/organisation/processes/:processId" element={<ErrorBoundary><BusinessProcessDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/security-committees/:committeeId" element={<ErrorBoundary><SecurityCommitteeDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/departments/:departmentId" element={<ErrorBoundary><DepartmentDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/profiles/:profileId" element={<ErrorBoundary><OrganisationProfileDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/products-services" element={<ErrorBoundary><ProductsServicesPage /></ErrorBoundary>} />
        <Route path="/organisation/technology-platforms" element={<ErrorBoundary><TechnologyPlatformsPage /></ErrorBoundary>} />
        <Route path="/organisation/interested-parties" element={<ErrorBoundary><InterestedPartiesPage /></ErrorBoundary>} />
        <Route path="/organisation/context-issues" element={<ErrorBoundary><ContextIssuesPage /></ErrorBoundary>} />
        <Route path="/organisation/locations/:locationId" element={<ErrorBoundary><LocationDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/dependencies/:dependencyId" element={<ErrorBoundary><ExternalDependencyDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/regulators/:regulatorId" element={<ErrorBoundary><RegulatorDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/executive-positions/:positionId" element={<ErrorBoundary><ExecutivePositionDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/security-champions/:championId" element={<ErrorBoundary><SecurityChampionDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/products-services/:productId" element={<ErrorBoundary><ProductServiceDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/technology-platforms/:platformId" element={<ErrorBoundary><TechnologyPlatformDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/interested-parties/:partyId" element={<ErrorBoundary><InterestedPartyDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/context-issues/:issueId" element={<ErrorBoundary><ContextIssueDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/key-personnel" element={<ErrorBoundary><KeyPersonnelPage /></ErrorBoundary>} />
        <Route path="/organisation/key-personnel/:personnelId" element={<ErrorBoundary><KeyPersonnelDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/applicable-frameworks" element={<ErrorBoundary><ApplicableFrameworksPage /></ErrorBoundary>} />
        <Route path="/organisation/applicable-frameworks/:frameworkId" element={<ErrorBoundary><ApplicableFrameworkDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/committee-meetings/:meetingId" element={<ErrorBoundary><CommitteeMeetingDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/meeting-decisions/:decisionId" element={<ErrorBoundary><MeetingDecisionDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/organisational-units" element={<ErrorBoundary><OrganisationalUnitsPage /></ErrorBoundary>} />
        <Route path="/organisation/organisational-units/:unitId" element={<ErrorBoundary><OrganisationalUnitDetailPage /></ErrorBoundary>} />
        <Route path="/organisation/meeting-attendances" element={<ErrorBoundary><MeetingAttendancesPage /></ErrorBoundary>} />
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
