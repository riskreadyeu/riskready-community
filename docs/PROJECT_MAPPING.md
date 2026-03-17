# RiskReady Local - Complete Project Mapping

**Generated:** 2025-01-27  
**Project:** RiskReady Enterprise GRC Platform  
**Version:** 0.1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Modules](#backend-modules)
4. [Frontend Structure](#frontend-structure)
5. [Database Schema](#database-schema)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [File Structure](#file-structure)

---

## Project Overview

RiskReady is a comprehensive **Governance, Risk, and Compliance (GRC) platform** designed for enterprise security management. The system provides capabilities for:

- **Risk Management**: Enterprise risk assessment, scenario analysis, KRIs, treatment plans
- **Control Management**: ISO 27001:2022 controls, four-layer framework testing, SOA
- **Policy Management**: Document lifecycle, approval workflows, attestation
- **Audit Management**: Nonconformity tracking, corrective actions
- **Incident Management**: NIS2/DORA compliant incident response
- **Vulnerability Management**: SLA tracking, remediation workflows
- **Supply Chain Risk**: Third-party risk assessments, vendor management
- **Business Continuity**: BIA assessments, continuity planning, testing
- **ITSM Integration**: CMDB, change management, capacity planning
- **Evidence Management**: Centralized evidence repository
- **Organisation Management**: Context of the organisation, regulatory scope

### Technology Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Frontend**: React 18 + Vite + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with cookie-based refresh tokens
- **UI Framework**: Radix UI + Tailwind CSS
- **Deployment**: Docker Compose

---

## Architecture

### Monorepo Structure

```
riskready-community/
├── apps/
│   ├── server/          # NestJS Backend API
│   └── web/              # React Frontend
├── docs/                 # Comprehensive documentation
├── infra/                # Infrastructure (Caddy reverse proxy)
├── scripts/              # Utility scripts
└── docker-compose.yml    # Container orchestration
```

### Backend Architecture

**Framework**: NestJS with modular architecture

**Core Infrastructure:**
- `PrismaModule` - Global database service (PostgreSQL)
- `EventEmitterModule` - Global event bus for cross-module communication
- `AuthModule` - JWT authentication with refresh tokens
- `HealthModule` - Health check endpoints
- `DashboardModule` - Aggregated dashboard data

**Shared Utilities:**
- `SanitizePipe` - XSS protection for request bodies
- `GlobalExceptionFilter` - Consistent error responses
- `ValidationPipe` - Request validation with class-validator

**Security:**
- Helmet for security headers
- CORS with origin whitelist
- Rate limiting (100 requests/minute)
- XSS sanitization
- Cookie-based authentication

### Frontend Architecture

**Framework**: React 18 with React Router v6

**Key Patterns:**
- **Archer Pattern**: Reusable detail/list page layouts
- **Component Library**: Radix UI primitives + custom components
- **State Management**: React hooks + Context API
- **Routing**: React Router with nested routes
- **Styling**: Tailwind CSS with design system tokens

**Module Structure:**
- Each module has its own sidebar component
- Shared components in `/components/common`
- Module-specific components in `/components/{module}`
- Pages in `/pages/{module}`

---

## Backend Modules

### 1. Auth Module (`apps/server/src/auth/`)

**Purpose**: Authentication and authorization

**Files:**
- `auth.module.ts` - Module definition
- `auth.controller.ts` - Login/logout endpoints
- `auth.service.ts` - Authentication logic
- `jwt.strategy.ts` - Passport JWT strategy
- `jwt-auth.guard.ts` - Route protection guard

**Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

**Schema**: `auth.prisma` - User, RefreshSession, AuditEvent models

---

### 2. Risks Module (`apps/server/src/risks/`)

**Purpose**: Enterprise risk management with lifecycle automation

**Controllers:**
- `risk.controller.ts` - Risk CRUD operations
- `risk-scenario.controller.ts` - Scenario management
- `kri.controller.ts` - Key Risk Indicators
- `rts.controller.ts` - Risk Tolerance Statements
- `treatment-plan.controller.ts` - Treatment plans
- `birt.controller.ts` - Business Impact Reference Table
- `risk-lifecycle.controller.ts` - Calculation, tolerance, versioning
- `governance.controller.ts` - RACI, escalation, triggers
- `threat-catalog.controller.ts` - Threat library
- `risk-state-machine.controller.ts` - State transitions
- `risk-scheduler.controller.ts` - Scheduled jobs
- `risk-notification.controller.ts` - User notifications
- `risk-aggregation.controller.ts` - Parent risk aggregation
- `risk-appetite.controller.ts` - Appetite configuration
- `loss-magnitude.controller.ts` - Loss magnitude catalogue

**Services:**
- `risk.service.ts` - Core risk operations
- `risk-scenario.service.ts` - Scenario management
- `kri.service.ts` - KRI operations
- `kri-alert.service.ts` - KRI alerting
- `rts.service.ts` - Tolerance statements
- `treatment-plan.service.ts` - Treatment management
- `birt.service.ts` - BIRT calculations
- `risk-calculation.service.ts` - Factor-based scoring (F1-F6, I1-I5)
- `tolerance-engine.service.ts` - Tolerance evaluation
- `assessment-versioning.service.ts` - Assessment snapshots
- `review-scheduler.service.ts` - Review scheduling
- `risk-event-bus.service.ts` - Event-driven architecture
- `scenario-entity-resolver.service.ts` - Entity linking (assets, vendors, apps)
- `governance.service.ts` - RACI and authorization
- `threat-catalog.service.ts` - Threat management
- `risk-state-machine.service.ts` - State transitions (10 states)
- `risk-authorization.service.ts` - Permission checks
- `risk-scheduler.service.ts` - Automated jobs
- `risk-notification.service.ts` - Notification delivery
- `risk-aggregation.service.ts` - Parent risk status derivation
- `risk-appetite.service.ts` - Appetite cascade system
- `loss-magnitude.service.ts` - Loss magnitude calculations
- `monte-carlo.service.ts` - FAIR quantitative analysis
- `control-risk-integration.service.ts` - Control effectiveness → risk scoring
- `likelihood-factor.service.ts` - F1-F6 factor calculations
- `acceptance-expiry.service.ts` - Acceptance expiry monitoring
- `risk-audit.service.ts` - Audit trail
- `risk-export.service.ts` - Export functionality

**DTOs:**
- `risk.dto.ts` - Risk data transfer objects
- `loss-magnitude.dto.ts` - Loss magnitude DTOs
- `monte-carlo.dto.ts` - FAIR simulation DTOs

**Utils:**
- `likelihood-factors.ts` - Factor calculation utilities
- `risk-scoring.ts` - Scoring algorithms
- `fair-distributions.ts` - FAIR PERT distributions

**Schema**: `risks.prisma`, `risk-governance.prisma`, `loss-magnitude.prisma`

**Key Features:**
- 10-state scenario lifecycle (DRAFT → ASSESSED → EVALUATED → TREATING → TREATED → ACCEPTED → MONITORING → ESCALATED → REVIEW → CLOSED)
- Factor-based likelihood calculation (F1-F6)
- Multi-category impact assessment (I1-I5)
- BIRT weighted impact scoring
- FAIR quantitative mode with Monte Carlo simulation
- Automated tolerance evaluation
- Risk appetite cascade system
- Governance roles (RA, RO, TO, CISO, RC, BOD)
- Automated notifications
- Scheduled reviews and expiry checks

---

### 3. Controls Module (`apps/server/src/controls/`)

**Purpose**: ISO 27001:2022 control management with four-layer framework

**Controllers:**
- `control.controller.ts` - Control CRUD
- `soa.controller.ts` - Statement of Applicability
- `cross-reference.controller.ts` - Framework mappings
- `control-layer.controller.ts` - Four-layer framework
- `layer-test.controller.ts` - Layer test management
- `test-execution.controller.ts` - Test execution
- `protection-score.controller.ts` - Protection score calculation
- `test-generation.controller.ts` - Test template generation
- `audit-pack.controller.ts` - Audit pack generation

**Services:**
- `control.service.ts` - Core control operations
- `soa.service.ts` - SOA management
- `soa-entry.service.ts` - SOA entry operations
- `cross-reference.service.ts` - Framework cross-referencing
- `control-layer.service.ts` - Layer management
- `layer-test.service.ts` - Test definition
- `test-execution.service.ts` - Test execution tracking
- `protection-score.service.ts` - Score calculation
- `test-generation.service.ts` - Template-based test generation
- `test-scheduler.service.ts` - Test scheduling
- `audit-pack.service.ts` - Audit pack compilation
- `control-reporting.service.ts` - Reporting and analytics
- `gap-analysis.service.ts` - Gap identification

**DTOs:**
- `control.dto.ts` - Control DTOs
- `soa.dto.ts` - SOA DTOs
- `control-layer.dto.ts` - Layer DTOs
- `test-execution.dto.ts` - Test execution DTOs
- `protection-score.dto.ts` - Protection score DTOs

**Types:**
- `threshold.types.ts` - Threshold parsing types

**Utils:**
- `threshold-parser.ts` - Threshold string parsing

**Schema**: `controls.prisma`

**Key Features:**
- Four-Layer Framework: GOVERNANCE, PLATFORM, CONSUMPTION, OVERSIGHT
- Layer-based testing with templates
- Protection score calculation (0-100)
- SOA versioning and approval workflow
- Framework cross-referencing (ISO, SOC2, NIS2, DORA)
- Gap analysis and maturity assessment
- Test scheduling and automation
- Audit pack generation

---

### 4. Policies Module (`apps/server/src/policies/`)

**Purpose**: Policy document lifecycle management

**Controllers:**
- `policy-document.controller.ts` - Document CRUD
- `document-version.controller.ts` - Version management
- `document-review.controller.ts` - Review workflow
- `approval-workflow.controller.ts` - Approval workflows
- `change-request.controller.ts` - Change requests
- `document-exception.controller.ts` - Policy exceptions
- `acknowledgment.controller.ts` - User acknowledgments
- `document-mapping.controller.ts` - Control/risk mappings
- `policy-dashboard.controller.ts` - Dashboard data
- `document-section.controller.ts` - Structured sections
- `document-attachment.controller.ts` - File attachments
- `policy-evidence.controller.ts` - Evidence collection

**Services:**
- `policy-document.service.ts` - Core document operations
- `document-version.service.ts` - Version control
- `document-review.service.ts` - Review scheduling
- `approval-workflow.service.ts` - Multi-step approvals
- `change-request.service.ts` - Change management
- `document-exception.service.ts` - Exception tracking
- `acknowledgment.service.ts` - Acknowledgment tracking
- `document-mapping.service.ts` - Control/risk mappings
- `policy-audit.service.ts` - Audit trail
- `policy-dashboard.service.ts` - Dashboard aggregation
- `document-section.service.ts` - Section management
- `document-attachment.service.ts` - File management
- `policy-scheduler.service.ts` - Review scheduling
- `policy-evidence-collector.service.ts` - Evidence automation

**DTOs:**
- `policy.dto.ts` - Policy DTOs

**Schema**: `policies.prisma`

**Key Features:**
- Document hierarchy (Policy → Standard → Procedure → Work Instruction)
- Version control with diff tracking
- Multi-step approval workflows
- Review scheduling and reminders
- User acknowledgment tracking
- Control and risk mappings
- Structured document sections
- Exception management
- Change request workflow
- Evidence collection automation

---

### 5. Organisation Module (`apps/server/src/organisation/`)

**Purpose**: Organisation context and structure

**Controllers:**
- `organisation-profile.controller.ts` - Organisation profile
- `department.controller.ts` - Departments
- `organisational-unit.controller.ts` - Organisational units
- `location.controller.ts` - Locations
- `executive-position.controller.ts` - Executive positions
- `security-champion.controller.ts` - Security champions
- `business-process.controller.ts` - Business processes
- `external-dependency.controller.ts` - External dependencies
- `regulator.controller.ts` - Regulators
- `security-committee.controller.ts` - Security committees
- `committee-meeting.controller.ts` - Committee meetings
- `meeting-attendance.controller.ts` - Meeting attendance
- `meeting-decision.controller.ts` - Meeting decisions
- `meeting-action-item.controller.ts` - Action items
- `regulatory-eligibility.controller.ts` - Regulatory surveys
- `organisation-dashboard.controller.ts` - Dashboard
- `product-service.controller.ts` - Products/services
- `technology-platform.controller.ts` - Technology platforms
- `interested-party.controller.ts` - Interested parties
- `context-issue.controller.ts` - Context issues
- `key-personnel.controller.ts` - Key personnel
- `applicable-framework.controller.ts` - Regulatory frameworks
- `calibration.controller.ts` - GRC calibration

**Services:**
- `organisation-profile.service.ts` - Profile management
- `department.service.ts` - Department operations
- `organisational-unit.service.ts` - Unit management
- `location.service.ts` - Location management
- `executive-position.service.ts` - Executive management
- `security-champion.service.ts` - Champion management
- `business-process.service.ts` - Process management
- `external-dependency.service.ts` - Dependency tracking
- `regulator.service.ts` - Regulator management
- `security-committee.service.ts` - Committee management
- `committee-membership.service.ts` - Membership management
- `committee-meeting.service.ts` - Meeting management
- `meeting-attendance.service.ts` - Attendance tracking
- `meeting-decision.service.ts` - Decision tracking
- `meeting-action-item.service.ts` - Action item management
- `regulatory-eligibility.service.ts` - Eligibility surveys
- `regulatory-scope-propagation.service.ts` - Scope propagation
- `organisation-dashboard.service.ts` - Dashboard aggregation
- `product-service.service.ts` - Product/service management
- `technology-platform.service.ts` - Platform management
- `interested-party.service.ts` - Stakeholder management
- `context-issue.service.ts` - Issue tracking
- `key-personnel.service.ts` - Personnel management
- `applicable-framework.service.ts` - Framework management
- `org-risk-calibration.service.ts` - Risk calibration

**Schema**: `organisation.prisma`

**Key Features:**
- Organisation profile with GRC calibration
- Department hierarchy
- Business process management with BIA status
- Security committee governance
- Regulatory eligibility surveys (DORA, NIS2)
- Regulatory scope propagation
- Context of organisation (ISO 27001 Clause 4.1, 4.2)
- Interested parties management
- Key personnel and ISMS roles

---

### 6. Applications Module (`apps/server/src/applications/`)

**Purpose**: Application inventory and ISRA (Information Security Risk Assessment)

**Controllers:**
- `application.controller.ts` - Application CRUD
- `application-isra.controller.ts` - ISRA management
- `application-bia.controller.ts` - BIA questionnaire
- `application-tva.controller.ts` - Threat/Vulnerability Assessment
- `application-srl.controller.ts` - Security Requirements List

**Services:**
- `application.service.ts` - Application management
- `application-isra.service.ts` - ISRA workflow
- `application-bia.service.ts` - BIA calculations
- `application-tva.service.ts` - TVA scoring
- `application-srl.service.ts` - SRL generation and gap analysis
- `srl-gap-nc.service.ts` - Automated NC creation from gaps

**Schema**: `applications.prisma`

**Key Features:**
- 43-field application inventory
- BIA questionnaire (5 sections, 45 questions)
- TVA with threat catalog integration
- SRL generation based on risk level
- Automated nonconformity creation from gaps
- GDPR, DORA, NIS2, EU AI Act compliance

---

### 7. Audits Module (`apps/server/src/audits/`)

**Purpose**: Nonconformity and corrective action management

**Controllers:**
- `nonconformity.controller.ts` - NC management

**Services:**
- `nonconformity.service.ts` - NC operations and CAP workflow

**Schema**: `audits.prisma`

**Key Features:**
- Nonconformity tracking (MAJOR, MINOR, OBSERVATION)
- Corrective Action Plan (CAP) workflow
- CAP approval workflow (DRAFT → PENDING_APPROVAL → APPROVED)
- Verification tracking
- Linkage to controls, risks, applications, incidents

---

### 8. ITSM Module (`apps/server/src/itsm/`)

**Purpose**: Configuration Management Database (CMDB) and Change Management

**Controllers:**
- `asset.controller.ts` - Asset management
- `asset-relationship.controller.ts` - Asset relationships
- `asset-risk.controller.ts` - Asset risk scoring
- `change.controller.ts` - Change management
- `change-approval.controller.ts` - Change approvals
- `change-template.controller.ts` - Change templates
- `capacity.controller.ts` - Capacity management
- `itsm-dashboard.controller.ts` - Dashboard

**Services:**
- `asset.service.ts` - Asset operations
- `asset-relationship.service.ts` - Relationship management
- `asset-risk.service.ts` - Risk scoring
- `asset-risk-calculation.service.ts` - Risk calculation
- `change.service.ts` - Change workflow
- `change-approval.service.ts` - Approval management
- `change-template.service.ts` - Template management
- `capacity.service.ts` - Capacity planning

**DTOs:**
- `asset.dto.ts` - Asset DTOs

**Schema**: `itsm.prisma`

**Key Features:**
- Comprehensive CMDB with asset types (hardware, software, cloud, services)
- Asset relationships (DEPENDS_ON, RUNS_ON, HOSTED_ON, etc.)
- Wazuh integration for security data
- Change management workflow
- CAB (Change Advisory Board) approvals
- Capacity management and planning
- Asset risk scoring

---

### 9. Supply Chain Module (`apps/server/src/supply-chain/`)

**Purpose**: Third-Party Risk Assessment (TPRA) and vendor management

**Controllers:**
- `vendor.controller.ts` - Vendor management
- `assessment-question.controller.ts` - Question bank
- `vendor-assessment.controller.ts` - Assessment workflow
- `vendor-contract.controller.ts` - Contract management
- `vendor-review.controller.ts` - Periodic reviews
- `supply-chain-dashboard.controller.ts` - Dashboard

**Services:**
- `vendor.service.ts` - Vendor operations
- `assessment-question.service.ts` - Question management
- `vendor-assessment.service.ts` - Assessment workflow
- `vendor-contract.service.ts` - Contract management
- `vendor-review.service.ts` - Review management

**Schema**: `supply-chain.prisma`

**Key Features:**
- Vendor tier classification (CRITICAL, HIGH, MEDIUM, LOW)
- Multi-framework assessments (ISO, NIS2, DORA)
- DORA Article 28/30 compliance tracking
- Contract management with DORA checklist
- Periodic review scheduling
- Exit plan management
- SLA tracking
- Concentration risk analysis

---

### 10. Evidence Module (`apps/server/src/evidence/`)

**Purpose**: Centralized evidence repository

**Controllers:**
- `evidence.controller.ts` - Evidence CRUD
- `evidence-request.controller.ts` - Evidence requests
- `evidence-link.controller.ts` - Cross-module linking
- `evidence-migration.controller.ts` - Migration utilities

**Services:**
- `evidence.service.ts` - Evidence operations
- `evidence-request.service.ts` - Request workflow
- `evidence-link.service.ts` - Link management
- `evidence-migration.service.ts` - Migration tools

**Schema**: `evidence.prisma`

**Key Features:**
- Single source of truth for all evidence
- Links to controls, risks, policies, incidents, vendors, assets, etc.
- Evidence requests with assignment
- Validity tracking and expiry reminders
- Review and approval workflow
- Chain of custody tracking
- Version management

---

### 11. BCM Module (`apps/server/src/bcm/`)

**Purpose**: Business Continuity Management

**Controllers:**
- `bcm-program.controller.ts` - BCM program management
- `continuity-plan.controller.ts` - Continuity plans
- `bcm-test.controller.ts` - Test exercises
- `bia-assessment.controller.ts` - BIA assessments
- `plan-activation.controller.ts` - Plan activations
- `bcm-dashboard.controller.ts` - Dashboard

**Services:**
- `bcm-program.service.ts` - Program management
- `continuity-plan.service.ts` - Plan management
- `bcm-test.service.ts` - Test management
- `bia-assessment.service.ts` - BIA workflow
- `plan-activation.service.ts` - Activation tracking

**Schema**: `bcm.prisma`

**Key Features:**
- BCM program governance
- Continuity plan management
- BIA assessment workflow (gates BCP eligibility)
- Test exercise management (tabletop, walkthrough, simulation)
- Plan activation tracking
- Recovery metrics (RTO, RPO, MTD)
- Test findings → Nonconformity linkage

---

### 12. Vulnerabilities Module (`apps/server/src/vulnerabilities/`)

**Purpose**: Vulnerability management with SLA tracking

**Controllers:**
- `vulnerability.controller.ts` - Vulnerability CRUD
- `vulnerability-asset.controller.ts` - Asset-vulnerability links
- `vulnerability-remediation.controller.ts` - Remediation actions
- `vulnerability-scan.controller.ts` - Scan management
- `vulnerability-dashboard.controller.ts` - Dashboard
- `vulnerability-import.controller.ts` - Import from scanners
- `scanner-connector.controller.ts` - Scanner integrations

**Services:**
- `vulnerability.service.ts` - Vulnerability operations
- `vulnerability-sla.service.ts` - SLA tracking and breach detection
- `vulnerability-import.service.ts` - Scanner import
- `scanner-connector.service.ts` - Connector management
- `wazuh.service.ts` - Wazuh integration

**DTOs:**
- `vulnerability.dto.ts` - Vulnerability DTOs
- `scanner-connector.dto.ts` - Connector DTOs

**Schema**: `vulnerabilities.prisma`

**Key Features:**
- CVSS and EPSS scoring
- SLA tracking per severity (CRITICAL: 24h, HIGH: 7d, MEDIUM: 30d, LOW: 90d)
- SLA breach detection and alerting
- Remediation action tracking
- Scanner integrations (Nessus, Qualys, Tenable, Rapid7, CrowdStrike)
- Wazuh integration
- Asset-vulnerability mapping
- Control linkage for mitigation tracking

---

### 13. Incidents Module (`apps/server/src/incidents/`)

**Purpose**: Incident management with NIS2/DORA compliance

**Controllers:**
- `incident.controller.ts` - Incident CRUD
- `incident-timeline.controller.ts` - Timeline management
- `incident-evidence.controller.ts` - Evidence collection
- `incident-communication.controller.ts` - Communications
- `incident-lessons-learned.controller.ts` - Lessons learned
- `incident-notification.controller.ts` - Regulatory notifications
- `reference-data.controller.ts` - Incident types, attack vectors, authorities

**Services:**
- `incident.service.ts` - Incident operations
- `incident-classification.service.ts` - NIS2/DORA classification
- `incident-notification.service.ts` - Regulatory reporting

**Schema**: `incidents.prisma`

**Key Features:**
- Incident lifecycle (DETECTED → TRIAGED → INVESTIGATING → CONTAINING → ERADICATING → RECOVERING → POST_INCIDENT → CLOSED)
- NIS2 significant incident assessment (Article 23)
- DORA major incident classification (7 criteria)
- Regulatory notification tracking (24h/72h/1month deadlines)
- Timeline tracking
- Evidence collection with chain of custody
- Communication log
- Lessons learned tracking
- Linkage to risk scenarios, controls, assets

---

### 14. Dashboard Module (`apps/server/src/dashboard/`)

**Purpose**: Aggregated dashboard data

**Controllers:**
- `dashboard.controller.ts` - Dashboard endpoints

**Services:**
- `dashboard.service.ts` - Dashboard aggregation

**Endpoints:**
- `GET /api/dashboard` - Main dashboard data

---

### 15. Shared Module (`apps/server/src/shared/`)

**Purpose**: Shared utilities, pipes, filters, guards, events

**Structure:**
- `events/` - Event definitions and handlers
- `filters/` - Exception filters
- `guards/` - Route guards
- `pipes/` - Request transformation pipes
- `utils/` - Utility functions

**Key Files:**
- `events/event-emitter.module.ts` - Global event emitter
- `events/control-events.ts` - Control-related events
- `filters/http-exception.filter.ts` - Global exception handler
- `pipes/sanitize.pipe.ts` - XSS sanitization
- `guards/jwt-auth.guard.ts` - JWT authentication guard

---

## Frontend Structure

### Entry Point

**File**: `apps/web/src/main.tsx`
- React 18 with StrictMode
- Root component: `App.tsx`

**File**: `apps/web/src/App.tsx`
- React Router setup
- Authentication flow
- Route definitions (500+ routes)
- Error boundary

### App Shell

**File**: `apps/web/src/components/app-shell.tsx`
- Main layout component
- Primary sidebar (collapsible)
- Secondary sidebars (module-specific)
- Header with search, notifications, user menu
- Command palette integration

### Component Organization

**Location**: `apps/web/src/components/`

**Module Components:**
- `risks/` - Risk management UI
- `risks-v2/` - Risk management v2 (redesigned)
- `controls/` - Control management UI
- `policies/` - Policy management UI
- `audits/` - Audit management UI
- `organisation/` - Organisation management UI
- `applications/` - Application management UI
- `itsm/` - ITSM UI
- `supply-chain/` - Supply chain UI
- `evidence/` - Evidence management UI
- `bcm/` - BCM UI
- `vulnerabilities/` - Vulnerability management UI
- `incidents/` - Incident management UI
- `dashboard/` - Dashboard widgets
- `threats/` - Threat catalog UI

**Shared Components:**
- `archer/` - Archer pattern components (detail/list pages)
- `common/` - Common UI components
- `ui/` - Radix UI primitives
- `shared/` - Shared utilities

**Key Archer Components:**
- `detail-page-layout.tsx` - Standardized detail page layout
- `list-page-layout.tsx` - Standardized list page layout
- `record-header.tsx` - Record header with actions
- `tab-set.tsx` - Tab navigation
- `section.tsx` - Content sections
- `field-group.tsx` - Form field groups
- `permission-gate.tsx` - Permission-based rendering
- `audit-log.tsx` - Audit trail display
- `workflow-sidebar.tsx` - Workflow status sidebar

### Pages

**Location**: `apps/web/src/pages/`

**Module Pages:**
- `risks/` - Risk management pages (20+ pages)
- `controls/` - Control management pages (15+ pages)
- `policies/` - Policy management pages (15+ pages)
- `audits/` - Audit pages
- `organisation/` - Organisation pages (30+ pages)
- `applications/` - Application pages
- `itsm/` - ITSM pages (10+ pages)
- `supply-chain/` - Supply chain pages (15+ pages)
- `evidence/` - Evidence pages
- `bcm/` - BCM pages (10+ pages)
- `vulnerabilities/` - Vulnerability pages (10+ pages)
- `incidents/` - Incident pages (10+ pages)
- `demo-nis2/` - NIS2 demo pages

**Total**: 174+ pages across all modules

### API Client Library

**Location**: `apps/web/src/lib/`

**Files:**
- `api.ts` - Base API client and auth
- `risks-api.ts` - Risk API client
- `controls-api.ts` - Control API client
- `policies-api.ts` - Policy API client
- `organisation-api.ts` - Organisation API client
- `applications-api.ts` - Application API client
- `audits-api.ts` - Audit API client
- `itsm-api.ts` - ITSM API client
- `supply-chain-api.ts` - Supply chain API client
- `evidence-api.ts` - Evidence API client
- `bcm-api.ts` - BCM API client
- `vulnerabilities-api.ts` - Vulnerability API client
- `incidents-api.ts` - Incident API client
- `dashboard-api.ts` - Dashboard API client
- `threats-api.ts` - Threat API client
- `governance-api.ts` - Governance API client
- `risk-lifecycle-api.ts` - Risk lifecycle API client
- `scanner-connectors-api.ts` - Scanner connector API client
- `utils.ts` - Utility functions
- `export-utils.ts` - Export functionality
- `risk-scoring.ts` - Risk scoring utilities
- `likelihood-factors.ts` - Likelihood factor utilities
- `asset-type-utils.ts` - Asset type utilities
- `parse-policy-content.ts` - Policy content parsing
- `policy-markdown-parser.ts` - Markdown parsing

**Archer Library:**
- `archer/types.ts` - TypeScript types
- `archer/constants.ts` - Constants
- `archer/permissions.ts` - Permission utilities
- `archer/hooks/use-bulk-selection.ts` - Bulk selection hook
- `archer/hooks/use-conditional-layout.ts` - Conditional layout hook
- `archer/hooks/use-permissions.ts` - Permission hook

### Contexts and Hooks

**Location**: `apps/web/src/contexts/` and `apps/web/src/hooks/`

**Files:**
- `contexts/AuthContext.tsx` - Authentication context
- `hooks/useAsync.ts` - Async operation hook
- `hooks/useCurrentUser.ts` - Current user hook
- `hooks/usePersonaView.ts` - Persona view hook

---

## Database Schema

### Schema Organization

**Location**: `apps/server/prisma/schema/`

**Files:**
- `base.prisma` - Generator and datasource configuration
- `auth.prisma` - User, RefreshSession, AuditEvent
- `organisation.prisma` - Organisation, departments, locations, processes, etc.
- `risks.prisma` - Risk, RiskScenario, KRI, TreatmentPlan, RTS, BIRT, lifecycle models
- `risk-governance.prisma` - Governance roles, appetite config, breach alerts
- `loss-magnitude.prisma` - Loss magnitude catalogue
- `controls.prisma` - Control, ControlLayer, LayerTest, SOA, FrameworkCrossReference
- `policies.prisma` - PolicyDocument, DocumentVersion, DocumentReview, workflows
- `applications.prisma` - Application, ApplicationISRA, BIA, TVA, SRL
- `audits.prisma` - Nonconformity
- `itsm.prisma` - Asset, Change, CapacityPlan
- `supply-chain.prisma` - Vendor, VendorAssessment, VendorContract, VendorReview
- `evidence.prisma` - Evidence, EvidenceRequest, junction tables
- `bcm.prisma` - BCMProgram, ContinuityPlan, BCMTestExercise, PlanActivation
- `vulnerabilities.prisma` - Vulnerability, VulnerabilityScan, VulnerabilityRemediation
- `incidents.prisma` - Incident, IncidentNIS2Assessment, IncidentDORAAssessment, notifications

### Key Models

**User & Auth:**
- `User` - User accounts
- `RefreshSession` - Refresh token sessions
- `AuditEvent` - System audit log

**Organisation:**
- `OrganisationProfile` - Main organisation record with GRC calibration
- `Department` - Department hierarchy
- `BusinessProcess` - Business processes with BIA status
- `Location` - Physical locations
- `SecurityCommittee` - Security committees
- `CommitteeMeeting` - Meeting records
- `MeetingDecision` - Meeting decisions
- `MeetingActionItem` - Action items
- `RegulatoryEligibilitySurvey` - DORA/NIS2 eligibility surveys

**Risks:**
- `Risk` - Parent risk records
- `RiskScenario` - Specific risk scenarios (10-state lifecycle)
- `KeyRiskIndicator` - KRIs with RAG status
- `RiskToleranceStatement` - RTS definitions
- `TreatmentPlan` - Risk treatment plans
- `RiskAcceptance` - Risk acceptance records
- `RiskEscalation` - Escalation records
- `ScenarioReview` - Review records
- `RiskCalculationHistory` - Calculation audit trail
- `AssessmentSnapshot` - Assessment snapshots
- `RiskAppetiteConfig` - Appetite configuration
- `RiskAppetiteDomainConfig` - Per-domain appetite
- `RiskAppetiteBreachAlert` - Breach alerts
- `LossMagnitudeCatalog` - Loss magnitude catalogue

**Controls:**
- `Control` - ISO 27001 controls
- `ControlLayer` - Four-layer framework layers
- `LayerTest` - Test definitions
- `LayerTestExecution` - Test execution history
- `LayerTestTemplate` - Test templates
- `StatementOfApplicability` - SOA documents
- `SOAEntry` - SOA entries
- `FrameworkCrossReference` - Framework mappings

**Policies:**
- `PolicyDocument` - Policy documents
- `DocumentVersion` - Version history
- `DocumentReview` - Review records
- `DocumentApprovalWorkflow` - Approval workflows
- `ApprovalStep` - Workflow steps
- `DocumentChangeRequest` - Change requests
- `DocumentException` - Policy exceptions
- `DocumentAcknowledgment` - User acknowledgments
- `DocumentSection` - Structured sections
- `DocumentControlMapping` - Control mappings
- `DocumentRiskMapping` - Risk mappings

**Applications:**
- `Application` - Application inventory (43 fields)
- `ApplicationISRA` - ISRA instances
- `ApplicationBIA` - BIA assessments
- `BIAResponse` - BIA questionnaire responses
- `BIAQuestionCatalog` - BIA question master list
- `ApplicationTVA` - TVA assessments
- `ThreatEntry` - TVA threat entries
- `VulnerabilityEntry` - TVA vulnerability entries
- `ApplicationSRL` - SRL instances
- `ApplicationSRLEntry` - SRL entries
- `SRLMasterRequirement` - SRL master requirements
- `ThreatCatalog` - Threat library

**Audits:**
- `Nonconformity` - Nonconformity records with CAP workflow

**ITSM:**
- `Asset` - CMDB assets
- `AssetRelationship` - Asset relationships
- `AssetRisk` - Asset-risk links
- `Change` - Change records
- `ChangeApproval` - Change approvals
- `ChangeTemplate` - Change templates
- `CapacityRecord` - Capacity metrics
- `CapacityPlan` - Capacity plans

**Supply Chain:**
- `Vendor` - Vendor records
- `VendorAssessment` - Assessment instances
- `AssessmentQuestion` - Question bank
- `AssessmentResponse` - Assessment responses
- `AssessmentFinding` - Assessment findings
- `VendorContract` - Contracts with DORA checklist
- `VendorReview` - Periodic reviews
- `VendorExitPlan` - Exit plans
- `VendorSLARecord` - SLA tracking

**Evidence:**
- `Evidence` - Evidence records
- `EvidenceRequest` - Evidence requests
- `EvidenceRequestFulfillment` - Request fulfillment
- Junction tables for all module links

**BCM:**
- `BCMProgram` - BCM programs
- `ContinuityPlan` - Continuity plans
- `BCMTestExercise` - Test exercises
- `BCMTestFinding` - Test findings
- `PlanActivation` - Plan activations
- `BIAAssessmentHistory` - BIA assessment history

**Vulnerabilities:**
- `Vulnerability` - Vulnerability records
- `VulnerabilityAsset` - Asset-vulnerability links
- `VulnerabilityRemediation` - Remediation actions
- `VulnerabilityScan` - Scan records
- `VulnerabilitySLAConfig` - SLA configuration
- `VulnerabilityScannerConnector` - Scanner connectors
- `VulnerabilityTimelineEntry` - Timeline entries

**Incidents:**
- `Incident` - Incident records
- `IncidentNIS2Assessment` - NIS2 classification
- `IncidentDORAAssessment` - DORA classification
- `IncidentNotification` - Regulatory notifications
- `RegulatoryAuthority` - Regulatory authorities
- `IncidentType` - Incident type reference data
- `AttackVector` - MITRE ATT&CK aligned vectors
- `IncidentAsset` - Affected assets
- `IncidentEvidence` - Evidence collection
- `IncidentTimelineEntry` - Timeline entries
- `IncidentCommunication` - Communications log
- `IncidentLessonsLearned` - Lessons learned
- `IncidentScenario` - Risk scenario links

### Junction Tables

**Risk Scenario Links:**
- `RiskScenarioAsset` - Scenario-asset links (F3, F5, I1, I2)
- `RiskScenarioVendor` - Scenario-vendor links (F3, I1, I4)
- `RiskScenarioApplication` - Scenario-application links (F3, F5, I1, I3)
- `RiskScenarioControl` - Scenario-control links (F2)
- `RiskScenarioThreat` - Scenario-threat links (F1)
- `RiskScenarioKRI` - Scenario-KRI links

**Evidence Links:**
- `EvidenceControl`, `EvidenceRisk`, `EvidencePolicy`, `EvidenceIncident`, `EvidenceVendor`, `EvidenceAsset`, `EvidenceChange`, `EvidenceApplication`, `EvidenceISRA`, `EvidenceNonconformity`, `EvidenceTreatment`, `EvidenceAssessment`, `EvidenceContract`, `EvidenceBCMTest`

**Other Links:**
- `AssetControl`, `AssetRisk`, `AssetBusinessProcess`
- `IncidentControl`, `IncidentNonconformity`, `IncidentAsset`
- `VulnerabilityControl`, `VulnerabilityIncident`, `VulnerabilityAsset`
- `DocumentControlMapping`, `DocumentRiskMapping`

---

## Configuration

### Backend Configuration

**Location**: `apps/server/src/config/`

**Files:**
- `core.config.ts` - Core app-wide constants
- `risks.config.ts` - Risk module configuration
- `controls.config.ts` - Controls module configuration
- `index.ts` - Configuration exports

**Key Config Values:**

**Core:**
- Time periods (days per week/month/quarter/year)
- Severity levels
- Notification timing
- Review frequencies
- Retention policies

**Risks:**
- Score thresholds (LOW: 7, MEDIUM: 14, HIGH: 19, CRITICAL: 25)
- Tolerance levels (VERY_LOW: 5, LOW: 8, MEDIUM: 12, HIGH: 16, VERY_HIGH: 20)
- Factor weights (F1: 25%, F2: 25%, F3: 20%, F4: 15%, F5: 10%, F6: 5%)
- Treatment deadlines
- Acceptance validity periods
- Control effectiveness scoring
- BIRT default weights

**Controls:**
- Effectiveness thresholds (EFFECTIVE: 90%, PARTIALLY_EFFECTIVE: 70%)
- Maturity levels (0-5)
- Gap priorities
- Metric frequencies
- Test result scoring

### Environment Variables

**Required:**
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `ACCESS_TOKEN_TTL_SECONDS` - JWT TTL (default: 900)
- `REFRESH_SESSION_TTL_DAYS` - Refresh token TTL (default: 14)

**Optional:**
- `REDIS_URL` - Redis connection (for future caching)
- `S3_ENDPOINT` - S3-compatible storage endpoint
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name
- `COOKIE_DOMAIN` - Cookie domain
- `COOKIE_SECURE` - Cookie secure flag
- `ADMIN_EMAIL` - Default admin email
- `ADMIN_PASSWORD` - Default admin password

### Frontend Configuration

**File**: `apps/web/vite.config.ts`
- Vite build configuration
- Path aliases (`@/` → `src/`)
- Proxy configuration (`/api` → `http://127.0.0.1:4000`)
- Code splitting (react-vendor, ui-vendor, chart-vendor)

**File**: `apps/web/tailwind.config.ts`
- Tailwind CSS configuration
- Design system tokens
- Custom animations

---

## Dependencies

### Backend Dependencies

**Core:**
- `@nestjs/common`, `@nestjs/core` - NestJS framework
- `@nestjs/platform-express` - Express adapter
- `@nestjs/jwt`, `@nestjs/passport` - Authentication
- `@nestjs/event-emitter` - Event system
- `@nestjs/schedule` - Scheduled jobs
- `@nestjs/throttler` - Rate limiting
- `@prisma/client` - Prisma ORM
- `prisma` - Prisma CLI

**Utilities:**
- `class-validator`, `class-transformer` - Validation
- `bcryptjs` - Password hashing
- `cookie-parser` - Cookie parsing
- `helmet` - Security headers
- `xss` - XSS sanitization
- `date-fns` - Date utilities
- `axios` - HTTP client
- `csv-parse` - CSV parsing
- `zod` - Schema validation

**Development:**
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server
- `jest` - Testing framework
- `@swc/cli`, `@swc/core` - Fast TypeScript compiler

### Frontend Dependencies

**Core:**
- `react`, `react-dom` - React framework
- `react-router-dom` - Routing
- `react-hook-form` - Form management

**UI:**
- `@radix-ui/*` - UI primitives (dialog, dropdown, select, tabs, tooltip, etc.)
- `lucide-react` - Icons
- `tailwindcss` - CSS framework
- `class-variance-authority` - Component variants
- `clsx`, `tailwind-merge` - Class utilities

**Charts & Visualization:**
- `recharts` - Chart library
- `leaflet`, `react-leaflet` - Maps
- `@xyflow/react` - Flow diagrams

**Utilities:**
- `date-fns` - Date utilities
- `react-markdown`, `remark-gfm` - Markdown rendering
- `sonner` - Toast notifications
- `cmdk` - Command palette
- `@dnd-kit/*` - Drag and drop

**Development:**
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin
- `@playwright/test` - E2E testing
- `typescript` - TypeScript

---

## File Structure

### Backend Structure

```
apps/server/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── worker.ts                  # Background worker
│   ├── auth/                      # Authentication module
│   ├── risks/                     # Risk management module
│   │   ├── controllers/           # 17 controllers
│   │   ├── services/              # 25+ services
│   │   ├── dto/                   # Data transfer objects
│   │   ├── utils/                 # Utility functions
│   │   └── integration/           # Integration tests
│   ├── controls/                  # Controls module
│   │   ├── controllers/           # 9 controllers
│   │   ├── services/              # 13 services
│   │   ├── dto/                   # DTOs
│   │   ├── types/                 # Type definitions
│   │   └── utils/                 # Utilities
│   ├── policies/                  # Policies module
│   │   ├── controllers/           # 12 controllers
│   │   ├── services/              # 13 services
│   │   └── dto/                   # DTOs
│   ├── organisation/              # Organisation module
│   │   ├── controllers/           # 25 controllers
│   │   └── services/              # 25 services
│   ├── applications/              # Applications module
│   │   ├── controllers/           # 5 controllers
│   │   └── services/              # 6 services
│   ├── audits/                    # Audits module
│   │   ├── controllers/           # 1 controller
│   │   └── services/              # 1 service
│   ├── itsm/                      # ITSM module
│   │   ├── controllers/           # 8 controllers
│   │   ├── services/              # 8 services
│   │   └── dto/                   # DTOs
│   ├── supply-chain/              # Supply chain module
│   │   ├── controllers/           # 6 controllers
│   │   └── services/              # 5 services
│   ├── evidence/                  # Evidence module
│   │   ├── controllers/           # 4 controllers
│   │   └── services/              # 4 services
│   ├── bcm/                       # BCM module
│   │   ├── controllers/           # 6 controllers
│   │   └── services/              # 5 services
│   ├── vulnerabilities/          # Vulnerabilities module
│   │   ├── controllers/           # 7 controllers
│   │   ├── services/              # 5 services
│   │   └── dto/                   # DTOs
│   ├── incidents/                 # Incidents module
│   │   ├── controllers/           # 7 controllers
│   │   └── services/              # 3 services
│   ├── dashboard/                  # Dashboard module
│   ├── health/                     # Health checks
│   ├── prisma/                     # Prisma service
│   ├── shared/                     # Shared utilities
│   │   ├── events/                 # Event definitions
│   │   ├── filters/                # Exception filters
│   │   ├── guards/                 # Route guards
│   │   ├── pipes/                  # Request pipes
│   │   └── utils/                  # Utilities
│   └── config/                     # Configuration
├── prisma/
│   ├── schema/                     # Multi-file Prisma schema (18 files)
│   ├── migrations/                 # Database migrations
│   ├── seed/                       # Seed data scripts
│   └── seed.ts                     # Main seed file
└── scripts/                        # Utility scripts
```

### Frontend Structure

```
apps/web/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component with routing
│   ├── components/
│   │   ├── app-shell.tsx           # Main layout
│   │   ├── ErrorBoundary.tsx      # Error boundary
│   │   ├── archer/                 # Archer pattern components
│   │   ├── common/                 # Common components
│   │   ├── ui/                     # UI primitives
│   │   ├── risks/                  # Risk components
│   │   ├── risks-v2/              # Risk v2 components
│   │   ├── controls/              # Control components
│   │   ├── policies/              # Policy components
│   │   ├── audits/                 # Audit components
│   │   ├── organisation/          # Organisation components
│   │   ├── applications/          # Application components
│   │   ├── itsm/                   # ITSM components
│   │   ├── supply-chain/          # Supply chain components
│   │   ├── evidence/              # Evidence components
│   │   ├── bcm/                    # BCM components
│   │   ├── vulnerabilities/       # Vulnerability components
│   │   ├── incidents/             # Incident components
│   │   ├── threats/               # Threat components
│   │   └── dashboard/             # Dashboard widgets
│   ├── pages/                      # Page components (174+ pages)
│   ├── lib/                        # API clients and utilities
│   ├── contexts/                   # React contexts
│   ├── hooks/                      # Custom hooks
│   └── styles.css                  # Global styles
├── e2e/                            # E2E tests
└── index.html                      # HTML template
```

### Documentation Structure

```
docs/
├── architecture/                   # Architecture documentation
│   ├── controls/                   # Control module architecture
│   └── risk-management/           # Risk module architecture
├── risks-module/                   # Risk module docs
├── controls-module/                # Controls module docs
├── policy-module/                  # Policy module docs
├── organisation-module/            # Organisation module docs
├── applications-isra-module/       # Applications module docs
├── audits-module/                  # Audits module docs
├── itsm-module/                    # ITSM module docs
├── supply-chain-module/            # Supply chain module docs
├── evidence-module/                # Evidence module docs
├── bcm-module/                     # BCM module docs
├── plans/                          # Implementation plans
└── audit-reports/                  # Architecture audit reports
```

---

## Key Design Patterns

### 1. Domain-Driven Design (DDD)
- Each module is a bounded context
- Clear module boundaries
- Module-specific services and controllers

### 2. Event-Driven Architecture
- Global EventEmitter2 for cross-module communication
- Events for control testing, risk calculation triggers
- Decoupled module interactions

### 3. Archer Pattern (Frontend)
- Standardized detail/list page layouts
- Reusable components for common patterns
- Consistent UX across modules

### 4. Repository Pattern
- PrismaService as data access layer
- Services contain business logic
- Controllers handle HTTP concerns

### 5. State Machine Pattern
- Risk scenario 10-state lifecycle
- State transition validation
- Immutable state history

### 6. Factory Pattern
- Test generation from templates
- Treatment plan templates
- Change templates

### 7. Strategy Pattern
- Multiple risk calculation strategies
- Different tolerance evaluation strategies
- Framework-specific control mappings

---

## Integration Points

### Module Interconnections

**Risks ↔ Controls:**
- Control effectiveness → Risk scenario F2 factor
- Risk scenarios link to controls via `RiskScenarioControl`
- Control test failures → Risk recalculation triggers

**Risks ↔ Applications:**
- Applications link to scenarios (F3, F5, I1, I3)
- ISRA risk level determines SRL applicability
- SRL gaps → Automated nonconformities

**Risks ↔ Incidents:**
- Incidents link to scenarios (materialization tracking)
- Incident triggers scenario reassessment
- Incident impact updates scenario scores

**Controls ↔ Policies:**
- Policy documents map to controls
- Policy evidence collection automation
- Policy gaps → Control gaps

**Applications ↔ Audits:**
- SRL gaps → Nonconformities
- ISRA findings → NC creation

**BCM ↔ Organisation:**
- Business processes have BIA status
- BIA completion gates BCP eligibility
- Process RTO/RPO from BIA

**Vulnerabilities ↔ ITSM:**
- Vulnerabilities link to assets
- Asset risk scoring includes vulnerability data
- Wazuh integration for asset security data

**Incidents ↔ BCM:**
- Incidents trigger plan activations
- Plan activation tracks recovery metrics

**Evidence ↔ All Modules:**
- Central evidence repository
- Links to all modules via junction tables
- Evidence requests from any module

---

## Security Features

### Authentication & Authorization
- JWT with refresh tokens
- Cookie-based session management
- Password hashing with bcrypt
- Route guards for protected endpoints

### Input Validation
- class-validator for request validation
- XSS sanitization via SanitizePipe
- SQL injection prevention via Prisma parameterized queries

### Security Headers
- Helmet for security headers
- CORS with origin whitelist
- Rate limiting (100 req/min)

### Data Protection
- Password hashing
- Secure cookie configuration
- Environment variable protection

---

## Testing

### Backend Testing
- Jest test framework
- Unit tests alongside source files (`.spec.ts`)
- Integration tests in `*/integration/*.integration.spec.ts`
- Test coverage reporting

### Frontend Testing
- Playwright for E2E tests
- E2E tests in `apps/web/e2e/`
- Test configuration in `playwright.config.ts`

---

## Deployment

### Docker Compose

**Services:**
- `server` - NestJS API server
- `web` - React frontend (nginx)
- `db` - PostgreSQL database
- `redis` - Redis cache (for future use)
- `minio` - S3-compatible storage
- `caddy` - Reverse proxy
- `migrate` - Database migration job
- `worker` - Background worker

**Volumes:**
- `postgres_data` - Database persistence
- `redis_data` - Redis persistence
- `minio_data` - Object storage
- `caddy_data`, `caddy_config` - Caddy configuration

### Build Process

**Backend:**
1. Prisma schema generation
2. TypeScript compilation with SWC
3. Output to `dist/`

**Frontend:**
1. Vite build
2. Code splitting (vendor chunks)
3. Output to `dist/`

---

## Development Workflow

### Backend Development
```bash
cd apps/server
npm run dev              # Start dev server (ts-node-dev)
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:seed     # Seed database
npm test                # Run tests
```

### Frontend Development
```bash
cd apps/web
npm run dev             # Start Vite dev server
npm run build           # Production build
npm run test:e2e       # Run E2E tests
```

### Scaffolding
```bash
npm run scaffold:list    # Generate list page
npm run scaffold:detail # Generate detail page
npm run scaffold:dashboard # Generate dashboard page
```

---

## Statistics

### Codebase Size
- **Backend**: 13 modules, 100+ controllers, 150+ services
- **Frontend**: 174+ pages, 500+ components
- **Database**: 18 Prisma schema files, 200+ models
- **Documentation**: 150+ markdown files

### Module Breakdown
- **Risks**: 17 controllers, 25+ services, most complex module
- **Controls**: 9 controllers, 13 services
- **Policies**: 12 controllers, 13 services
- **Organisation**: 25 controllers, 25 services
- **Applications**: 5 controllers, 6 services
- **ITSM**: 8 controllers, 8 services
- **Supply Chain**: 6 controllers, 5 services
- **Incidents**: 7 controllers, 3 services
- **Vulnerabilities**: 7 controllers, 5 services
- **BCM**: 6 controllers, 5 services
- **Evidence**: 4 controllers, 4 services
- **Audits**: 1 controller, 1 service

---

## Compliance Frameworks

### Supported Frameworks
- **ISO 27001:2022** - Primary framework
- **SOC 2** - Type II compliance
- **NIS2** - Network and Information Systems Directive
- **DORA** - Digital Operational Resilience Act
- **GDPR** - General Data Protection Regulation
- **EU AI Act** - AI regulation compliance

### Framework-Specific Features

**ISO 27001:2022:**
- All 93 Annex A controls
- Statement of Applicability (SOA)
- Four-layer framework testing
- Document management (Clause 7.5)
- Risk management (Clause 6.1)
- Nonconformity management (Clause 10.1)

**NIS2:**
- Significant incident classification
- Regulatory notification tracking (24h/72h/1month)
- Essential/Important entity classification
- Sector-specific requirements

**DORA:**
- Major incident classification (7 criteria)
- Third-party risk management (Article 28)
- Contract compliance checklist (Article 30)
- Exit plan requirements
- Concentration risk analysis

**GDPR:**
- Data processing tracking
- PII handling identification
- Cross-border transfer tracking
- DPIA requirements

**EU AI Act:**
- AI system classification
- Risk classification (UNACCEPTABLE, HIGH, LIMITED, MINIMAL)
- BIA integration for AI systems

---

## Future Enhancements

### Planned Features
- Enhanced reporting and analytics
- Advanced workflow automation
- Mobile app support
- API rate limiting improvements
- Enhanced audit trail
- Advanced search capabilities
- Real-time notifications
- Advanced dashboard customization

### Technical Debt
- Some modules have incomplete service implementations
- Frontend component consolidation needed
- Test coverage improvements
- Performance optimization opportunities
- Documentation updates needed

---

## Conclusion

RiskReady is a comprehensive, enterprise-grade GRC platform with extensive functionality across 13 major modules. The system demonstrates:

- **Modular Architecture**: Clear separation of concerns with domain-driven design
- **Comprehensive Coverage**: Full GRC lifecycle from risk identification to compliance reporting
- **Regulatory Alignment**: Support for multiple compliance frameworks
- **Automation**: Extensive automation for calculations, scheduling, and workflows
- **Scalability**: Designed for enterprise-scale deployments
- **Extensibility**: Event-driven architecture allows for easy module integration

The codebase is well-structured with clear patterns, comprehensive documentation, and a focus on maintainability and compliance.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Maintained By**: Development Team
