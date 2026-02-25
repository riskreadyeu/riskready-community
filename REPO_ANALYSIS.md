# RiskReady Community Edition — Repository Analysis

> Generated: 2026-02-25

## 1. Executive Summary

**RiskReady Community Edition** is an open-source **Governance, Risk, and Compliance (GRC)** platform with an autonomous AI Agents Council. It is the first open-source GRC tool to ship 9 MCP (Model Context Protocol) servers exposing 250+ tools, scheduled autonomous workflows, and multi-agent deliberation — all with a human-in-the-loop approval model.

The platform targets regulated organisations (fintech, financial services, critical infrastructure) operating under frameworks such as **ISO 27001:2022**, **DORA**, **NIS2**, and **SOC 2**.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend API** | NestJS (TypeScript) | 11.1.x |
| **Frontend** | React + Vite + TailwindCSS | React 18, Vite 5, Tailwind 3.4 |
| **Database** | PostgreSQL | 16 (Alpine) |
| **ORM** | Prisma | 5.19 |
| **AI Gateway** | Fastify + Claude Agent SDK | Fastify 5.2, Agent SDK 0.2.42 |
| **AI Model** | Anthropic Claude (via Agent SDK) | — |
| **MCP Protocol** | @modelcontextprotocol/sdk | stdio transport |
| **Reverse Proxy** | Caddy | 2 (Alpine) |
| **Containerisation** | Docker Compose | — |
| **CI/CD** | GitHub Actions | Node 22 |
| **Security Scanning** | CodeQL, npm audit, Dependabot | — |
| **Testing** | Jest (server), Vitest (MCP + gateway), Playwright (e2e) | — |
| **Build** | SWC (server), Vite (web), tsx (gateway) | — |

### Notable Dependencies

- **Backend**: bcryptjs, helmet, passport-jwt, class-validator, zod, xss
- **Frontend**: Radix UI primitives, Recharts, React Router, Leaflet (maps), @xyflow/react (flow diagrams), DnD Kit, cmdk (command palette), DOMPurify
- **Gateway**: @anthropic-ai/claude-agent-sdk, @slack/bolt, discord.js, pino (logging)

---

## 3. Architecture Overview

```
                    Internet
                       │
                   ┌───▼───┐
                   │ Caddy  │  :9380
                   │ Proxy  │
                   └───┬───┘
                ┌──────┴──────┐
                │             │
           /api/*        Everything else
                │             │
         ┌──────▼──────┐ ┌───▼───┐
         │   NestJS    │ │ React │
         │   Server    │ │  SPA  │
         │   :3000     │ │  :80  │
         └──────┬──────┘ └───────┘
                │
         ┌──────▼──────┐
         │  PostgreSQL  │
         │    :5432     │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  AI Gateway  │
         │  (Fastify)   │
         │   :3100      │
         └──────┬──────┘
                │
    ┌───────────┴───────────┐
    │   9 MCP Servers       │
    │   (stdio processes)   │
    └───────────────────────┘
```

### Services (docker-compose.yml)

| Service | Purpose | Memory Limit |
|---------|---------|-------------|
| `db` | PostgreSQL 16 database | 1 GB |
| `migrate` | Prisma migration runner (run-once) | 2 GB |
| `server` | NestJS REST API | 512 MB |
| `gateway` | AI Gateway (Fastify) | 512 MB |
| `web` | React SPA (static, served by internal web server) | 256 MB |
| `caddy` | Reverse proxy, TLS termination | 256 MB |

**Networks**: `frontend` (caddy ↔ web) and `backend` (all services).

**Volumes**: `postgres_data`, `evidence_data`, `caddy_data`, `caddy_config`.

---

## 4. Repository Structure

```
riskready-community/
├── apps/
│   ├── server/                    # NestJS backend API
│   │   ├── prisma/
│   │   │   ├── schema/            # 15 Prisma schema files (multi-file schema)
│   │   │   ├── migrations/        # 18 migrations (Dec 2025 – Feb 2026)
│   │   │   └── seed/              # Demo data seeders (per-module)
│   │   └── src/                   # NestJS modules
│   ├── web/                       # React frontend
│   │   └── src/
│   │       ├── pages/             # Route-based page components
│   │       ├── components/        # Domain + shared components
│   │       ├── contexts/          # Auth, org, user contexts
│   │       ├── hooks/             # Custom React hooks
│   │       └── lib/               # API clients, utilities
│   ├── mcp-server-controls/       # 68 tools (30 query, 38 mutation)
│   ├── mcp-server-risks/          # 33 tools (22 query, 11 mutation)
│   ├── mcp-server-itsm/           # 40 tools (25 query, 15 mutation)
│   ├── mcp-server-organisation/   # 32 tools (19 query, 13 mutation)
│   ├── mcp-server-policies/       # 25 tools (14 query, 11 mutation)
│   ├── mcp-server-incidents/      # 19 tools (11 query, 8 mutation)
│   ├── mcp-server-evidence/       # 16 tools (10 query, 6 mutation)
│   ├── mcp-server-audits/         # 15 tools (8 query, 7 mutation)
│   └── mcp-server-agent-ops/      # 7 tools (7 query, agent operations)
├── gateway/                       # AI Gateway (Fastify)
│   └── src/
│       ├── agent/                 # Agent runner, skill registry, block extractor
│       ├── council/               # Council orchestrator, classifier, prompts
│       ├── router/                # Message routing to MCP servers
│       ├── scheduler/             # Cron-based autonomous task scheduling
│       ├── memory/                # Memory persistence, search, distillation
│       ├── channels/              # Slack, Discord, internal adapters
│       └── queue/                 # Priority-based message queue
├── infra/
│   └── caddy/Caddyfile           # Reverse proxy configuration
├── packages/                      # Shared packages (minimal)
├── documentation/                 # Comprehensive docs (7 guides)
│   └── mcp-servers/              # Per-server tool documentation
├── screenshots/                   # App screenshots for README
├── .github/
│   ├── workflows/ci.yml          # Build + test pipeline
│   ├── workflows/codeql.yml      # Security scanning
│   └── dependabot.yml            # Dependency updates
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Database Schema

The database uses **Prisma multi-file schema** (15 `.prisma` files) with **60+ models** covering all GRC domains.

### 5.1 Core / Auth

| Model | Purpose |
|-------|---------|
| `User` | Central user entity, linked to all domain modules |
| `RefreshSession` | JWT refresh token management |
| `AuditEvent` | System-wide audit trail |

### 5.2 Organisation (16+ models)

| Model | Purpose |
|-------|---------|
| `OrganisationProfile` | Core org with GRC calibration factors (F2/F3), regulatory profiles |
| `Department` | Hierarchical department structure |
| `Location` | Physical locations with security & IT details |
| `BusinessProcess` | BIA status, RTO/RPO/MTD tracking |
| `ExternalDependency` | Vendor/third-party SLA tracking |
| `SecurityCommittee` | Committee governance |
| `CommitteeMeeting` | Meetings with decisions, action items, attendance |
| `ProductService` | Products/services lifecycle |
| `TechnologyPlatform` | Tech platforms with vendor info |
| `InterestedParty` | Stakeholder power/interest matrix |
| `ContextIssue` | ISO 27001 context issues |
| `KeyPersonnel` | ISMS roles with backups |
| `ApplicableFramework` | ISO 27001, SOC 2, NIS2, DORA frameworks |
| `RegulatoryEligibilitySurvey` | DORA/NIS2 eligibility surveys |

### 5.3 Controls

| Model | Purpose |
|-------|---------|
| `Control` | ISO 27001 controls with multi-framework mapping, effectiveness tests, metrics |

Key enums: `ControlFramework`, `ImplementationStatus`, `TestFrequency`, `TestResult`, `RAGStatus`

### 5.4 Risks (12+ models)

| Model | Purpose |
|-------|---------|
| `Risk` | Risk register entries |
| `RiskScenario` | 10-state lifecycle (DRAFT → CLOSED), factor-based scoring (F1-F6, I1-I5) |
| `RiskScenarioAsset` | Links scenarios to ITSM assets |
| `RiskScenarioControl` | Links scenarios to controls (F2 calculation) |
| `RiskCalculationHistory` | Immutable calculation audit trail |
| `RiskEventLog` | Event sourcing for state changes |
| `ToleranceEvaluation` | Tolerance threshold evaluations |
| `KeyRiskIndicator` | KRI monitoring with thresholds |
| `RiskToleranceStatement` | Risk acceptance thresholds |
| `TreatmentPlan` / `TreatmentAction` | Treatment plans with tracked actions |

### 5.5 Policies (17+ models)

| Model | Purpose |
|-------|---------|
| `PolicyDocument` | Document lifecycle management |
| `DocumentVersion` | Version history with diffs |
| `DocumentReview` | Scheduled/triggered reviews |
| `DocumentApprovalWorkflow` / `ApprovalStep` | Multi-step approval chains |
| `DocumentChangeRequest` | Change management with impact assessment |
| `DocumentException` | Policy exceptions with review cycles |
| `DocumentAcknowledgment` | User acknowledgments with reminders |
| `DocumentSection` / `DocumentSectionTemplate` | Structured document content |

### 5.6 Evidence

| Model | Purpose |
|-------|---------|
| `Evidence` | Central evidence repository (EVD-YYYY-NNNN) |
| `EvidenceRequest` | Evidence requests from stakeholders |
| 8 junction tables | Links evidence to controls, risks, incidents, policies, assets, changes, nonconformities, treatments |

### 5.7 Audits

| Model | Purpose |
|-------|---------|
| `Nonconformity` | Findings with CAP workflow (DRAFT → VERIFIED_EFFECTIVE → CLOSED) |

Sources: TEST, INTERNAL_AUDIT, EXTERNAL_AUDIT, CERTIFICATION_AUDIT, INCIDENT, etc.

### 5.8 Incidents (9+ models)

| Model | Purpose |
|-------|---------|
| `Incident` | Incident lifecycle (INC-YYYY-NNN) |
| `IncidentType` / `AttackVector` | Classification (MITRE ATT&CK aligned) |
| `IncidentEvidence` | Evidence with chain of custody |
| `IncidentTimelineEntry` | Incident timeline |
| `IncidentLessonsLearned` | Lessons learned tracking |
| `IncidentScenario` | Materialisations of risk scenarios |

### 5.9 ITSM (7+ models)

| Model | Purpose |
|-------|---------|
| `Asset` | CMDB with 50+ asset types |
| `AssetRelationship` | Dependency/relationship mapping |
| `Change` | Change management with CAB approval |
| `ChangeTemplate` | Reusable change templates |
| `CapacityPlan` | Capacity planning |

### 5.10 AI / Agent Models

| Model | Purpose |
|-------|---------|
| `McpPendingAction` | Human approval queue for AI mutations |
| `AgentTask` | Hierarchical autonomous task tracking |
| `AgentSchedule` | Cron-based scheduling |
| `CouncilSession` | Multi-agent deliberation sessions |
| `CouncilOpinion` | Individual council member opinions |
| `ChatConversation` / `ChatMessage` | Conversation persistence |
| `Memory` | Agent memory (PREFERENCE, CONTEXT, KNOWLEDGE) |
| `GatewayConfig` | AI Gateway configuration |
| `AuditLog` | Audit log |

---

## 6. AI Gateway Architecture

### 6.1 Message Flow

1. **User message** → Router classifies by keywords/domain
2. **Router** selects relevant MCP servers (skills)
3. **Agent Runner** executes via Claude Agent SDK with selected tools
4. For complex cross-domain queries → **Council Orchestrator** convenes 6 specialist agents
5. All mutations → **McpPendingAction** (approval queue)
6. Streaming responses via **SSE** with tool-call visibility

### 6.2 AI Agents Council

6 specialist agents deliberate in parallel, then a CISO Strategist synthesises:

| Agent | Domain |
|-------|--------|
| Risk Analyst | Risk landscape, KRIs, tolerance breaches |
| Controls Auditor | Control effectiveness, SOA, gap analysis |
| Compliance Officer | Policy alignment, ISO 27001, DORA, NIS2 |
| Incident Commander | Incident patterns, response metrics |
| Evidence Auditor | Evidence coverage, audit readiness |
| CISO Strategist | Cross-domain synthesis (synthesiser role) |

Deliberation patterns: `parallel_then_synthesis`, `sequential_buildup`, `challenge_response`

### 6.3 Autonomous Capabilities

| Capability | Mechanism |
|-----------|-----------|
| Scheduled Workflows | Cron-based (incident response, weekly risk review, control assurance, policy compliance) |
| Event-Driven Triggers | Critical/high severity incidents auto-trigger analysis |
| Approval Feedback Loop | Agent reads reviewer notes, adapts proposals |
| Task Tracking | Persistent hierarchical tasks across sessions |
| Memory | Hybrid search across preferences, context, and knowledge |

### 6.4 Integration Channels

- Internal web chat (primary)
- Slack (@slack/bolt)
- Discord (discord.js)

---

## 7. Backend API (NestJS)

### 7.1 Module Structure

| Module | Key Endpoints |
|--------|--------------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/register` |
| **Controls** | `/api/controls/`, `/api/assessments/`, `/api/soa/`, `/api/scope-items/` |
| **Risks** | `/api/risks/`, `/api/scenarios/`, `/api/treatment-plans/`, `/api/kris/` |
| **Incidents** | `/api/incidents/`, `/api/incident-evidence/`, `/api/incident-timeline/` |
| **Audits** | `/api/nonconformities/` |
| **Policies** | `/api/policies/`, `/api/policy-approvals/`, `/api/policy-reviews/` |
| **Evidence** | `/api/evidence/`, `/api/evidence-requests/`, `/api/evidence-links/` |
| **ITSM** | `/api/assets/`, `/api/changes/`, `/api/capacity-plans/` |
| **Organisation** | `/api/organisation/`, `/api/departments/`, `/api/committees/` |
| **Dashboard** | `/api/dashboard/` |
| **Gateway Config** | `/api/gateway-config/` |
| **MCP Approval** | `/api/mcp-approvals/` |
| **Agent** | `/api/agent-tasks/`, `/api/agent-schedules/` |
| **Health** | `GET /api/health` |

### 7.2 Security

- **Authentication**: JWT (access + refresh tokens), Passport.js
- **Authorisation**: Role-based access via guards
- **Rate Limiting**: @nestjs/throttler
- **Input Validation**: class-validator + class-transformer
- **XSS Protection**: xss sanitisation library
- **Headers**: Helmet.js (security headers)
- **CORS**: Configurable origin
- **Cookie Security**: Configurable domain + secure flag
- **Account Lockout**: Lockout fields in user model (migration 20260222)

### 7.3 Shared Infrastructure

- Exception filters with standardised error responses
- Request context (user, org, tracing)
- Domain event system (@nestjs/event-emitter)
- Scheduled tasks (@nestjs/schedule)
- Logging interceptors

---

## 8. Frontend (React)

### 8.1 Pages / Routes

| Page | GRC Module |
|------|-----------|
| `/controls` | Controls library, command center, assessments, SOA |
| `/risks` | Risk register, scenarios, heatmap, treatment plans |
| `/incidents` | Incident management, timeline, lessons learned |
| `/audits` | Nonconformities, corrective actions |
| `/policies` | Document management, approvals, exceptions |
| `/evidence` | Evidence repository, requests |
| `/itsm` | Assets, changes, capacity |
| `/organisation` | Org profile, departments, committees, processes |
| `/dashboard` | Executive overview |

### 8.2 UI Stack

- **Component Library**: Radix UI primitives (dialogs, dropdowns, tabs, etc.)
- **Styling**: TailwindCSS with class-variance-authority
- **Charts**: Recharts
- **Maps**: Leaflet / React-Leaflet
- **Flow Diagrams**: @xyflow/react
- **Drag & Drop**: DnD Kit
- **Forms**: react-hook-form
- **Command Palette**: cmdk
- **Markdown**: react-markdown with remark-gfm
- **Notifications**: Sonner (toast)
- **Routing**: React Router v6

---

## 9. MCP Server Pattern

Each of the 9 MCP servers follows a consistent pattern:

```
mcp-server-{domain}/
├── src/
│   ├── index.ts        # McpServer setup, tool/resource/prompt registration
│   ├── prisma.ts       # Shared Prisma client
│   └── tools/
│       ├── query-tools.ts     # Read-only operations
│       └── mutation-tools.ts  # Write operations (create pending actions)
├── package.json
└── tsconfig.json
```

**Key patterns:**
- Uses `@modelcontextprotocol/sdk` with `StdioServerTransport` (stdio communication)
- All inputs validated with **Zod** schemas
- Wrapped in `withErrorHandling()` for consistent error responses
- Mutations create `McpPendingAction` records (never mutate directly)
- JSON responses with counts, pagination, and contextual notes
- Anti-hallucination: system prompts enforce data citation, "zero is valid"
- Prisma client symlinked from server module (postinstall script)

---

## 10. CI/CD & DevOps

### 10.1 GitHub Actions Pipelines

**CI Pipeline** (`ci.yml`):
- Triggers: push to `main`, PRs to `main`
- **Server job**: npm ci → audit → tsc → build → jest tests (with Postgres service container)
- **MCP Servers job**: Matrix strategy across 8 servers → npm ci → audit → tsc → vitest
- **Gateway job**: npm ci → audit → tsc → vitest

**CodeQL** (`codeql.yml`):
- JavaScript/TypeScript security scanning
- security-extended query suite
- Runs on push, PRs, weekly schedule

### 10.2 Dependabot

- Weekly npm updates for server, web, gateway
- Monthly Docker image updates
- Weekly GitHub Actions updates
- Production/dev dependency grouping

### 10.3 Docker

- Multi-stage Dockerfiles
- Separate `migrate` service (run-once) for database migrations
- Health checks on all services
- Resource memory limits
- Named volumes for persistence

---

## 11. Demo Data

First deploy auto-populates with **ClearStream Payments Ltd** — a fictional mid-size European fintech:

- 15 risks with 30 scenarios
- 40 ISO 27001 controls
- 12 policies
- 8 incidents
- 20 IT assets
- 5 audit nonconformities
- 20 evidence records
- 6 months of trend data
- 9 demo user accounts (CISO, CEO, CTO, ISMS Manager, etc.)
- 4 agentic AI workflows pre-configured

---

## 12. Key Observations & Notable Patterns

### Strengths

1. **Comprehensive GRC coverage** — All 8 GRC domains with deep models (60+ database entities)
2. **AI-first architecture** — MCP servers provide structured AI access to the entire compliance database
3. **Human-in-the-loop safety** — All AI mutations go through an approval queue before execution
4. **Multi-agent deliberation** — 6 specialist agents + CISO synthesis for complex cross-domain queries
5. **Autonomous but safe** — Scheduled workflows, event triggers, and feedback loops — all gated by approval
6. **Factor-based risk scoring** — Sophisticated F1-F6 likelihood / I1-I5 impact calculation with immutable audit trails
7. **State machines** — Risk scenarios (10 states), CAP workflows, change management all have well-defined state transitions
8. **Regulatory alignment** — ISO 27001:2022, DORA, NIS2, SOC 2 built into the data model
9. **Multi-channel** — Slack, Discord, and web chat adapters
10. **Good CI** — Type checking, auditing, testing, and security scanning across all components

### Areas for Consideration

1. **No linting** — No ESLint/Prettier configuration visible in CI or package.json
2. **E2E tests present but not in CI** — Playwright is configured in the web app but not run in the CI pipeline
3. **Single-org model** — The schema appears oriented toward a single organisation per deployment
4. **No rate limiting on gateway** — The NestJS server has throttling, but the AI Gateway (Fastify) does not appear to have rate limiting
5. **Secrets in demo seed** — Demo passwords (`password123`) are hardcoded in seed data (expected for demos, but worth noting)
6. **No monitoring/observability stack** — No Prometheus, Grafana, or APM integration (Pino logging only)
7. **Agent SDK version** — Using `@anthropic-ai/claude-agent-sdk@0.2.42` which may be pre-1.0
8. **No RBAC in AI gateway** — The gateway connects directly to the database; access control is at the NestJS API level

---

## 13. License

**AGPL-3.0** — GNU Affero General Public License v3.0. All modifications must be open-sourced if the software is offered as a network service.
