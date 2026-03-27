# RiskReady MCP Servers

RiskReady Community Edition exposes 8 MCP (Model Context Protocol) servers that connect to **Claude Code**, **Claude Desktop**, or any MCP-compatible client, allowing AI assistants to query and propose mutations against the GRC platform.

## Architecture

All MCP servers follow a consistent architecture:

- **Transport**: stdio (standard input/output)
- **Query tools**: Read-only operations that return data directly
- **Mutation tools**: Proposal-based — all mutations create `McpPendingAction` records that require human approval before execution
- **Resources**: Markdown reference documents providing context for AI assistants
- **Prompts**: Guided multi-step workflows for complex analysis tasks
- **Anti-hallucination guards**: Each server includes data integrity instructions preventing AI fabrication

## Server Overview

| Server | Package | Tools | Resources | Prompts | Domain |
|--------|---------|-------|-----------|---------|--------|
| [Controls](./controls.md) | `mcp-server-controls` | 68 (30 query, 38 mutation) | 5 | 4 | ISO 27001 controls, assessments, SOA, metrics |
| [Risks](./risks.md) | `mcp-server-risks` | 33 (22 query, 11 mutation) | 5 | 4 | Risk register, scenarios, KRIs, treatment plans |
| [ITSM](./itsm.md) | `mcp-server-itsm` | 40 (25 query, 15 mutation) | 4 | 3 | CMDB assets, change management, capacity planning |
| [Audits](./audits.md) | `mcp-server-audits` | 15 (8 query, 7 mutation) | 3 | 3 | Nonconformities, corrective action plans |
| [Incidents](./incidents.md) | `mcp-server-incidents` | 19 (11 query, 8 mutation) | 4 | 3 | Security incidents, timeline, lessons learned |
| [Evidence](./evidence.md) | `mcp-server-evidence` | 16 (10 query, 6 mutation) | 4 | 3 | Evidence records, requests, coverage analysis |
| [Policies](./policies.md) | `mcp-server-policies` | 25 (14 query, 11 mutation) | 4 | 3 | Policy documents, reviews, exceptions, mappings |
| [Organisation](./organisation.md) | `mcp-server-organisation` | 32 (19 query, 13 mutation) | 4 | 3 | Org profile, departments, processes, governance |

**Totals**: 248 tools, 33 resources, 26 prompts

## Configuration

Each MCP server is configured as a stdio transport in your Claude Code or Claude Desktop config:

```json
{
  "mcpServers": {
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

## Human-in-the-Loop Approval

All mutation tools follow a proposal pattern:

1. AI assistant calls `propose_*` tool
2. An `McpPendingAction` record is created with status `PENDING`
3. Human reviews the proposal in the web UI at `/settings/mcp-approvals`
4. On approval, the executor service dispatches to the appropriate domain service
5. Status transitions to `EXECUTED` (success) or `FAILED` (error)

This ensures no AI-proposed change is applied without human review.
