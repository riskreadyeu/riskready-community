# AI Assistant Guide

## Overview

RiskReady Community Edition includes a built-in AI assistant powered by Claude (Anthropic) that can query, analyse, and propose changes to your GRC data through natural language. The assistant connects to your database through 8 specialised MCP (Model Context Protocol) servers that collectively expose 248 tools covering controls, risks, policies, incidents, audits, evidence, IT service management, and organisational governance.

**Key principle: every mutation is proposed, not executed.** When the assistant needs to create, update, or delete data, it creates a pending action that a human must review and approve at **Settings > MCP Approvals** before the change touches the database.

---

## Table of Contents

- [Setup](#setup)
- [How It Works](#how-it-works)
- [The 8 MCP Servers](#the-8-mcp-servers)
- [Example Queries](#example-queries)
- [Approval Queue](#approval-queue)
- [Memory](#memory)
- [Channel Integrations](#channel-integrations)
- [Using with Claude Desktop or Claude Code](#using-with-claude-desktop-or-claude-code)
- [Anti-Hallucination Safeguards](#anti-hallucination-safeguards)
- [Model Selection](#model-selection)
- [Troubleshooting](#troubleshooting)

---

## Setup

1. Sign in to RiskReady.
2. Navigate to **Settings > AI Configuration**.
3. Enter your Anthropic API key.
4. Select a model (see [Model Selection](#model-selection) below).
5. Save.

The AI Gateway runs on port 3100 and starts automatically with `docker compose up`. No additional configuration is required beyond the API key.

---

## How It Works

```
Your question --> AI Gateway (Fastify, port 3100) --> Claude Agent SDK --> Claude
                        |
                        | MCP stdio transport
                        v
           8 specialised database servers (248 tools)
                        |
                        v
           Proposed actions --> Approval Queue --> Human Review --> Execute
```

**Request lifecycle:**

1. You type a question in the chat panel.
2. The web app dispatches your message to the AI Gateway.
3. The gateway's **router** analyses your message and selects the relevant MCP servers based on keyword matching (e.g., a question about "risk heat map" activates the Risks server).
4. The Claude Agent SDK sends your question to Claude along with the tools from the selected servers.
5. Claude calls one or more tools to query the database or propose changes. The agent can chain up to **25 tool-call turns** to answer complex questions.
6. Responses stream back in real time via Server-Sent Events (SSE) so you see text as it is generated, along with indicators of which tools are being called.
7. Any proposed mutations are written to the approval queue. The assistant informs you that approval is required.
8. After the conversation ends, the gateway distils key facts into memory for future conversations.

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

All proposed changes appear in **Settings > MCP Approvals** for human review before execution.

---

## Approval Queue

Every mutation proposed by the AI assistant is written to the approval queue. No data is changed in the database until a human approves the action.

### Reviewing Proposed Actions

1. Navigate to **Settings > MCP Approvals**.
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

## Memory

The assistant remembers key facts from your conversations to provide better context over time.

After each conversation, the gateway runs a background **memory distillation** step that extracts:

- **Preferences** -- your communication style and reporting preferences (e.g., "User prefers detailed risk matrices over heat maps").
- **Context** -- organisation-specific facts (e.g., "Organisation is in financial services, subject to DORA regulation").
- **Knowledge** -- decisions and conclusions reached during conversations.

These memories are automatically recalled in future conversations when they are relevant to your question. Memories are scoped to your organisation and user account.

---

## Channel Integrations

The AI assistant is available through multiple channels:

- **Web app** (built-in) -- the primary interface, available at the chat panel in the RiskReady web application.
- **Slack** -- configure by setting `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `SLACK_SIGNING_SECRET` environment variables.
- **Discord** -- configure by setting `DISCORD_BOT_TOKEN` environment variable.

All channels use the same underlying AI Gateway and share access to the same MCP servers and approval queue.

---

## Using with Claude Desktop or Claude Code

The MCP servers can be used as standalone tools outside the web application. Any MCP-compatible client (Claude Desktop, Claude Code, or other clients supporting the Model Context Protocol) can connect directly to the servers.

### Configuration

Add one or more servers to your MCP client configuration:

```json
{
  "mcpServers": {
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5433/riskready"
      }
    },
    "riskready-risks": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server-risks/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5433/riskready"
      }
    }
  }
}
```

Replace the `DATABASE_URL` with your actual PostgreSQL connection string. All 8 servers follow the same pattern -- substitute the package name as needed:

| Server | Package path |
|---|---|
| Controls | `apps/mcp-server-controls/src/index.ts` |
| Risks | `apps/mcp-server-risks/src/index.ts` |
| Policies | `apps/mcp-server-policies/src/index.ts` |
| Organisation | `apps/mcp-server-organisation/src/index.ts` |
| ITSM | `apps/mcp-server-itsm/src/index.ts` |
| Evidence | `apps/mcp-server-evidence/src/index.ts` |
| Audits | `apps/mcp-server-audits/src/index.ts` |
| Incidents | `apps/mcp-server-incidents/src/index.ts` |

For detailed tool documentation, see `documentation/mcp-servers/`.

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

The model used by the AI assistant can be configured in **Settings > AI Configuration**. The choice of model affects speed, cost, and analytical depth.

| Model | Best For | Trade-offs |
|---|---|---|
| **Claude Haiku** (default) | Quick queries, simple lookups, routine data retrieval | Fastest and lowest cost. May produce less detailed analysis for complex multi-step questions. |
| **Claude Sonnet** | Balanced analysis, most day-to-day GRC work | Good balance of speed, cost, and analytical depth. Recommended for general use. |
| **Claude Opus** | Complex analysis, multi-step reasoning, nuanced GRC advice | Most capable for difficult analytical tasks. Higher cost and slower response times. |

The model can also be set via the `AGENT_MODEL` environment variable as a fallback when no database configuration exists.

The assistant can chain up to 25 tool-call turns per request (configurable via **Max Agent Turns** in AI Configuration). Complex questions that require querying multiple servers may use several turns, while simple lookups typically complete in 1--2 turns.

---

## Troubleshooting

### The assistant does not respond

- Verify your Anthropic API key is correctly entered in **Settings > AI Configuration**.
- Check that the AI Gateway is running: `curl http://localhost:3100/health` should return `{"status":"ok"}`.
- Inspect gateway logs: `docker compose logs gateway`.

### The assistant says it cannot find data that exists

- The router selects MCP servers based on keywords in your question. Try rephrasing with more specific terms (e.g., "Show me ISO 27001 controls" instead of "Show me security items").
- You can explicitly target a server by including `@riskready-controls` (or any server name) in your message.

### Proposed actions are not appearing in the approval queue

- Check that the assistant confirmed the action was proposed in its response.
- Navigate to **Settings > MCP Approvals** and check the Pending tab.
- Inspect gateway logs for errors: `docker compose logs gateway`.

### Responses are slow

- Consider using Claude Haiku for routine queries where speed matters more than depth.
- Reduce the **Max Agent Turns** setting if the assistant is making more tool calls than necessary.
- Check your network connectivity to the Anthropic API.

### Token usage is high

- The assistant includes up to 20 messages of conversation history as context. Starting a new conversation for unrelated questions reduces token consumption.
- Using Claude Haiku significantly reduces cost per query.
- Complex analytical questions that chain many tool calls will use more tokens. Consider breaking very broad questions into focused ones.
