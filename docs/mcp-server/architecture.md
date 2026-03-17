# Architecture

## System Overview

```
┌─────────────────┐     stdio      ┌──────────────────┐     Prisma     ┌────────────┐
│   MCP Client    │◄──────────────►│  MCP Server      │◄─────────────►│ PostgreSQL │
│ (Claude Desktop,│                │  (riskready-risk) │               │  (shared)  │
│  Cursor, etc.)  │                └──────────────────┘               └────────────┘
└─────────────────┘                        │                                ▲
                                           │ writes to                      │
                                           │ McpPendingAction               │
                                           ▼                                │
                                   ┌──────────────────┐    executes    ┌────────────┐
                                   │  Approval Queue  │◄──────────────►│  NestJS    │
                                   │  (DB table)      │    mutations   │  Backend   │
                                   └──────────────────┘               └────────────┘
                                           ▲                                │
                                           │ reviews via                    │
                                           │                                ▼
                                   ┌──────────────────┐               ┌────────────┐
                                   │  Human Reviewer  │◄─────────────►│  Web UI    │
                                   │  (GRC analyst)   │               │  (React)   │
                                   └──────────────────┘               └────────────┘
```

## Components

### MCP Server (`apps/mcp-server/`)

A standalone Node.js process that implements the Model Context Protocol. Communicates with MCP clients over stdio. Reads directly from the shared PostgreSQL database via Prisma.

**Responsibilities:**
- Expose risk data as queryable tools
- Serve reference materials as resources
- Provide guided prompts for analytical tasks
- Write mutation proposals to the approval queue

**Does NOT:**
- Open HTTP ports
- Serve a web UI
- Execute mutations directly
- Handle authentication (relies on client-level trust)

### Approval Queue (`McpPendingAction` table)

A database table that acts as a buffer between AI proposals and actual data changes.

**Schema:**
- `id` - CUID primary key
- `actionType` - Enum: `CREATE_RISK`, `CREATE_SCENARIO`, `LINK_CONTROL`, `UPDATE_FACTORS`, `CREATE_TREATMENT`, `TRANSITION_STATE`, `UPDATE_KRI_THRESHOLD`
- `status` - Enum: `PENDING`, `APPROVED`, `REJECTED`
- `summary` - Human-readable description
- `reason` - AI's explanation for the proposal
- `payload` - JSON with mutation details
- `mcpSessionId` - Tracks which MCP session proposed it
- `mcpToolName` - Which tool created the proposal
- `reviewedBy` / `reviewedAt` / `reviewNotes` - Reviewer audit trail
- `resultEntityId` / `resultEntityType` - References to created entities after approval
- `executionError` - Captured if mutation execution fails
- `organisationId` - Multi-tenancy scoping

### NestJS Backend (`apps/server/src/mcp-actions/`)

REST endpoints for the approval queue:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mcp-actions` | List pending actions (filterable by status, actionType) |
| `GET` | `/mcp-actions/stats` | Aggregate counts (pending, approved, rejected) |
| `GET` | `/mcp-actions/:id` | Single action details |
| `GET` | `/mcp-actions/:id/context` | Action + related entities for review |
| `POST` | `/mcp-actions/:id/approve` | Approve and execute in transaction |
| `POST` | `/mcp-actions/:id/reject` | Reject with notes |

Approval execution runs inside a database transaction. If the mutation fails, the error is captured and the action remains reviewable.

### Web UI (`apps/web/src/pages/mcp/`)

Two pages for human review:

- **McpApprovalsPage** - Queue dashboard with filters, stats cards, and bulk actions
- **McpApprovalDetailPage** - Single action detail with context-aware change views (before/after comparisons for factor updates, threshold changes, etc.)

## Design Decisions

### Why stdio transport?

MCP supports multiple transports (stdio, SSE, HTTP). We chose stdio because:
- No port management or CORS configuration
- Works natively with Claude Desktop, Cursor, and Claude Code
- Supports SSH tunnelling for remote deployments
- Process lifecycle is managed by the MCP client

### Why an approval queue instead of direct writes?

Risk register data is governed data. Incorrect changes can cascade through scoring, tolerance, and escalation workflows. The approval queue:
- Maintains human oversight on all AI-proposed changes
- Creates an audit trail (who proposed, who approved, when)
- Allows review of proposed changes with full context
- Prevents accidental data corruption from hallucinated tool calls
- Satisfies GRC requirements for change management

### Why shared Prisma client?

The MCP server and NestJS backend share the same database and schema. Rather than maintaining a separate schema or generating a duplicate Prisma client, the MCP server symlinks to the main server's generated client. This means:
- Single source of truth for the data model
- Schema changes are automatically available
- No migration coordination needed

The trade-off is a build dependency: the main server's Prisma client must be generated before the MCP server can run.

### Connection pooling

The MCP server uses a limited Prisma connection pool to avoid contending with the main backend for database connections. Query logging is off by default but can be enabled via `MCP_DEBUG=true`.

## Security Model

### Read Access

The MCP server has full read access to the risk management tables. This is appropriate because:
- The MCP client (Claude) needs comprehensive context for analysis
- All data is scoped to the organisation (multi-tenancy)
- No sensitive credentials or PII are exposed through the tools

### Write Access

All writes go through `McpPendingAction`. The MCP server can only:
1. Insert rows into the pending action table
2. Read from all risk management tables

It cannot update, delete, or directly create any risk entities.

### Authentication

The MCP server authenticates to the database via `DATABASE_URL`. It does not implement user-level authentication. Trust is established at the client level:
- Claude Desktop: user authenticates to their Claude account
- SSH transport: SSH key authentication
- The approval reviewer authenticates through the web application's session

### Multi-Tenancy

All tools that create proposals derive `organisationId` from the parent entity (risk, scenario, KRI). The approval queue is scoped by organisation. Reviewers see only actions for their organisation.

## Tool Registration Pattern

Each tool domain is a separate module that exports a `register*Tools(server, prisma)` function. The entry point (`index.ts`) calls all registration functions sequentially:

```
index.ts
  ├── registerRiskTools(server, prisma)
  ├── registerScenarioTools(server, prisma)
  ├── registerKriTools(server, prisma)
  ├── registerTreatmentTools(server, prisma)
  ├── registerThreatTools(server, prisma)
  ├── registerGovernanceTools(server, prisma)
  ├── registerAnalysisTools(server, prisma)
  ├── registerMutationTools(server, prisma)
  ├── registerResources(server)
  └── registerPrompts(server)
```

This pattern keeps each domain self-contained and allows independent testing.

## Directory Structure

```
apps/mcp-server/
├── src/
│   ├── index.ts              # Entry point, server init, transport
│   ├── prisma.ts             # Prisma client singleton
│   ├── tools/
│   │   ├── risk-tools.ts     # Risk register queries (3 tools)
│   │   ├── scenario-tools.ts # Scenario queries (7 tools)
│   │   ├── kri-tools.ts      # KRI queries (3 tools)
│   │   ├── treatment-tools.ts# Treatment plan queries (3 tools)
│   │   ├── threat-tools.ts   # Threat catalog queries (4 tools)
│   │   ├── governance-tools.ts# Governance queries (4 tools)
│   │   ├── analysis-tools.ts # Analysis & simulation (4 tools)
│   │   └── mutation-tools.ts # Mutation proposals (7 tools)
│   ├── resources/
│   │   └── index.ts          # 6 reference documents
│   └── prompts/
│       └── index.ts          # 5 guided prompts
├── claude-desktop-config.example.json
├── package.json
└── tsconfig.json
```
