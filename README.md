<div align="center">

# RiskReady Community Edition

The first open-source GRC platform with 248 AI-ready tools powered by the Model Context Protocol (MCP).
<br />
Connect Claude Code or Claude Desktop to query, analyse, and update your compliance data through natural language.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Issues](https://img.shields.io/github/issues/riskreadyeu/riskready-community)](https://github.com/riskreadyeu/riskready-community/issues)
[![Stars](https://img.shields.io/github/stars/riskreadyeu/riskready-community)](https://github.com/riskreadyeu/riskready-community/stargazers)

</div>

---

## Table of Contents

- [Why RiskReady](#why-riskready)
- [AI Architecture](#ai-architecture)
- [GRC Features](#grc-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
  - [Deployment Guide](#deployment-guide)
  - [User Guide](#user-guide)
  - [AI Assistant Guide](#ai-assistant-guide)
  - [API Reference](#api-reference)
  - [Administration Guide](#administration-guide)
  - [MCP Server Reference](#mcp-server-reference)
- [Development Setup](#development-setup)
- [Business Edition](#business-edition)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Why RiskReady

Traditional GRC tools are form-fillers. RiskReady ships **8 specialised MCP servers** exposing 248 tools that connect Claude directly to your compliance database. Use **Claude Code** or **Claude Desktop** to ask questions in plain English, get answers grounded in your live data, and propose changes that go through a human approval queue before anything is modified.

```
You:    "Which controls failed their last assessment and what's the root cause breakdown?"
Agent:  Queries controls DB --> runs gap analysis --> returns structured table with root causes
```

Every mutation (creating assessments, updating SOA entries, recording test results) is **proposed, not executed** -- a human reviews and approves each action before it touches the database.

---

## AI Architecture

```
User --> AI Gateway (Fastify :3100) --> Claude Agent SDK --> Claude
              |                                                  |
              |         +----------------------------------------+
              |         | tool calls (MCP stdio transport)
              |         v
              +-- mcp-server-controls      (30 query + 38 mutation tools)
              +-- mcp-server-risks         (22 query + 11 mutation tools)
              +-- mcp-server-policies      (14 query + 11 mutation tools)
              +-- mcp-server-organisation  (19 query + 13 mutation tools)
              +-- mcp-server-itsm          (25 query + 15 mutation tools)
              +-- mcp-server-evidence      (10 query +  6 mutation tools)
              +-- mcp-server-audits        ( 8 query +  7 mutation tools)
              +-- mcp-server-incidents     (11 query +  8 mutation tools)
                                           -----------------------------
                                           139 query + 109 mutation = 248 tools
```

| Feature | Description |
|---------|-------------|
| **MCP Servers** | 8 servers spawn as stdio child processes, each with full database access via Prisma |
| **Smart Routing** | Matches your query to relevant servers by keyword and tag |
| **Streaming Responses** | Real-time SSE with tool-call visibility |
| **Approval Queue** | All mutations create pending actions reviewed in the web UI before execution |
| **Anti-Hallucination** | System prompts enforce data citation; zero is a valid answer |

---

## GRC Features

| Module | Capabilities |
|--------|-------------|
| **Risk Management** | Risk register, risk scenarios, key risk indicators, tolerance statements, treatment plans |
| **Controls Framework** | Control library, control assessments, Statement of Applicability, gap analysis |
| **Policy Management** | Document lifecycle, version control, change requests, reviews, exceptions |
| **Incident Management** | Incident tracking, classification, response workflows, lessons learned |
| **Audit Management** | Internal audit planning, nonconformity tracking, corrective actions |
| **Evidence Management** | Evidence collection, file storage, linking to controls and risks |
| **ITSM / Asset Management** | IT asset register, change management, capacity planning, business process mapping |
| **Organisation Management** | Organisational structure, departments, locations, key personnel |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 11 (TypeScript) |
| Frontend | React 18 + Vite + TailwindCSS |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| AI Gateway | Fastify + Claude Agent SDK + 8 MCP Servers |
| Reverse Proxy | Caddy 2 |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/riskreadyeu/riskready-community.git
cd riskready-community

# 2. Create your environment file
cp .env.example .env
# Edit .env and set: POSTGRES_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Start all services (first run takes ~3 minutes to build)
docker compose up -d

# 4. Open http://localhost:9380 and log in
```

### Demo Data (auto-populated)

On first deploy, the database is automatically populated with a realistic demo dataset for **ClearStream Payments Ltd** -- a fictional mid-size European fintech regulated under DORA and NIS2. No manual import needed.

The demo includes: 15 risks with 30 scenarios, 40 ISO 27001 controls, 12 policies, 8 incidents, 20 IT assets, 5 audit nonconformities, 20 evidence records, and 6 months of trend data across all dashboards.

**Demo login credentials:**

| Email | Role | Password |
|-------|------|----------|
| `ciso@clearstream.ie` | CISO (recommended) | `password123` |
| `ceo@clearstream.ie` | CEO | `password123` |
| `cto@clearstream.ie` | CTO | `password123` |
| `isms@clearstream.ie` | ISMS Manager | `password123` |
| `security.lead@clearstream.ie` | IT Security Lead | `password123` |
| `compliance@clearstream.ie` | Compliance Officer | `password123` |
| `risk.analyst@clearstream.ie` | Risk Analyst | `password123` |
| `dpo@clearstream.ie` | Data Protection Officer | `password123` |
| `champion@clearstream.ie` | Security Champion | `password123` |

> The CISO account provides the most complete view of all modules and dashboards.

**Admin account** (configured via `.env`):

| Field    | Value                    |
|----------|--------------------------|
| Email    | Your `ADMIN_EMAIL` value  |
| Password | Your `ADMIN_PASSWORD` value |

> Change these in your `.env` file before deploying to production.

To use AI features, connect the MCP servers to **Claude Code** or **Claude Desktop**. See the [AI Assistant Guide](documentation/AI_ASSISTANT.md) for setup instructions.

> For detailed configuration, production setup, and troubleshooting, see the [Deployment Guide](documentation/DEPLOYMENT.md).

---

## Documentation

### Deployment Guide

**[documentation/DEPLOYMENT.md](documentation/DEPLOYMENT.md)**

Everything you need to get RiskReady running: prerequisites, Docker Compose quick start, environment variable reference, port mappings, volume persistence, production configuration with TLS, AI features setup, verification steps, and troubleshooting.

### User Guide

**[documentation/USER_GUIDE.md](documentation/USER_GUIDE.md)**

Complete walkthrough of the web application for GRC practitioners, CISOs, and compliance officers. Covers all 8 modules: Risk Management, Control Management, Policy Management, Incident Management, Audit Management, Evidence Management, ITSM/Asset Management, and Organisation Management. Includes navigation, executive dashboard, settings, the AI action approval queue, and common UI patterns.

### AI Assistant Guide

**[documentation/AI_ASSISTANT.md](documentation/AI_ASSISTANT.md)**

How the AI architecture works: the 8 MCP servers and their 248 tools, connecting Claude Code and Claude Desktop, example queries for each GRC domain, the human-in-the-loop approval queue, anti-hallucination safeguards, and model selection.

### API Reference

**[documentation/API_REFERENCE.md](documentation/API_REFERENCE.md)**

Full REST API documentation covering all endpoints grouped by module: Authentication, Dashboard, Controls, Assessments, SOA, Risks, Scenarios, Treatment Plans, Policies, Incidents, Audits, Evidence, ITSM, Organisation, Gateway Configuration, and MCP Approvals. Includes request/response formats, query parameters, and status codes.

### Administration Guide

**[documentation/ADMINISTRATION.md](documentation/ADMINISTRATION.md)**

System administration handbook: database backup and recovery, monitoring and health checks, updating and rollback procedures, user management, security hardening checklist, database management, log analysis and debugging, performance tuning, and a service architecture reference.

### MCP Server Reference

**[documentation/mcp-servers/](documentation/mcp-servers/)**

Detailed per-server documentation for all 8 MCP servers with complete tool listings, parameters, and usage examples. The servers can also be used standalone with any MCP-compatible client (Claude Desktop, Claude Code, etc.) by pointing to their `src/index.ts` entry point.

| Server | Tools | Documentation |
|--------|-------|---------------|
| Controls | 68 (30 query, 38 mutation) | [controls.md](documentation/mcp-servers/controls.md) |
| Risks | 33 (22 query, 11 mutation) | [risks.md](documentation/mcp-servers/risks.md) |
| ITSM | 40 (25 query, 15 mutation) | [itsm.md](documentation/mcp-servers/itsm.md) |
| Organisation | 32 (19 query, 13 mutation) | [organisation.md](documentation/mcp-servers/organisation.md) |
| Policies | 25 (14 query, 11 mutation) | [policies.md](documentation/mcp-servers/policies.md) |
| Incidents | 19 (11 query, 8 mutation) | [incidents.md](documentation/mcp-servers/incidents.md) |
| Evidence | 16 (10 query, 6 mutation) | [evidence.md](documentation/mcp-servers/evidence.md) |
| Audits | 15 (8 query, 7 mutation) | [audits.md](documentation/mcp-servers/audits.md) |

---

## Development Setup

```bash
# Start the database
docker compose up db -d

# Install dependencies
cd apps/server && npm install
cd ../web && npm install

# Configure server environment
cd ../server
cp .env.example .env
# Edit .env with your local database URL

# Set up database
npx prisma db push --schema=prisma/schema
npm run prisma:seed

# Start development servers
npm run dev          # Backend on http://localhost:4000
cd ../web && npm run dev  # Frontend on http://localhost:5173
```

---

## Business Edition

The RiskReady Business Edition includes additional modules for larger organisations:

- Risk Appetite and Tolerance Cascade
- Loss Magnitude Catalogue (FAIR methodology)
- Supply Chain Risk Management
- Business Continuity Management (BCM/BIA)
- Vulnerability Management
- Application Security Posture
- External Requirements Mapping (ISO 27001, DORA, NIS2)

Contact us for more information about the Business Edition.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style guidelines, and pull request process.

## Security

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
