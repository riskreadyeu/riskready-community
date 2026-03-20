# AI Assistant Guide

## Overview

RiskReady Community Edition includes **9 specialised MCP (Model Context Protocol) servers** that expose 250+ tools for querying, analysing, and proposing changes to your GRC data through natural language. Beyond reactive Q&A, the platform features an **autonomous agentic AI system** with:

- **AI Agents Council** — 6 specialist agents deliberate on complex cross-domain questions
- **Scheduled Workflows** — autonomous compliance runs on cron schedules
- **Event-Driven Triggers** — automatic analysis on critical incidents
- **Approval Feedback Loop** — the agent checks proposal outcomes and adapts
- **Task Tracking** — persistent multi-step work across sessions

Connect the servers to **Claude Code** or **Claude Desktop** to interact with your compliance database, or let the built-in AI Gateway handle routing, scheduling, and council orchestration automatically.

**Key principle: every mutation is proposed, not executed.** When the assistant needs to create, update, or delete data, it creates a pending action that a human must review and approve at `/settings/mcp-approvals` before the change touches the database. This safety model is preserved even for autonomous and scheduled runs.

---

## Table of Contents

- [Setup](#setup)
- [How It Works](#how-it-works)
- [The 9 MCP Servers](#the-9-mcp-servers)
- [AI Agents Council](#ai-agents-council)
- [Scheduled Workflows](#scheduled-workflows)
- [Example Queries](#example-queries)
- [Approval Queue](#approval-queue)
- [Anti-Hallucination Safeguards](#anti-hallucination-safeguards)
- [Model Selection](#model-selection)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Setup

Connect the MCP servers to Claude Code or Claude Desktop by adding them to your MCP client configuration. Each server runs as a stdio process with direct database access.

### Claude Code

```bash
# From the riskready-community directory, add all 9 servers:
claude mcp add riskready-controls npx tsx apps/mcp-server-controls/src/index.ts
claude mcp add riskready-risks npx tsx apps/mcp-server-risks/src/index.ts
claude mcp add riskready-policies npx tsx apps/mcp-server-policies/src/index.ts
claude mcp add riskready-organisation npx tsx apps/mcp-server-organisation/src/index.ts
claude mcp add riskready-itsm npx tsx apps/mcp-server-itsm/src/index.ts
claude mcp add riskready-evidence npx tsx apps/mcp-server-evidence/src/index.ts
claude mcp add riskready-audits npx tsx apps/mcp-server-audits/src/index.ts
claude mcp add riskready-incidents npx tsx apps/mcp-server-incidents/src/index.ts
claude mcp add riskready-agent-ops npx tsx apps/mcp-server-agent-ops/src/index.ts
```

Set the `DATABASE_URL` environment variable to point to your running PostgreSQL instance (default: `postgresql://riskready:change-me@localhost:5434/riskready`).

### Claude Desktop

Add the servers to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:change-me@localhost:5434/riskready"
      }
    }
  }
}
```

Repeat for each server you want to use. See the full server list in [The 9 MCP Servers](#the-9-mcp-servers) below.

---

## How It Works

```
                    ┌─────────────────────────────────────────┐
                    │             AI Gateway                   │
                    │                                         │
  User Message ───> │  Router ──> Agent Runner ──> Response   │
                    │               │      │                  │
  Cron Schedule ──> │  Scheduler ───┘      │                  │
                    │                      v                  │
  Domain Event ───> │  Triggers    Council Orchestrator       │
                    │               │                         │
                    │               v                         │
                    │     ┌─────────────────────┐             │
                    │     │  6 Specialist Agents  │             │
                    │     │  (parallel analysis)  │             │
                    │     └─────────┬───────────┘             │
                    │               v                         │
                    │        CISO Synthesis                   │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────v─────────────────────────┐
                    │         9 MCP Servers (250+ tools)       │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────v─────────────────────────┐
                    │  Proposed actions --> Approval Queue      │
                    │  --> Human Review --> Execute             │
                    └─────────────────────────────────────────┘
```

**Request lifecycle (user messages):**

1. You ask a question in the web UI, Claude Code, or Claude Desktop.
2. The AI Gateway routes your question to the relevant MCP servers by keyword matching across all 8 GRC domains.
3. **Query tools** return data directly from the database -- you see the results immediately.
4. **Mutation tools** (`propose_*`) do not modify data directly. Instead, they create pending actions in the approval queue.
5. A human reviews proposed actions in the web UI at `/settings/mcp-approvals`, then approves or rejects each one.
6. The agent can check what happened to its proposals via the Agent Ops server and adapt accordingly.

**Council deliberation (complex questions):**

When a question spans 3+ GRC domains (or uses trigger phrases like "posture assessment" or "board report"), the **AI Agents Council** is automatically convened. Six specialist agents analyse the question from their domain perspective in parallel, then the CISO Strategist synthesises findings into a unified deliberation.

**Autonomous runs (scheduled/event-driven):**

The platform can also run without user interaction:
- **Scheduled workflows** execute on cron (e.g., weekly risk review every Monday at 7 AM)
- **Event triggers** automatically dispatch analysis when critical incidents are created
- **Approval resume** — when pending proposals are resolved, the agent resumes with the outcome

---

## The 9 MCP Servers

Each server is a standalone process communicating via stdio. All query tools return data directly. All mutation tools (`propose_*`) create pending actions that require human approval.

### Controls Server -- 66 tools (30 query, 36 mutation)

Manages ISO 27001 controls, Statement of Applicability (SOA), control assessments, metrics, and scope items.

| Capability | Examples |
|---|---|
| **Query** | List/search/get controls, assessments, tests, SOA entries, metrics, scope items |
| **Analysis** | Gap analysis, effectiveness reports, control coverage matrix, tester workload, overdue tests, assessment completion summaries |
| **Propose** | Create/update/disable controls, create and manage assessments, record test results, manage SOA versions, add scope items, record metric values |

### Risks Server -- 34 tools (22 query, 12 mutation)

Manages the risk register, risk scenarios with likelihood/impact scoring (5×5 matrix, scores 1--25), KRIs, residual risk calculated from linked controls, and treatment plans.

| Capability | Examples |
|---|---|
| **Query** | Risk register, individual risks and scenarios, KRI values, tolerance statements, treatment plans |
| **Analysis** | Risk heat map, tolerance breaches, treatment progress, KRI alerts |
| **Propose** | Create risks and scenarios, record KRI values, create treatment plans |

### Policies Server -- 23 tools (14 query, 9 mutation)

Manages policy documents, versions, reviews, exceptions, acknowledgments, and mappings to controls and risks.

| Capability | Examples |
|---|---|
| **Query** | Policy documents, version history, review status, exceptions, acknowledgments, control/risk mappings |
| **Analysis** | Review calendar, compliance matrix, exception reports |
| **Propose** | Create/update policies, submit reviews, approve/publish/retire policies, create exceptions |

### Organisation Server -- 35 tools (23 query, 12 mutation)

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

### Audits Server -- 14 tools (7 query, 7 mutation)

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

### Agent Ops Server -- 7 tools (7 query)

Provides agent self-awareness: checking proposal statuses, managing tasks, and tracking multi-step work. This server is **always loaded** regardless of routing, ensuring the agent can always check its own state.

| Capability | Examples |
|---|---|
| **Approval Feedback** | Check action status, list pending/recent actions, read reviewer notes |
| **Task Management** | Create tasks, update progress, track multi-step workflows, view task hierarchies |

For detailed tool-by-tool documentation, see the individual server guides in `documentation/mcp-servers/`.

---

## AI Agents Council

For complex questions that span multiple GRC domains, the platform automatically convenes a **council of 6 specialist AI agents**. Each agent analyses the question from their domain perspective, then the CISO Strategist synthesises findings into a unified deliberation.

### Council Members

| Agent | Role | MCP Servers Used |
|-------|------|------------------|
| **Risk Analyst** | Risk landscape, KRIs, tolerance breaches, treatment plans | risks, controls, agent-ops |
| **Controls Auditor** | Control effectiveness, SOA, assessments, gap analysis | controls, evidence, audits, agent-ops |
| **Compliance Officer** | Policy alignment, ISO 27001, DORA, NIS2 compliance | policies, controls, organisation, agent-ops |
| **Incident Commander** | Incident patterns, response metrics, lessons learned | incidents, itsm, evidence, agent-ops |
| **Evidence Auditor** | Evidence coverage, audit readiness, documentation gaps | evidence, audits, controls, agent-ops |
| **CISO Strategist** | Cross-domain synthesis, executive reporting | all servers |

### When Is the Council Convened?

The council is automatically convened when:
- **3+ distinct GRC domains** are triggered by keyword analysis in the query, OR
- **Trigger phrases** match: "overall posture", "maturity assessment", "board report", "council review", "multi-perspective", "full assessment", "comprehensive review", "posture assessment", "cross-domain", "holistic view", "executive summary", "security posture"

### Deliberation Patterns

| Pattern | When Used | Flow |
|---------|-----------|------|
| **Parallel Then Synthesis** | Broad questions (default) | All agents run in parallel, then CISO synthesises |
| **Sequential Buildup** | Investigations | Each agent receives prior findings as context |
| **Challenge-Response** | Risk acceptance decisions | Agent A proposes, Agent B challenges, then synthesis |

### Council Output

The CISO Strategist synthesis includes:
- **Consensus Summary** — what the council agrees on
- **Cross-Domain Correlations** — links between domains (e.g., incident -> control gap -> risk)
- **Consolidated Recommendations** — prioritised with supporting agents
- **Dissenting Opinions** — preserved for GRC audit trail
- **Proposed Actions** — concrete next steps by domain

Every deliberation is persisted in the database (`CouncilSession` + `CouncilOpinion` records) for GRC audit compliance.

---

## Scheduled Workflows

The platform can run compliance workflows autonomously on cron schedules without user interaction.

### Built-in Workflows

| Workflow | Steps | Default Schedule |
|----------|-------|------------------|
| **Incident Response Flow** | Incident analysis -> Control gap ID -> Risk re-assessment -> Treatment proposal | Monday 8 AM |
| **Weekly Risk Review** | Tolerance breaches -> KRI trends -> Overdue treatments -> Executive summary | Monday 7 AM |
| **Control Assurance Cycle** | Assessment review -> Gap analysis -> Nonconformity tracking | Wednesday 8 AM |
| **Policy Compliance Check** | Overdue reviews -> Exception expiry -> Evidence coverage | 1st of month 9 AM |

All workflows ship **disabled by default**. Enable them via the schedule management API (`/api/agent-schedules`).

### How It Works

1. The **Scheduler** polls the database every 60 seconds for due schedules.
2. For each due schedule, it creates an `AgentTask` for tracking and executes via the Agent Runner.
3. Results are stored in the task record. Any mutations go through the standard approval queue.
4. When proposals are approved or rejected, the scheduler detects this and **automatically resumes** the agent with the outcome and reviewer notes.

### Event-Driven Triggers

Domain events can also trigger autonomous agent runs:
- **`incident.created`** — For CRITICAL/HIGH severity incidents, dispatches automatic analysis
- **`incident.status_changed`** — Logged for audit trail
- **`approval.resolved`** — Logged; the scheduler handles resume via polling

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

### Council Deliberations (multi-domain questions)

These queries automatically convene the AI Agents Council:

- "Give me a full security posture assessment covering risks, controls, and compliance"
- "Prepare a board report on our overall GRC maturity"
- "We had a ransomware incident — what are the cross-domain implications?"
- "Comprehensive review of our ISO 27001 readiness"
- "What should we prioritise next quarter from a holistic risk perspective?"

### Agent Self-Awareness

- "What is the status of my last proposal?"
- "Show me all pending actions"
- "What tasks are currently in progress?"
- "What happened to the control update I proposed yesterday?"

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
             |                           |
     +-------+-------+          Agent reads reviewNotes
     |               |          and offers revised proposal
  Success          Failure
     |               |
  EXECUTED         FAILED
```

### Approval Feedback Loop

The agent can now close the loop on its proposals:
1. When the agent proposes a change, it notes the `actionId`.
2. It can check the status at any time using `check_action_status(actionId)`.
3. If **approved**, the agent knows it can proceed with dependent work.
4. If **rejected**, the agent reads the `reviewNotes` and offers a revised proposal.
5. For **scheduled runs**, the scheduler automatically resumes the agent when all linked proposals are resolved.

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

## Configuration

### Council Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COUNCIL_ENABLED` | `true` | Enable/disable the AI Agents Council |
| `COUNCIL_CLASSIFIER_MODE` | `heuristic` | `heuristic` (zero-cost keyword matching) or `llm` (fast LLM call) |
| `COUNCIL_MAX_MEMBERS` | `6` | Maximum council members per session |
| `COUNCIL_MAX_TURNS_PER_MEMBER` | `15` | Maximum agent turns per council member |
| `COUNCIL_DEFAULT_PATTERN` | `parallel_then_synthesis` | Default deliberation pattern |
| `COUNCIL_MEMBER_MODEL` | *(inherit)* | Model for council members (e.g., use a cheaper model for cost control) |

### Schedule Management

Schedules are managed via the REST API:

```
GET    /api/agent-schedules          — List schedules
POST   /api/agent-schedules          — Create a schedule
PUT    /api/agent-schedules/:id      — Update a schedule
DELETE /api/agent-schedules/:id      — Delete a schedule
POST   /api/agent-schedules/:id/run-now — Trigger immediate execution
```

Cron expressions use standard 5-field format: `minute hour day month weekday` (e.g., `0 8 * * 1` = Monday at 8 AM).

For the complete configuration and architecture reference, see the [Agentic AI Platform Guide](AGENTIC_AI_PLATFORM.md).

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
