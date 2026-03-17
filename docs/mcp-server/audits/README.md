# Audits MCP Server

ISO 27001-compliant nonconformity register, corrective action plan management, and audit analytics.

## Key Numbers

| Category | Count |
|----------|-------|
| Query Tools | 6 |
| Mutation Tools | 6 |
| Resources | 3 |
| Prompts | 2 |

## Core Design Principle

The Audits MCP server implements ISO 27001 Clause 10.1 (Nonconformity and Corrective Action) requirements. It provides a complete lifecycle for managing nonconformities from identification through verification and closure, with built-in CAP (Corrective Action Plan) workflows, approval processes, and audit trail tracking.

All mutation operations create pending actions that require approval, ensuring proper oversight and control over the NC register.

## Documentation Links

- [Tool Reference](./tool-reference.md) - Complete tool catalog with parameters
- [Resources & Prompts](./resources-prompts.md) - Knowledge resources and AI prompts

## Quick Start

```bash
cd apps/mcp-server-audits
npm install
npm run build
npm start
```

The server connects via stdio and registers with the MCP client automatically.

## Tech Stack

- Model Context Protocol SDK
- Prisma ORM
- PostgreSQL database
- TypeScript
- Zod schema validation

## Key Features

### NC Lifecycle Management
- DRAFT, OPEN, IN_PROGRESS, AWAITING_VERIFICATION, CLOSED status tracking
- Severity classification: MAJOR, MINOR, OBSERVATION
- Multiple source types: tests, audits, incidents, self-assessments
- Category tagging: control failure, documentation, process, technical

### CAP Workflow
- Root cause analysis documentation
- Corrective and preventive action tracking
- Approval workflow: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
- Verification methods: re-test, re-audit, document review, walkthrough
- Target date management and overdue tracking

### Analysis & Reporting
- Dashboard metrics: open, in progress, awaiting verification, overdue
- Statistics by severity, status, CAP status, source, category
- Average days to closure calculation
- NCs grouped by control with severity breakdown

### ISO 27001 Compliance
- ISO clause referencing
- Complete audit trail for all status changes
- Evidence linking to NC records
- Management review readiness reports

## Architecture

The server is organized into four registration modules:

1. **Nonconformity Tools** - Query tools for listing, searching, and retrieving NC records
2. **Analysis Tools** - Statistical analysis and dashboard metrics
3. **Mutation Tools** - Proposal tools for creating and updating NCs and CAPs
4. **Resources** - Static knowledge resources about NC lifecycle and CAP process
5. **Prompts** - AI-assisted root cause analysis and audit readiness reviews
