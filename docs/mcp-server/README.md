# RiskReady MCP Servers

RiskReady exposes its entire GRC platform as 12 AI-accessible MCP (Model Context Protocol) servers. Each server is a standalone process that connects via stdio transport to Claude Desktop, Cursor, Claude Code, or any MCP-compatible client.

## Key Numbers

| Metric | Count |
|--------|-------|
| MCP servers | 12 |
| Total tools | 356 |
| Mutation proposal tools | ~70 |
| Resources | ~40 |
| Prompts | ~30 |

## Core Design Principle

**Read-mostly with safe mutation proposals.** Every MCP server has full read access to its domain, but all write operations go through an approval queue (`McpPendingAction`). A human must review and approve every proposed change before it executes. Zero direct writes.

---

## Server Catalogue

| Server | Directory | Tools | Domain |
|--------|-----------|-------|--------|
| [Risk](./risk/) | `apps/mcp-server/` | 35 | Risk register, scenarios, KRIs, treatment plans, threats, FAIR simulation |
| [Controls](./controls/) | `apps/mcp-server-controls/` | 37 | Control library, layers, assessments, testing, metrics, SoA, cross-references |
| [Organisation](./organisation/) | `apps/mcp-server-organisation/` | 48 | Org profiles, departments, locations, business processes, personnel, stakeholders, frameworks, governance |
| [Policies](./policies/) | `apps/mcp-server-policies/` | 47 | Policy documents, change requests, exceptions, reviews, external requirements, regulatory obligations |
| [ITSM](./itsm/) | `apps/mcp-server-itsm/` | 32 | Asset CMDB, relationships, software inventory, capacity management, change management |
| [Evidence](./evidence/) | `apps/mcp-server-evidence/` | 24 | Evidence repository, requests, fulfillments, 14 cross-entity link tables |
| [Supply Chain](./supply-chain/) | `apps/mcp-server-supply-chain/` | 28 | Vendor register, assessments, contracts, SLA monitoring, certifications |
| [Incidents](./incidents/) | `apps/mcp-server-incidents/` | 25 | Incident register, timeline, notifications, tasks, RCA, lessons learned |
| [Vulnerabilities](./vulnerabilities/) | `apps/mcp-server-vulnerabilities/` | 21 | Vulnerability queue, remediation plans, SLA tracking, scan management |
| [Applications](./applications/) | `apps/mcp-server-applications/` | 25 | Application inventory, ISRAs, TVAs, BIAs, SRLs, threat assessments |
| [BCM](./bcm/) | `apps/mcp-server-bcm/` | 21 | BCM programs, continuity plans, test exercises, BIAs, plan activations |
| [Audits](./audits/) | `apps/mcp-server-audits/` | 13 | Audit programs, engagements, findings, nonconformities, CAP tracking |

---

## Per-Server Documentation

Each server folder contains 3 files:

| File | Contents |
|------|----------|
| `README.md` | Overview, key numbers, design notes, quick start |
| `tool-reference.md` | Complete tool catalogue with parameter tables, return formats |
| `resources-prompts.md` | Reference resources (URI-addressable data) and guided prompts |

## Shared Architecture

All 12 servers share the same architecture:

- **Runtime**: Node.js with [tsx](https://github.com/privatenumber/tsx)
- **Protocol**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) v1.12+
- **Database**: Prisma Client (shared multi-file schema from `apps/server/prisma/schema/`)
- **Validation**: Zod for all tool input schemas
- **Transport**: stdio (for Claude Desktop, Cursor, Claude Code, etc.)
- **Mutation pattern**: All writes create `McpPendingAction` records for human approval

### Cross-Server References

| Document | Contents |
|----------|----------|
| [Architecture](./architecture.md) | Design decisions, data flow, security model |
| [Setup Guide](./setup.md) | Installation, configuration, client integration |
| [Workflows](./workflows.md) | Common task workflows, approval flow, usage patterns |

## Quick Start

Each server runs independently:

```bash
# Start any server
cd apps/mcp-server-{name}
DATABASE_URL="postgresql://..." npm start
```

For Claude Desktop, add to your config (`~/.config/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "riskready-risk": {
      "command": "npx",
      "args": ["tsx", "--no-warnings", "src/index.ts"],
      "cwd": "/path/to/riskready-community/apps/mcp-server",
      "env": { "DATABASE_URL": "postgresql://..." }
    },
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "--no-warnings", "src/index.ts"],
      "cwd": "/path/to/riskready-community/apps/mcp-server-controls",
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

Repeat for each server you want to expose.
