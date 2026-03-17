# RiskReadyEU Architecture Audit Report

**Project:** RiskReadyEU
**Location:** /path/to/riskready-community
**Audit Date:** January 8, 2026
**Auditor:** PAI Architecture Analysis

---

## Executive Summary

RiskReadyEU is a comprehensive **Governance, Risk, and Compliance (GRC) platform** built as a monorepo with a NestJS backend and React/Vite frontend. The system provides enterprise-grade risk management, controls assessment, policy management, incident response, business continuity, and supply chain risk capabilities.

**Key Findings:**
- Well-structured monorepo with clear separation of concerns
- 13 backend modules with varying levels of completeness
- 174+ frontend pages across 12 major functional areas
- PostgreSQL database with Prisma ORM using multi-file schema organization
- One module (Incidents) has incomplete service layer implementation

---

## 1. Project Structure Analysis

### 1.1 Folder Structure (3 Levels Deep)

```
riskready-community/
├── apps/
│   ├── server/                    # NestJS Backend
│   │   ├── dist/                  # Compiled output
│   │   ├── prisma/
│   │   │   ├── migrations/        # Database migrations
│   │   │   ├── schema/            # Multi-file Prisma schema (14 files)
│   │   │   ├── seed/              # Seed data scripts
│   │   │   └── seeds/             # Additional seed data
│   │   ├── scripts/               # Utility scripts
│   │   └── src/                   # Source code (13 modules)
│   │       ├── applications/
│   │       ├── audits/
│   │       ├── auth/
│   │       ├── bcm/
│   │       ├── config/
│   │       ├── controls/
│   │       ├── evidence/
│   │       ├── health/
│   │       ├── incidents/
│   │       ├── itsm/
│   │       ├── organisation/
│   │       ├── policies/
│   │       ├── prisma/
│   │       ├── risks/
│   │       ├── shared/
│   │       └── supply-chain/
│   └── web/                       # React/Vite Frontend
│       └── src/
│           ├── components/        # 17 component folders
│           ├── hooks/             # Custom React hooks
│           ├── lib/               # API clients & utilities (22 files)
│           └── pages/             # 174+ page components
├── docs/                          # Documentation
│   ├── architecture/
│   ├── bcm-module/
│   ├── controls-module/
│   ├── evidence-module/
│   ├── itsm-module/
│   ├── organisation-module/
│   ├── policy-module/
│   ├── risk-module/
│   ├── risks-module/
│   └── supply-chain-module/
├── infra/
│   └── caddy/                     # Reverse proxy config
├── scripts/
│   └── templates/                 # Code generation templates
└── _temp/                         # Temporary/legacy files
```

### 1.2 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend Framework** | NestJS | ^11.1.11 |
| **Runtime** | Node.js | - |
| **Database** | PostgreSQL | - |
| **ORM** | Prisma | ^5.19.1 |
| **Authentication** | Passport + JWT | ^0.7.0 / ^4.0.1 |
| **Frontend Framework** | React | ^18.3.1 |
| **Build Tool** | Vite | ^5.4.1 |
| **Styling** | Tailwind CSS | ^3.4.10 |
| **UI Components** | Radix UI | Various |
| **Charts** | Recharts | ^2.15.4 |
| **Routing** | React Router DOM | ^6.28.0 |
| **Forms** | React Hook Form | ^7.69.0 |
| **Language** | TypeScript | ^5.5.4 |

### 1.3 Dependencies Analysis

#### Backend Dependencies (apps/server/package.json)

| Package | Purpose |
|---------|---------|
| `@nestjs/common`, `@nestjs/core` | NestJS framework core |
| `@nestjs/platform-express` | Express HTTP adapter |
| `@nestjs/jwt`, `@nestjs/passport` | Authentication layer |
| `@nestjs/event-emitter` | Event-driven architecture |
| `@nestjs/schedule` | Scheduled tasks/cron jobs |
| `@prisma/client` | Database ORM client |
| `bcryptjs` | Password hashing |
| `class-validator`, `class-transformer` | DTO validation |
| `zod` | Schema validation |
| `cookie-parser` | Cookie handling |
| `rxjs` | Reactive extensions |

#### Frontend Dependencies (apps/web/package.json)

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@radix-ui/*` (14 packages) | Accessible UI primitives |
| `@dnd-kit/*` | Drag and drop functionality |
| `@xyflow/react` | Flow diagram visualization |
| `recharts` | Data visualization/charts |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `cmdk` | Command palette |
| `react-hook-form` | Form state management |
| `react-day-picker` | Date selection |
| `date-fns` | Date utilities |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Styling utilities |

### 1.4 Module Organization Pattern

The project follows a **feature-based modular architecture**:

```
module/
├── module.module.ts          # NestJS module definition
├── controllers/
│   └── *.controller.ts       # HTTP endpoints
├── services/
│   └── *.service.ts          # Business logic
├── dto/                      # Data transfer objects (optional)
├── types/                    # TypeScript types (optional)
└── utils/                    # Module-specific utilities (optional)
```

**Key Patterns:**
- Global `PrismaModule` provides database access to all modules
- Global `EventEmitterModule` enables event-driven communication
- Forward references used for circular dependencies (e.g., Applications <-> Audits)
- Services exported for inter-module dependency injection

---

## 2. Module Inventory

### 2.1 Backend Modules Summary

| Module | Controllers | Services | DTOs | Completeness | Notes |
|--------|-------------|----------|------|--------------|-------|
| **Risks** | 15 | 23 | - | **Complete** | Most comprehensive; event-driven, state machine |
| **Controls** | 7 | 13 | 5 | **Complete** | Includes DTOs, gap analysis, SOA management |
| **Organisation** | 23 | 24 | - | **Complete** | Extensive entity management, governance |
| **Policies** | 9 | 10 | - | **Complete** | Document lifecycle, approvals, audit trail |
| **Incidents** | 7 | 3 | - | **Incomplete** | Missing 4 service implementations |
| **Applications** | 5 | 6 | - | **Complete** | Multiple assessment frameworks (ISRA/BIA/TVA/SRL) |
| **Supply-Chain** | 6 | 5 | - | **Complete** | Vendor management, contracts, assessments |
| **ITSM** | 8 | 7 | - | **Complete** | Asset management, change management |
| **BCM** | 6 | 5 | - | **Complete** | Business continuity, BIA, plan activation |
| **Evidence** | 4 | 4 | - | **Complete** | Evidence tracking, requests, migration |
| **Audits** | 3 | 3 | - | **Complete** | Non-conformity management, CAP workflow |
| **Auth** | 1 | 1 | - | **Complete** | JWT-based authentication |
| **Health** | 1 | 0 | - | **Minimal** | Health check endpoint only |

### 2.2 Detailed Module Breakdown

#### Risks Module (Most Complex)
**Controllers:** risk, risk-scenario, treatment-plan, kri, rts, birt, governance, governance-role, risk-lifecycle, risk-state-machine, risk-aggregation, risk-scheduler, risk-notification, threat-catalog, control-risk-integration

**Services:** Core services + calculation, tolerance engine, assessment versioning, review scheduler, state machine, authorization, event bus, aggregation, notification, scheduler, history, and more

**Special Features:**
- Event-driven architecture with EventEmitterModule
- Scheduled jobs with ScheduleModule
- Complex state machine for risk transitions
- Comprehensive scoring and tolerance engine
- Risk-control integration

#### Controls Module
**Controllers:** control, capability, assessment, metric, soa, effectiveness-test, cross-reference

**Services:** Core + reporting, gap analysis, SOA entry management

**Special Features:**
- Dedicated DTO layer (5 files)
- Threshold-based metrics parsing
- Gap analysis and reporting services
- Framework cross-reference mapping

#### Organisation Module (Most Entities)
**Controllers:** 23 covering org structure, personnel, governance, meetings, compliance, context

**Key Entity Groups:**
- Organizational Structure: departments, units, locations
- Personnel: executives, security champions, key personnel
- Governance: committees, meetings, decisions, action items
- Compliance: regulators, regulatory eligibility
- Context: business processes, dependencies, interested parties, frameworks

#### Incidents Module (Incomplete)
**Controllers:** incident, timeline, evidence, communication, lessons-learned, notification, reference-data

**Services:** Only 3 implemented (incident, classification, notification)

**Missing Services:**
- incident-timeline.service.ts
- incident-evidence.service.ts
- incident-communication.service.ts
- incident-lessons-learned.service.ts

### 2.3 Frontend Module Summary

| Module | Pages | Components | API File |
|--------|-------|------------|----------|
| **Risks** | 16 | 36 | risks-api.ts (49KB) |
| **Controls** | 20 | 52 | controls-api.ts (23KB) |
| **Organisation** | 51 | 1 | organisation-api.ts (48KB) |
| **Policies** | 13 | 17 | policies-api.ts (22KB) |
| **Incidents** | 12 | 1 | incidents-api.ts (19KB) |
| **Supply Chain** | 18 | 1 | supply-chain-api.ts (17KB) |
| **ITSM** | 12 | 2 | itsm-api.ts (22KB) |
| **BCM** | 15 | 3 | bcm-api.ts (16KB) |
| **Evidence** | 4 | 4 | evidence-api.ts (20KB) |
| **Applications** | 3 | 1 | applications-api.ts (17KB) |
| **Audits** | 2 | 4 | audits-api.ts (10KB) |
| **Demo NIS2** | 8 | 1 | - |

**Total Frontend:** 174+ pages, 170+ components, 200+ routes

---

## 3. Configuration Review

### 3.1 Environment Configuration

**Location:** `apps/server/.env`

```env
DATABASE_URL=postgresql://danielminda@localhost:5432/riskready?schema=public
JWT_SECRET=dev-secret-change-in-production
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_SESSION_TTL_DAYS=14
PORT=4000
```

**Issues Identified:**
1. No `.env.example` file exists for documentation
2. JWT_SECRET contains a placeholder value with reminder comment
3. Missing configuration for:
   - Log level
   - CORS allowed origins (currently `origin: true` - allows all)
   - Rate limiting
   - File upload limits

### 3.2 TypeScript Configuration

**Backend (apps/server/tsconfig.json):**
- Target: ES2022
- Module: CommonJS
- Decorators enabled (required for NestJS)
- Strict mode enabled
- Path alias: `@/*` -> `src/*`

**Frontend (apps/web/tsconfig.json):**
- Path alias: `@/*` -> `src/*`
- Vite plugin handles React JSX transformation

### 3.3 Build Configuration

**Vite (apps/web/vite.config.ts):**
- Dev server: localhost:5173
- API proxy: `/api` -> `http://127.0.0.1:4000`
- Manual chunks for optimized bundling:
  - react-vendor
  - ui-vendor (Radix components)
  - chart-vendor (Recharts)

### 3.4 Database Configuration

**Prisma Schema Organization:**
- Uses `prismaSchemaFolder` preview feature
- Multi-file schema in `prisma/schema/`:

| Schema File | Purpose | Size |
|-------------|---------|------|
| base.prisma | Generator & datasource config | 181B |
| auth.prisma | Users, sessions, permissions | 20KB |
| organisation.prisma | Org structure entities | 39KB |
| controls.prisma | Control framework | 45KB |
| risks.prisma | Risk management | 27KB |
| risk-governance.prisma | Risk governance | 7KB |
| policies.prisma | Policy documents | 24KB |
| audits.prisma | Audit/NC management | 6KB |
| incidents.prisma | Incident response | 30KB |
| applications.prisma | Application security | 26KB |
| supply-chain.prisma | Vendor management | 27KB |
| itsm.prisma | IT service management | 22KB |
| bcm.prisma | Business continuity | 9KB |
| evidence.prisma | Evidence management | 20KB |

**Total Schema Size:** ~290KB across 14 files

---

## 4. Issues & Recommendations

### 4.1 Critical Issues

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| 1 | **Incomplete Incidents Module** | `apps/server/src/incidents/` | Implement missing services for timeline, evidence, communication, lessons-learned |
| 2 | **Hardcoded JWT Secret** | `.env` | Use environment-specific secrets; add validation |
| 3 | **Missing .env.example** | Root | Create template for required environment variables |

### 4.2 Moderate Issues

| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| 4 | CORS allows all origins | `main.ts` | Restrict to specific origins in production |
| 5 | Missing DTOs in most modules | Server modules | Add DTOs for input validation consistency |
| 6 | Dashboard services missing | Various modules | Add dedicated dashboard services or document pattern |
| 7 | No rate limiting configured | `main.ts` | Add throttler guard for API protection |

### 4.3 Suggestions

| # | Suggestion | Benefit |
|---|------------|---------|
| 8 | Add API documentation (Swagger) | Developer experience, client generation |
| 9 | Add health check for database | Better monitoring/deployment |
| 10 | Consolidate seed scripts | Cleaner data initialization |
| 11 | Add test coverage | Quality assurance |
| 12 | Add logging configuration | Debugging, audit trail |

---

## 5. Architecture Diagrams

### 5.1 High-Level Architecture

```
+------------------------------------------------------------------+
|                        Frontend (React/Vite)                      |
|  +---------+ +---------+ +---------+ +---------+ +---------+     |
|  |  Risks  | |Controls | | Policies| |Incidents| |   ...   |     |
|  +----+----+ +----+----+ +----+----+ +----+----+ +----+----+     |
|       +----------+----------+----------+----------+               |
|                              | API calls (/api/*)                 |
+------------------------------+------------------------------------+
                               |
                    +----------v----------+
                    |   Vite Dev Proxy    |
                    |   (Port 5173)       |
                    +----------+----------+
                               |
+------------------------------+------------------------------------+
|                    Backend (NestJS)                               |
|                    (Port 4000)                                    |
|  +--------------------------------------------------------------+ |
|  |                    Global Modules                             | |
|  |  +-------------+  +-----------------+  +--------------+       | |
|  |  |PrismaModule |  |EventEmitterModule|  | AuthModule   |      | |
|  |  +-------------+  +-----------------+  +--------------+       | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  +---------+ +---------+ +---------+ +---------+ +---------+     |
|  |  Risks  | |Controls | | Policies| |  ITSM   | |   BCM   |     |
|  +---------+ +---------+ +---------+ +---------+ +---------+     |
|  |  Audits | |Incidents| |Evidence | |  Apps   | |SupplyChain|   |
|  +---------+ +---------+ +---------+ +---------+ +---------+     |
|  |   Org   | | Health  | |         | |         | |         |     |
|  +---------+ +---------+ +---------+ +---------+ +---------+     |
+------------------------------+------------------------------------+
                               |
                    +----------v----------+
                    |   PostgreSQL        |
                    |   (Port 5432)       |
                    |   Database: riskready|
                    +---------------------+
```

### 5.2 Module Dependency Graph

```
                         +--------------+
                         |  AppModule   |
                         +------+-------+
                                |
        +-----------------------+-----------------------+
        |                       |                       |
        v                       v                       v
+---------------+      +---------------+      +---------------+
| PrismaModule  |      |EventEmitterMod|      |  AuthModule   |
|   (Global)    |      |    (Global)   |      |               |
+-------+-------+      +-------+-------+      +---------------+
        |                      |
        |    Injected to all modules
        v                      v
+-------------------------------------------------------------+
|                    Feature Modules                           |
|  +---------+   +---------+   +---------+   +---------+      |
|  |  Risks  |<--|Controls |   | Policies|   |  Audits |      |
|  |(Events) |   |         |   |         |   |         |      |
|  +----+----+   +---------+   +---------+   +----^----+      |
|       |                                         |            |
|       | Risk-Control Integration                |            |
|       +-----------------------------------------+            |
|                                                              |
|  +---------+   +---------+   +---------+   +---------+      |
|  |   Org   |   |Incidents|   |Evidence |   |   Apps  |<-----+
|  |         |   |         |   |         |   |(forward)|      |
|  +---------+   +---------+   +---------+   +---------+      |
|                                                              |
|  +---------+   +---------+   +---------+   +---------+      |
|  |  ITSM   |   |   BCM   |   |SupplyChain|  | Health  |     |
|  +---------+   +---------+   +---------+   +---------+      |
+-------------------------------------------------------------+
```

---

## 6. Appendix

### A. File Counts by Area

| Area | Files | Lines (Est.) |
|------|-------|--------------|
| Backend Controllers | ~92 | ~15,000 |
| Backend Services | ~110 | ~25,000 |
| Frontend Pages | ~174 | ~35,000 |
| Frontend Components | ~170 | ~30,000 |
| Prisma Schema | 14 | ~2,500 |
| API Client Files | 15 | ~8,000 |
| **Total** | **~575** | **~115,000** |

### B. API Route Patterns

All routes prefixed with `/api/`

| Module | Base Route | Example Endpoints |
|--------|-----------|-------------------|
| Auth | `/auth` | POST /login, POST /refresh |
| Risks | `/risks` | GET /, POST /, GET /:id, PATCH /:id |
| Controls | `/controls` | GET /, POST /, GET /:id/capabilities |
| Organisation | `/organisation` | GET /departments, POST /locations |
| Policies | `/policies` | GET /documents, POST /documents/:id/approve |
| Incidents | `/incidents` | GET /, POST /, GET /:id/timeline |
| Supply Chain | `/supply-chain` | GET /vendors, POST /assessments |
| ITSM | `/itsm` | GET /assets, POST /changes |
| BCM | `/bcm` | GET /programs, POST /plans/:id/activate |
| Evidence | `/evidence` | GET /, POST /requests |
| Health | `/health` | GET / |

### C. Database Entity Count (Estimated)

Based on Prisma schema analysis:
- **Auth:** ~8 models (User, Session, Role, Permission, etc.)
- **Organisation:** ~25 models
- **Controls:** ~15 models
- **Risks:** ~12 models
- **Policies:** ~10 models
- **Incidents:** ~12 models
- **Applications:** ~10 models
- **Supply Chain:** ~10 models
- **ITSM:** ~8 models
- **BCM:** ~6 models
- **Evidence:** ~5 models
- **Total:** ~120+ database models

---

*Report generated by PAI Architecture Analysis*
*End of Audit Report*
