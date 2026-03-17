# Organisation MCP Server

Model Context Protocol server exposing RiskReady organisation management capabilities: profiles, departments, locations, business processes, personnel, stakeholders, frameworks, governance structures, catalogs, and ISO 27001 context analysis.

## Key Numbers

| Metric | Count |
|--------|-------|
| Query Tools | 34 |
| Mutation Tools | 6 |
| Resources | 4 |
| Prompts | 3 |

## Core Design Principle

**Read-First, Propose-Write Architecture**: All query operations execute directly against the database. All create/update/delete operations go through the approval queue via `propose_*` tools, creating pending actions that require human review before execution.

## Documentation

- [Tool Reference](./tool-reference.md) - Complete documentation for all 40 tools
- [Resources & Prompts](./resources-prompts.md) - Guidance resources and workflow prompts

## Quick Start

```bash
cd apps/mcp-server-organisation
npm install
npm run build
npm start
```

## Tech Stack

- Model Context Protocol SDK
- TypeScript
- Prisma ORM
- Zod validation
- stdio transport

## Key Capabilities

### Organisation Profile Management
- Retrieve organisation profiles with calibration, regulatory, and ISMS scope data
- Query risk calculation baselines (F2/F3 factors)
- Access DORA/NIS2 compliance configurations
- View ISO 27001 scope definitions and certification status

### Organisational Structure
- Browse departments with hierarchies
- View organisational units
- Query locations and facilities
- Track physical and logical boundaries

### Business Process Management
- List business processes with BIA status
- Track process criticality and BCP enablement
- View BIA assessment history
- Monitor process ownership and management

### Personnel & Roles
- Query executive positions and reporting structures
- View key personnel with ISMS roles
- Track security champions by department
- Monitor training completion

### Stakeholder Management
- List interested parties (ISO 27001 Clause 4.2)
- View context issues (ISO 27001 Clause 4.1)
- Track regulators and supervisory authorities
- Assess stakeholder power/interest matrix

### Framework Compliance
- Query applicable frameworks
- View compliance status and percentages
- Access regulatory eligibility surveys (DORA/NIS2)
- Track certification bodies and dates

### Governance Structures
- List security committees
- View committee meetings with attendance
- Track meeting action items
- Monitor overdue actions

### Catalogs
- Browse products and services
- Query technology platforms
- Filter by ISMS scope inclusion
- Track lifecycle stages

### Analysis & Reporting
- Aggregate organisation statistics
- Generate dashboard metrics
- Analyze ISMS scope coverage
- Calculate BIA completion rates

## ISO 27001 Context

This server implements ISO 27001 Clauses 4.1 (Understanding the organization and its context), 4.2 (Understanding the needs and expectations of interested parties), and 4.3 (Determining the scope of the ISMS).

The resources and prompts provide best-practice guidance for conducting context analysis, scope reviews, and governance health checks aligned with ISO 27001:2022 requirements.
