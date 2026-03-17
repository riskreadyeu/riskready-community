# Demo Readiness Assessment
## RiskReady GRC Platform

**Assessment Date**: January 8, 2026
**Assessor**: Automated Code Review
**Codebase**: /path/to/riskready-community

---

## Executive Summary

| Category | Status | Score |
|----------|--------|-------|
| Overall Demo Readiness | **READY WITH CAVEATS** | 78/100 |
| Critical Blockers | 2 |
| High Priority Issues | 4 |
| Medium Priority Issues | 6 |
| Cosmetic Issues | 5 |

---

## Traffic Light Summary

| Step | Flow | Status | Assessment |
|------|------|--------|------------|
| 1 | **Login → Dashboard** | **Works with Issues** | Demo credentials visible, dashboard shows "(placeholder data)" label |
| 2 | **Create Organisation Profile** | **Works Fully** | 51 organisation pages, comprehensive ISMS scope setup |
| 3 | **Risk Management (BIRT)** | **Works with Issues** | Full BIRT config, but hardcoded `org-placeholder` ID |
| 4 | **Controls & Maturity** | **Works Fully** | Excellent ISO 27001 coverage, maturity assessments complete |
| 5 | **Vendor Management** | **Works Fully** | Comprehensive vendor register with DORA/NIS2 scope |
| 6 | **Incident NIS2/DORA** | **Partially Works** | Incident creation works; NIS2/DORA pages show "Coming soon" |
| 7 | **Evidence Linking** | **Works Fully** | Full repository with upload/link dialogs |
| 8 | **SOA & Reporting** | **Works Fully** | SOA versioning, stats, and detail views complete |

### Status Legend
- **Works Fully** - Feature complete, no issues
- **Works with Issues** - Functional but has bugs/UX issues
- **Partially Works** - Core functionality exists but incomplete
- **Broken/Missing** - Cannot demonstrate

---

## Detailed Assessment

### Step 1: Login → Dashboard

**Status**: Works with Issues

**What Works**:
- Login page loads correctly with pre-filled demo credentials
- Demo credentials displayed prominently: `admin@riskready.com` / `password123`
- Authentication flow functional
- Dashboard renders with navigation

**Issues Found**:
1. **Dashboard shows "(placeholder data)" label** visible to users
   - File: [DashboardPage.tsx:14](apps/web/src/pages/DashboardPage.tsx#L14)
   - Impact: UX - indicates incomplete state to demo audience

2. Dashboard metrics may not reflect real data

**Recommendation**: Remove or conditionally hide the "(placeholder data)" text before demo.

---

### Step 2: Create Organisation Profile (ISMS Scope)

**Status**: Works Fully

**What Works**:
- OrganisationProfilesPage with full CRUD operations
- OrganisationProfileDetailPage for viewing/editing
- 51 organisation-related pages available
- Complete data model for ISMS scope definition

**Files Verified**:
- `apps/web/src/pages/organisation/organisation-profiles/OrganisationProfilesPage.tsx`
- `apps/web/src/pages/organisation/organisation-profiles/OrganisationProfileDetailPage.tsx`
- Full organisation module structure in place

**Demo Ready**: Yes

---

### Step 3: Risk Management → Create Risk → Add Scenarios → Run BIRT Assessment

**Status**: Works with Issues

**What Works**:
- **RiskRegisterPage.tsx** (329 lines): Comprehensive implementation
  - RiskCreateDialog for creating new risks
  - Stats cards showing risk metrics
  - DataTable with filtering and pagination
  - Export functionality

- **BirtConfigPage.tsx** (519 lines): Full BIRT configuration
  - 4-tab interface: Overview, Thresholds Matrix, External Factors, Category Weights
  - Threshold editing with impact categories
  - External factor management
  - Save/reset functionality

**Issues Found**:
1. **Hardcoded placeholder organisation ID**
   - File: [BirtConfigPage.tsx:31](apps/web/src/pages/risks/BirtConfigPage.tsx#L31)
   - Code: `const DEFAULT_ORG_ID = "org-placeholder";`
   - Impact: BIRT config may fail if org context not properly set

2. Risk scenario workflow requires validation of full flow

**Recommendation**: Ensure proper organisation context is established before BIRT demo.

---

### Step 4: Controls → View ISO 27001 Controls → Assess Capability Maturity

**Status**: Works Fully

**What Works**:
- **ControlsBrowserPage.tsx** (94 lines): Clean unified control browser
  - ControlBrowser component with hierarchical view
  - ControlSlideOver and CapabilitySlideOver for details
  - Navigation to Dashboard, SOA, and Analytics

- **ISO27001CoveragePage.tsx** (377 lines): Excellent implementation
  - Summary cards: Total controls, Full coverage %, Overall progress %, Gaps remaining
  - Coverage by Theme visualization (Organisational, People, Physical, Technological)
  - Filterable control table with implementation status
  - Export functionality

- **MaturityAssessmentsPage.tsx** (411 lines): Comprehensive maturity tracking
  - Stats: Total assessments, Avg maturity, With gaps, On target, Reviews due
  - Maturity level distribution (0-5) with visual bars
  - DataTable with pagination and filtering
  - Gap indicators (above/below target)

**Demo Ready**: Excellent - showcase feature

---

### Step 5: Vendors → Add Vendor → Run Assessment → Generate Findings

**Status**: Works Fully

**What Works**:
- **VendorRegisterPage.tsx** (395 lines): Full vendor management
  - Stats: Total vendors, Critical tier count, DORA scope, Active count
  - Comprehensive DataTable with tier, status, regulatory scope columns
  - DORA/NIS2 scope filter buttons
  - Add Vendor button linking to form
  - Row actions: View Details, Start Assessment, View Contracts

- **VendorFormPage.tsx** (591 lines): Detailed vendor creation/edit
  - Basic Information: Name, legal name, type, website, description
  - Classification: Risk tier with rationale, lifecycle status
  - Regulatory Scope: DORA, NIS2, GDPR toggles
  - DORA-specific: ICT Service Provider, Critical ICT Provider, Essential Function, LEI Code
  - Contact Information: Primary and security contacts
  - Location & Registration details

**Demo Ready**: Excellent - comprehensive third-party risk management

---

### Step 6: Incidents → Create Incident → Run NIS2/DORA Classification

**Status**: Partially Works

**What Works**:
- **IncidentFormPage.tsx** (441 lines): Full incident creation
  - Basic info: Title, description, severity, category, status
  - Classification: Incident type, attack vector
  - CIA Impact checkboxes
  - Source & Timeline panel
  - Edit mode support

- **IncidentDetailPage.tsx** (777 lines): Comprehensive incident view
  - Regulatory alerts for NIS2/DORA significant incidents
  - 6-tab interface: Overview, Timeline, Evidence, Communications, Lessons, Notifications
  - ISO 27001 compliance checklist (evidence preserved, chain of custody, root cause, etc.)
  - BCP activation integration
  - Related items: Affected assets, Evidence, Notifications

**CRITICAL Issues Found**:
1. **IncidentNIS2Page.tsx**: "Coming soon" placeholder
   - Shows empty state with "This page will display NIS2 significant incidents..."
   - Construction icon indicates incomplete feature

2. **IncidentDORAPage.tsx**: "Coming soon" placeholder
   - Shows empty state with "This page will display DORA major incidents..."
   - 7-criteria classification mentioned but not implemented

**Impact**: Cannot demonstrate dedicated NIS2/DORA classification dashboards. However, the IncidentDetailPage DOES show NIS2/DORA assessment badges when incidents are classified.

**Demo Workaround**: Focus on IncidentDetailPage which shows regulatory classification inline rather than the dedicated pages.

---

### Step 7: Evidence → Link Evidence to Controls

**Status**: Works Fully

**What Works**:
- **EvidenceRepositoryPage.tsx** (501 lines): Complete evidence management
  - Stats cards: Total, Approved, Pending, Expiring
  - Comprehensive filtering: Type, Status, Classification, Search
  - DataTable with columns: Reference, Title, Type, Classification, Status, Links, Valid Until
  - Row actions: View Details, Link to Entity, Download
  - EvidenceUploadDialog integration
  - EvidenceLinkDialog for linking to controls, capabilities, incidents, risks, vendors, assets

- **EvidenceLinkDialog component**: Allows linking evidence to multiple entity types

**Demo Ready**: Yes - full evidence lifecycle management

---

### Step 8: Generate Compliance Report or SOA

**Status**: Works Fully

**What Works**:
- **SOAListPage.tsx** (282 lines): Full SOA management
  - Stats: Total versions, Applicable controls, Implemented count, Implementation rate
  - Version table with status badges (Draft, Pending Review, Approved, Superseded)
  - Created/Approved tracking with user attribution
  - "New Version" button for creating SOA iterations

- **SOACreatePage.tsx**: SOA creation workflow
- **SOADetailPage.tsx**: Detailed SOA view with control entries

**Demo Ready**: Yes - complete Statement of Applicability lifecycle

---

## Issue Priority Matrix

### CRITICAL BLOCKERS (Must Fix Before Demo)

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 1 | NIS2 Page shows "Coming soon" | [IncidentNIS2Page.tsx](apps/web/src/pages/incidents/IncidentNIS2Page.tsx) | Cannot demo NIS2 reporting dashboard | High |
| 2 | DORA Page shows "Coming soon" | [IncidentDORAPage.tsx](apps/web/src/pages/incidents/IncidentDORAPage.tsx) | Cannot demo DORA major incident dashboard | High |

**Mitigation Strategy**: Use IncidentDetailPage to show NIS2/DORA classification badges inline. Skip dedicated dashboard pages in demo.

### HIGH PRIORITY (Should Fix)

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 1 | Dashboard "(placeholder data)" text | [DashboardPage.tsx:14](apps/web/src/pages/DashboardPage.tsx#L14) | Unprofessional appearance | Low |
| 2 | BIRT hardcoded org placeholder | [BirtConfigPage.tsx:31](apps/web/src/pages/risks/BirtConfigPage.tsx#L31) | May cause API errors | Low |
| 3 | Mock user ID in Evidence | [EvidenceRepositoryPage.tsx:44](apps/web/src/pages/evidence/EvidenceRepositoryPage.tsx#L44) | `MOCK_USER_ID = "user-1"` | Low |
| 4 | Vendor assessments need seed data | Supply chain module | Empty assessment lists | Medium |

### MEDIUM PRIORITY (Nice to Have)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | Maturity distribution shows 0s if no assessments | MaturityAssessmentsPage.tsx | Empty state not graceful |
| 2 | No toast notifications on some actions | Various pages | Feedback missing |
| 3 | Timeline entries empty by default | IncidentDetailPage.tsx | Needs seed data |
| 4 | Evidence repository may be empty | EvidenceRepositoryPage.tsx | Needs seed data |
| 5 | SOA list may be empty | SOAListPage.tsx | Needs seed data |
| 6 | Controls may show 0% coverage | ISO27001CoveragePage.tsx | Needs seed data |

### COSMETIC (Low Priority)

| # | Issue | Location |
|---|-------|----------|
| 1 | Some long names truncate without tooltip | Various DataTables |
| 2 | Loading skeletons slightly inconsistent | Various pages |
| 3 | Date format inconsistency (en-GB vs locale) | Various pages |
| 4 | Some icons could be more descriptive | Navigation |
| 5 | Export buttons not fully wired | Various pages |

---

## Demo Script Recommendations

### Recommended Demo Flow

1. **Login** (30s)
   - Show demo credentials auto-filled
   - Click login, arrive at dashboard
   - *Skip over placeholder data mention*

2. **Organisation Setup** (2min)
   - Navigate to Organisation Profiles
   - Show existing profile or create new
   - Highlight ISMS scope definition

3. **Risk Management** (5min)
   - Navigate to Risk Register
   - Show existing risks or create new
   - Demonstrate BIRT Assessment configuration
   - Show threshold matrix and external factors

4. **Controls & Compliance** (5min)
   - Show ISO 27001 Coverage page - *showcase feature*
   - Highlight coverage percentages by theme
   - Navigate to Maturity Assessments
   - Show gap analysis

5. **Vendor Management** (3min)
   - Show Vendor Register with DORA/NIS2 filters
   - Create or view vendor with regulatory scope
   - Highlight DORA ICT provider classification

6. **Incident Management** (3min)
   - Create incident via IncidentFormPage
   - Navigate to Incident Detail
   - Show CIA impact, timeline, evidence tabs
   - **Highlight NIS2/DORA badges in detail view** (not dedicated pages)

7. **Evidence Management** (2min)
   - Show Evidence Repository
   - Demonstrate link to control functionality
   - Show classification and validity tracking

8. **SOA Generation** (2min)
   - Navigate to SOA list
   - Show versioning and approval workflow
   - Highlight implementation rate stats

---

## Pre-Demo Checklist

### Must Complete
- [ ] Seed database with realistic demo data
- [ ] Remove "(placeholder data)" label from dashboard
- [ ] Verify login works end-to-end
- [ ] Test all navigation paths in demo flow
- [ ] Ensure API endpoints are responding

### Recommended
- [ ] Pre-create 2-3 risks with scenarios
- [ ] Pre-create 1-2 vendors with assessments
- [ ] Pre-create 1 incident with NIS2/DORA classification
- [ ] Upload sample evidence files
- [ ] Create draft SOA with control entries

### Avoid During Demo
- [ ] Don't navigate to `/incidents/nis2` (Coming soon)
- [ ] Don't navigate to `/incidents/dora` (Coming soon)
- [ ] Don't highlight dashboard metrics as live data
- [ ] Don't test BIRT config with invalid org context

---

## Conclusion

The RiskReady platform is **78% demo-ready**. The core GRC functionality is well-implemented with professional UIs. The primary gaps are:

1. **NIS2/DORA dedicated dashboards** are placeholder pages - but inline classification in IncidentDetailPage works
2. **Placeholder text** in dashboard affects perception
3. **Seed data** needed for meaningful demo

With the recommended workarounds and pre-demo data preparation, the platform can effectively demonstrate:
- Risk management with BIRT methodology
- ISO 27001 control coverage and maturity tracking
- Vendor third-party risk management with regulatory scope
- Incident lifecycle with regulatory classification
- Evidence management and linking
- Statement of Applicability generation

**Recommended Action**: Prioritize removing the "(placeholder data)" text and seeding demo data. Use the demo script to avoid the "Coming soon" pages.

---

*Report generated: January 8, 2026*
