# AI Assistant Guide

## Overview

RiskReady Community Edition includes 8 specialised MCP (Model Context Protocol) servers that expose 248 tools for querying, analysing, and proposing changes to your GRC data through natural language. Connect these servers to **Claude Code** or **Claude Desktop** to interact with your compliance database. The servers cover controls, risks, policies, incidents, audits, evidence, IT service management, and organisational governance.

**Key principle: every mutation is proposed, not executed.** When the assistant needs to create, update, or delete data, it creates a pending action that a human must review and approve at `/settings/mcp-approvals` before the change touches the database.

---

## Table of Contents

- [Setup](#setup)
- [How It Works](#how-it-works)
- [The 8 MCP Servers](#the-8-mcp-servers)
- [Example Queries](#example-queries)
- [Approval Queue](#approval-queue)
- [Anti-Hallucination Safeguards](#anti-hallucination-safeguards)
- [Model Selection](#model-selection)
- [Troubleshooting](#troubleshooting)

---

## Setup

Connect the MCP servers to Claude Code or Claude Desktop by adding them to your MCP client configuration. Each server runs as a stdio process with direct database access.

### Claude Code

```bash
# From the riskready-community directory, add all 8 servers:
claude mcp add riskready-controls npx tsx apps/mcp-server-controls/src/index.ts
claude mcp add riskready-risks npx tsx apps/mcp-server-risks/src/index.ts
claude mcp add riskready-policies npx tsx apps/mcp-server-policies/src/index.ts
claude mcp add riskready-organisation npx tsx apps/mcp-server-organisation/src/index.ts
claude mcp add riskready-itsm npx tsx apps/mcp-server-itsm/src/index.ts
claude mcp add riskready-evidence npx tsx apps/mcp-server-evidence/src/index.ts
claude mcp add riskready-audits npx tsx apps/mcp-server-audits/src/index.ts
claude mcp add riskready-incidents npx tsx apps/mcp-server-incidents/src/index.ts
```

Set the `DATABASE_URL` environment variable to point to your running PostgreSQL instance (default: `postgresql://riskready:change-me@localhost:5433/riskready`).

### Claude Desktop

Add the servers to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:change-me@localhost:5433/riskready"
      }
    }
  }
}
```

Repeat for each server you want to use. See the full server list in [The 8 MCP Servers](#the-8-mcp-servers) below.

---

## How It Works

```
Your question --> Claude Code / Claude Desktop --> Claude
                        |
                        | MCP stdio transport
                        v
           8 specialised database servers (248 tools)
                        |
                        v
           Proposed actions --> Approval Queue --> Human Review --> Execute
```

**Request lifecycle:**

1. You ask a question in Claude Code or Claude Desktop.
2. Claude analyses your question and calls the relevant MCP server tools via stdio transport.
3. **Query tools** return data directly from the database -- you see the results immediately in your conversation.
4. **Mutation tools** (`propose_*`) do not modify data directly. Instead, they create pending actions in the approval queue.
5. A human reviews proposed actions in the web UI at `/settings/mcp-approvals`, then approves or rejects each one.

---

## The 8 MCP Servers

Each server is a standalone process communicating via stdio. All query tools return data directly. All mutation tools (`propose_*`) create pending actions that require human approval.

### Controls Server -- 68 tools (30 query, 38 mutation)

Manages ISO 27001 controls, Statement of Applicability (SOA), control assessments, metrics, and scope items.

| Capability | Examples |
|---|---|
| **Query** | List/search/get controls, assessments, tests, SOA entries, metrics, scope items |
| **Analysis** | Gap analysis, effectiveness reports, control coverage matrix, tester workload, overdue tests, assessment completion summaries |
| **Propose** | Create/update/disable controls, create and manage assessments, record test results, manage SOA versions, add scope items, record metric values |

### Risks Server -- 33 tools (22 query, 11 mutation)

Manages the risk register, scenarios with factor scoring (F1--F6), KRIs, tolerance statements, and treatment plans.

| Capability | Examples |
|---|---|
| **Query** | Risk register, individual risks and scenarios, KRI values, tolerance statements, treatment plans |
| **Analysis** | Risk heat map, tolerance breaches, treatment progress, KRI alerts |
| **Propose** | Create risks and scenarios, record KRI values, create treatment plans |

### Policies Server -- 25 tools (14 query, 11 mutation)

Manages policy documents, versions, reviews, exceptions, acknowledgments, and mappings to controls and risks.

| Capability | Examples |
|---|---|
| **Query** | Policy documents, version history, review status, exceptions, acknowledgments, control/risk mappings |
| **Analysis** | Review calendar, compliance matrix, exception reports |
| **Propose** | Create/update policies, submit reviews, approve/publish/retire policies, create exceptions |

### Organisation Server -- 32 tools (19 query, 13 mutation)

Manages organisational profiles, departments, locations, business processes, external dependencies, and governance structures.

| Capability | Examples |
|---|---|
| **Query** | Organisation profile, departments, locations, business processes, committees, meetings, action items |
| **Analysis** | BIA summary, governance activity reports |
| **Propose** | Update organisation profile, create departments/locations/processes/committees/meetings |

### ITSM Server -- 40 tools (25 query, 15 mutation)

Manages CMDB assets, change management, and capacity planning.

| Capability | Examples |
|---|---|
| **Query** | CMDB assets and relationships, software inventory, capacity records, change requests, approvals, templates |
| **Analysis** | CAB dashboard, change calendar |
| **Propose** | Create/update assets, manage change requests, create capacity plans |

### Evidence Server -- 16 tools (10 query, 6 mutation)

Manages the evidence repository and evidence requests.

| Capability | Examples |
|---|---|
| **Query** | Evidence records, requests, coverage analysis |
| **Analysis** | Expiry tracking, request aging |
| **Propose** | Create evidence records, link evidence to entities, manage requests |

### Audits Server -- 15 tools (8 query, 7 mutation)

Manages nonconformities and corrective action plan (CAP) workflows.

| Capability | Examples |
|---|---|
| **Query** | Nonconformities, CAP status, findings by control |
| **Analysis** | Aging reports, CAP completion tracking |
| **Propose** | Create/update nonconformities, manage CAP approval workflow |

### Incidents Server -- 19 tools (11 query, 8 mutation)

Manages the incident register, timelines, lessons learned, and links to affected assets and controls.

| Capability | Examples |
|---|---|
| **Query** | Incident register, timeline entries, lessons learned, affected assets, control links |
| **Analysis** | Incident trending, MTTR reports, control gap analysis from incidents |
| **Propose** | Create/update incidents, add timeline entries, record lessons learned |

For detailed tool-by-tool documentation, see the individual server guides in `documentation/mcp-servers/`.

---

## Example Queries

### Querying Data

- "Show me all controls that are not yet implemented"
- "What is our current risk heat map?"
- "Which policies are overdue for review?"
- "List all critical assets without backup enabled"
- "What nonconformities are still open from the last audit?"
- "Show me incident trends over the last 12 months"
- "What evidence is expiring in the next 30 days?"
- "List all committees and their most recent meeting dates"

### Analysis

- "Run a gap analysis on our latest assessment"
- "Which controls have no linked evidence?"
- "What is our SOA implementation rate by theme?"
- "Show me the tester workload distribution"
- "Which KRIs are in RED status?"
- "What is our mean time to resolve incidents?"
- "How many change requests are pending CAB approval?"
- "What is our overall control effectiveness rate?"

### Proposing Changes

- "Create a new risk for insider data exfiltration"
- "Record a PASS result for test GOV-01 in assessment ASM-2026-001"
- "Create a new SOA version from the current approved one"
- "Raise a nonconformity for the failed access control test"
- "Schedule a committee meeting for next Tuesday"
- "Create a new policy for acceptable use of AI tools"
- "Add a remediation action for the failed encryption test"
- "Record a new KRI measurement showing 95% compliance"

All proposed changes appear in the approval queue at `/settings/mcp-approvals` for human review before execution.

---

## Approval Queue

Every mutation proposed by the AI assistant is written to the approval queue. No data is changed in the database until a human approves the action.

### Reviewing Proposed Actions

1. Navigate to `/settings/mcp-approvals` in the web UI.
2. The **Pending** tab shows all proposed actions with:
   - Action type (e.g., `propose_create_control`, `propose_test_result`)
   - Full payload showing exactly what will be created or changed
   - The reason the assistant gave for proposing the action
   - Timestamp
3. Click **Approve** to execute the action against the database.
4. Click **Reject** to discard it. You can optionally add rejection notes.
5. The **Approved** and **Rejected** tabs provide a full audit history.

### Lifecycle

```
AI proposes action --> McpPendingAction (PENDING)
                           |
             +-------------+-------------+
             |                           |
        Human approves              Human rejects
             |                           |
     Executor service runs        Status: REJECTED
             |
     +-------+-------+
     |               |
  Success          Failure
     |               |
  EXECUTED         FAILED
```

---

## Anti-Hallucination Safeguards

The AI assistant is configured with strict safeguards to prevent fabricated or inaccurate data:

- **Tool-grounded responses only.** The assistant only returns data retrieved from MCP tool calls. It never fabricates values, statistics, or identifiers.
- **Explicit handling of missing data.** If a tool returns null, empty, or "not configured" for a field, the assistant reports that explicitly rather than filling in plausible values.
- **Database-sourced identifiers.** All UUIDs, control IDs, assessment references, and other identifiers come directly from the database. The assistant never guesses or invents identifiers.
- **Tool-first workflow.** The assistant always calls the relevant query tool before presenting record-specific details. It does not rely on training data for database content.
- **Quantitative integrity.** Monetary amounts, frequencies, percentages, and scores are presented only when returned by tools. The assistant does not calculate or infer these values.
- **Tolerance status fidelity.** Risk tolerance status is reported using the exact value from the database, never calculated or overridden by the assistant.

These rules are enforced through the system prompt provided to the Claude model on every request.

---

## Model Selection

The model used for GRC queries depends on which Claude model you select in Claude Code or Claude Desktop. Each model tier offers different trade-offs:

| Model | Best For | Trade-offs |
|---|---|---|
| **Claude Haiku** | Quick queries, simple lookups, routine data retrieval | Fastest and lowest cost. May produce less detailed analysis for complex multi-step questions. |
| **Claude Sonnet** | Balanced analysis, most day-to-day GRC work | Good balance of speed, cost, and analytical depth. Recommended for general use. |
| **Claude Opus** | Complex analysis, multi-step reasoning, nuanced GRC advice | Most capable for difficult analytical tasks. Higher cost and slower response times. |

Claude Code and Claude Desktop each provide their own model selection. Refer to the documentation for your MCP client to change models.

---

## Troubleshooting

### The MCP server fails to start

- Verify that `npx` and `tsx` are installed and available on your PATH.
- Check that the `DATABASE_URL` environment variable is set correctly and points to a reachable PostgreSQL instance.
- Confirm the database has been migrated by running `npx prisma migrate status` from the project root.
- Inspect the server output in your MCP client for connection errors.

### Tools return no data

- Verify that the database is running: `psql $DATABASE_URL -c "SELECT 1"` should succeed.
- Check that the database has been seeded or contains data for the domain you are querying.
- Try a broad query first (e.g., "List all controls") to confirm connectivity before narrowing down.

### Proposed actions not appearing

- Check that the assistant confirmed the action was proposed in its response.
- Navigate to `/settings/mcp-approvals` in the web UI and check the Pending tab.
- Verify that the MCP server has write access to the database (the `DATABASE_URL` user must have INSERT permissions on the `McpPendingAction` table).
