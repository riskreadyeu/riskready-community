# RiskReady Community Edition — Feature Reference

> Accurate as of February 2026. All numbers verified from source code.

---

## Platform Overview

RiskReady Community Edition is a **full-stack AI-native GRC (Governance, Risk & Compliance) platform** — not a starter kit. It ships with 13 integrated modules, 9 MCP servers with 254 AI tools, a complete React web application, and a ready-to-use demo company (ClearStream Payments) with data across every module.

**Stack**: PostgreSQL 16 | NestJS | React | Fastify Gateway | Anthropic Messages API | Docker Compose

---

## By the Numbers

| Metric | Count |
|--------|-------|
| MCP Servers | 9 |
| AI Tools (total) | 254 |
| Web UI Routes | 127 |
| Database Models | 120 |
| REST API Controllers | 70 |
| Human-in-the-Loop Action Types | 103 |
| AI Council Members | 6 |
| Built-in Autonomous Workflows | 4 |
| Primary Framework (ISO 27001) | Full depth |
| Additional Frameworks (SOC 2, NIS2, DORA) | Tagging + eligibility |
| Scenario Lifecycle States | 11 |
| Docker Services | 6 |

---

## Modules

### 1. Risk Management
- **5x5 Risk Matrix**: Likelihood (1-5) x Impact (1-5) = Score (1-25)
- **Risk Register** with tier classification (Core, Extended, Advanced)
- **Risk Scenarios** with 11-state lifecycle (Draft > Assessed > Evaluated > Treating > Treated > Accepted > Monitoring > Escalated > Review > Closed > Archived)
- **Key Risk Indicators (KRIs)** with green/amber/red thresholds, trend tracking, and history
- **Risk Tolerance Statements (RTS)** with appetite levels, approval workflow, and scenario linkage
- **Treatment Plans** with actions, owners, timelines, and dependencies
- **Tolerance Evaluation**: automatic WITHIN / EXCEEDS / CRITICAL classification
- **Control Effectiveness Reduction**: linked controls automatically reduce residual scores
- **Full calculation audit trail** with history and override tracking

### 2. Controls Management
- **Control Library** with 4-theme structure (Organisational, People, Physical, Technological)
- **Statement of Applicability (SOA)** with version management and approval workflow
- **Control Assessments** with test assignment, execution tracking, and remediation
- **Control Metrics** with automated collection and trending
- **Gap Analysis** across frameworks
- **Scope Management** with scope items and justifications
- **66 MCP tools** — the largest module

### 3. Incident Management
- **Incident Register** with severity classification and priority
- **Timeline Tracking** with chronological event entries
- **Evidence Collection** linked to incidents
- **Affected Asset Tracking** via CMDB integration
- **Lessons Learned** with assignees and follow-up
- **Incident-Scenario Linking** to connect real incidents to risk scenarios

### 4. Policy Management
- **Policy Document Lifecycle** (Draft > Review > Approved > Published > Retired)
- **Version History** with full diff tracking
- **Approval Workflows** with multi-step approval chains and delegation
- **Document Sections** with structured content editing
- **Change Requests** with impact assessment
- **Exceptions** with time-bound approval
- **Acknowledgments** tracking across the organisation
- **Control & Risk Mappings** linking policies to controls and risks

### 5. Evidence Management
- **Evidence Repository** with file storage and metadata
- **Evidence Requests** with assignment and fulfillment workflow
- **Coverage Analysis** showing gaps across controls, risks, and policies
- **Multi-entity Linking**: evidence linked to controls, risks, incidents, policies, assets, changes, treatments, and nonconformities
- **Expiry Tracking** for time-sensitive evidence

### 6. Audit Management
- **Nonconformity Register** with severity and status tracking
- **Corrective Action Plans (CAP)** with submit/approve/reject workflow
- **Verification** and closure workflow
- **Linked to evidence, controls, and risks**

### 7. ITSM / CMDB
- **Asset Register** (hardware, software, cloud, data, people, facility)
- **Asset Relationships** and dependency mapping
- **Change Management** with CAB approval workflow, calendar view, and templates
- **Capacity Planning** with records and forecasting
- **Data Quality** dashboard
- **Software Inventory** tracking

### 8. Organisation Management
- **Organisation Profile** with size, industry, revenue, and regulatory scope
- **Departments** with heads, deputies, and member management
- **Locations** with address and classification
- **Business Processes** with owners, managers, and criticality
- **External Dependencies** and vendor management
- **Regulators** with contact details and jurisdiction
- **Security Committees** with memberships, meetings, decisions, and action items
- **Executive Positions** and **Security Champions**
- **Key Personnel** with backup relationships
- **Applicable Frameworks** configuration
- **Regulatory Eligibility Surveys** (DORA, NIS2)
- **Context Issues**, **Interested Parties**, **Products & Services**, **Technology Platforms**

### 9. Dashboard
- **Metrics Overview** with organisation-wide KPIs
- **Risk Score Gauge** with current posture
- **Compliance Charts** by framework
- **Recent Activity** feed
- **Upcoming Tasks** and deadlines
- **Executive Insights** summary

### 10-13. Agentic AI Platform

#### AI Agents Council
- **6 specialist agents** deliberate on complex cross-domain questions:
  - **Risk Analyst** — risk register, KRIs, scenarios, tolerance, treatments
  - **Controls Auditor** — control effectiveness, SOA, assessments, gap analysis
  - **Compliance Officer** — policies, framework alignment (ISO 27001, DORA, NIS2)
  - **Incident Commander** — incident patterns, lessons learned, response metrics
  - **Evidence Auditor** — evidence coverage, audit readiness, nonconformities
  - **CISO Strategist** — cross-domain synthesis and strategic recommendations
- **3 deliberation patterns**: parallel then synthesis, sequential build, debate and resolve
- **Heuristic classifier** triggers council automatically for multi-domain questions
- **Full audit trail**: CouncilSession and CouncilOpinion records persisted

#### Autonomous Scheduler
- **Cron-based scheduling** for recurring AI tasks
- **4 built-in workflows**:
  1. **Incident Response Flow** — incident analysis > control gaps > risk re-assessment > treatment proposal
  2. **Weekly Risk Review** — tolerance breaches > KRI trends > overdue treatments > executive summary
  3. **Control Assurance Cycle** — assessment status > gap analysis > nonconformity tracking
  4. **Policy Compliance Check** — overdue reviews > exception expiry > evidence coverage
- **Event triggers**: automatic runs on incident.created and approval.resolved
- **Task persistence**: AgentTask records track all executions across sessions

#### Human-in-the-Loop Approval
- **103 action types** across all modules, every AI mutation requires human approval
- **Approval queue** with approve/reject/execute workflow
- **MCP Approvals page** in the web UI for reviewing pending actions
- **Full audit trail** with actor, timestamp, and action metadata
- **Resume capability**: suspended tasks automatically resume after approval

#### Agent Self-Awareness (Agent-Ops)
- **7 tools** for agent introspection:
  - Check action status, list pending/recent actions
  - Task tracking and progress updates
  - Schedule management

---

## MCP Servers

| Server | Tools | Domain |
|--------|-------|--------|
| riskready-controls | 66 | Controls, SOA, assessments, metrics, scope |
| riskready-itsm | 40 | CMDB, change management, capacity planning |
| riskready-organisation | 35 | Org structure, committees, processes, personnel |
| riskready-risks | 34 | Risk register, scenarios, KRIs, RTS, treatments |
| riskready-policies | 23 | Policy documents, versions, approvals, exceptions |
| riskready-incidents | 19 | Incidents, timelines, evidence, lessons learned |
| riskready-evidence | 16 | Evidence repository, requests, multi-entity links |
| riskready-audits | 14 | Nonconformities, CAP workflow |
| riskready-agent-ops | 7 | Action status, task tracking, agent awareness |
| **Total** | **254** | |

All 9 servers connect via Claude Desktop or Claude Code (MCP protocol).

---

## Regulatory Frameworks

| Framework | Depth | What's Implemented |
|-----------|-------|-------------------|
| **ISO 27001:2022** | Full | Annex A control structure, Statement of Applicability with versioning and approval, theme-based organisation (Organisational, People, Physical, Technological), assessment lifecycle, coverage reporting |
| **SOC 2** | Tagging | Controls can be tagged with TSC category and SOC 2 criteria (free-text fields for cross-referencing) |
| **NIS2** | Eligibility | Regulatory eligibility survey, scope propagation (auto-enables/disables NIS2 controls), organisation classification (essential/important, sector, annex type) |
| **DORA** | Eligibility | Regulatory eligibility survey, scope propagation (auto-enables/disables DORA controls), entity type classification, supervisory authority tracking |

ISO 27001 is the primary framework with full depth. SOC 2, NIS2, and DORA provide framework tagging and regulatory scoping — article-level compliance mapping is available in the Business Edition.

---

## Risk Scoring Methodology

### 5x5 Risk Matrix
- **Likelihood Levels**: Rare (1), Unlikely (2), Possible (3), Likely (4), Almost Certain (5)
- **Impact Levels**: Negligible (1), Minor (2), Moderate (3), Major (4), Severe (5)
- **Score**: Likelihood x Impact = 1 to 25

### Risk Thresholds (Policy-Driven)
| Level | Score Range | Response |
|-------|------------|----------|
| LOW | 1-7 | Acceptable with monitoring |
| MEDIUM | 8-14 | Treatment required within 90 days |
| HIGH | 15-19 | Treatment required within 30 days |
| CRITICAL | 20-25 | Immediate treatment required |

### Control Effectiveness Reduction
Controls linked to scenarios automatically reduce residual scores:

| Effectiveness | Likelihood Reduction | Impact Reduction |
|--------------|---------------------|-----------------|
| None | 0 | 0 |
| Weak | -1 | 0 |
| Moderate | -1 | -1 |
| Strong | -2 | -1 |
| Very Strong | -3 | -2 |

---

## Demo Data: ClearStream Payments

The platform ships with a complete demo company pre-loaded across all modules.

### Company Profile
- **Name**: ClearStream Payments Ltd
- **Industry**: Payment Processing (Fintech)
- **Size**: 156 employees
- **Revenue**: EUR 28M
- **Locations**: Dublin (HQ), Berlin, Lisbon
- **Regulatory Scope**: DORA, NIS2, PCI-DSS, ISO 27001, GDPR

### Demo Users (9 accounts)
| Role | Email | Name |
|------|-------|------|
| CEO | ceo@clearstream.ie | Fiona Murphy |
| CTO | cto@clearstream.ie | Lars Becker |
| CISO | ciso@clearstream.ie | Siobhan O'Brien |
| CFO | cfo@clearstream.ie | Dieter Schneider |
| DPO | dpo@clearstream.ie | Ana Costa |
| ISMS Manager | isms@clearstream.ie | Roisin Kelly |
| Security Lead | security@clearstream.ie | Markus Weber |
| Compliance Officer | compliance@clearstream.ie | Sofia Ferreira |
| Risk Analyst | risk@clearstream.ie | Cian Doyle |

**Password**: `password123` (all accounts)

### Demo Data Volume
- 6 departments
- 3 office locations
- 40 security controls (ISO 27001 Annex A)
- 15 risks with 30 scenarios
- 20+ IT assets (servers, databases, cloud services)
- 15 security incidents (various severity/status)
- 12 policy documents
- 50+ evidence items
- 5 nonconformities with CAP workflow
- 4 IT changes
- KRI and control metric history for dashboard charts
- 60 risk calculation history entries
- Agentic AI data: 4 schedules, 10 tasks, 2 council sessions, 12 pending actions

Additionally, **32 risks and 94 scenarios** from the GRC risk catalogue are seeded separately covering all 4 frameworks.

---

## Deployment

### Docker Compose (6 services)

| Service | Image | Purpose | Memory |
|---------|-------|---------|--------|
| db | PostgreSQL 16 Alpine | Database | 1 GB |
| migrate | Node 20 | Schema migration + seed | 2 GB |
| server | Node 20 Slim | NestJS REST API | 512 MB |
| gateway | Node 20 Alpine | Fastify + Anthropic Messages API | 512 MB |
| web | Nginx 1.27 Alpine | React SPA | 256 MB |
| caddy | Caddy 2 Alpine | Reverse proxy | 256 MB |

### Quick Start
```bash
git clone https://github.com/riskreadyeu/riskready-community.git
cd riskready-community
cp .env.example .env    # Edit: set POSTGRES_PASSWORD, JWT_SECRET
docker compose up -d    # ~2 minutes to build and seed
# Open http://localhost:9380
# Login: ciso@clearstream.ie / password123
```

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| POSTGRES_PASSWORD | Yes | — | Database password |
| JWT_SECRET | Yes | — | JWT signing secret (min 32 chars) |
| ANTHROPIC_API_KEY | No | — | Enables AI gateway features |
| HOST_PORT | No | 9380 | Web UI port |
| CORS_ORIGIN | No | * | CORS allowed origin |
| COUNCIL_ENABLED | No | true | Enable AI Agents Council |

---

## Security

- **JWT authentication** with configurable token TTL (default: 15 minutes)
- **Refresh sessions** with 14-day expiry, revocation, and device tracking
- **Failed login tracking** with account lockout
- **Comprehensive audit trail** on all entity changes (actor, timestamp, payload)
- **CORS configuration** for production deployments
- **Caddy reverse proxy** for TLS termination and request filtering
- **Human-in-the-loop**: every AI action requires explicit human approval before execution

---

## Architecture

```
                    Claude Desktop / Claude Code
                              |
                         MCP Protocol
                              |
                    ┌─────────┴─────────┐
                    │   Fastify Gateway  │
                    │  (Agent SDK + SSE) │
                    └─────────┬─────────┘
                              |
              ┌───────────────┼───────────────┐
              |               |               |
        ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
        │ 9 MCP     │  │ AI Council│  │ Scheduler  │
        │ Servers   │  │ (6 agents)│  │ + Workflows│
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              |               |               |
              └───────────────┼───────────────┘
                              |
                    ┌─────────┴─────────┐
                    │  NestJS REST API  │
                    │   (70 controllers)│
                    └─────────┬─────────┘
                              |
                    ┌─────────┴─────────┐
                    │   PostgreSQL 16   │
                    │  (120 models)     │
                    └───────────────────┘

                    ┌───────────────────┐
                    │   React Web App   │
                    │  (127 routes)     │
                    └───────────────────┘
```

---

## What's NOT in Community Edition

The following are available in the **Business Edition**:

- Risk Appetite and Tolerance Cascade
- Loss Magnitude Catalogue
- Supply Chain Risk Management
- Business Continuity Management (BCM/BIA)
- Vulnerability Management
- Application Security Posture
- External Requirements Mapping
- Multi-tenant SaaS deployment
- SSO / SAML / OIDC authentication
- Advanced reporting and exports
- Slack and Discord channel integrations
- Priority support and SLA

---

*RiskReady Community Edition is licensed under AGPL-3.0.*
