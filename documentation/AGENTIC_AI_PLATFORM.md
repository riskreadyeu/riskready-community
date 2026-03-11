# RiskReady Agentic AI Platform

RiskReady has been transformed from an AI-*ready* GRC platform (where Claude is the agent, RiskReady provides the tools) into a **proactive, autonomous** system with a **multi-agent council**. This document covers the architecture, capabilities, and configuration of the agentic AI features.

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │             AI Gateway                   │
                    │                                         │
  User Message ───▶ │  Router ──▶ Agent Runner ──▶ Response   │
                    │               │      │                  │
  Cron Schedule ──▶ │  Scheduler ───┘      │                  │
                    │                      ▼                  │
  Domain Event ───▶ │  Triggers    Council Orchestrator       │
                    │               │                         │
                    │               ▼                         │
                    │     ┌─────────────────────┐             │
                    │     │  6 Specialist Agents │             │
                    │     │  (parallel analysis) │             │
                    │     └─────────┬───────────┘             │
                    │               ▼                         │
                    │        CISO Synthesis                   │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────────┐
                    │         9 MCP Servers                    │
                    │  Controls │ Risks    │ Evidence          │
                    │  Policies │ Org      │ ITSM              │
                    │  Audits   │ Incidents│ Agent Ops         │
                    └─────────────────────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────────┐
                    │         PostgreSQL Database              │
                    │  McpPendingAction (approval queue)       │
                    │  AgentTask / AgentSchedule               │
                    │  CouncilSession / CouncilOpinion         │
                    └─────────────────────────────────────────┘
```

## Phase 1: Approval Feedback Loop

### Problem
Previously, the AI agent proposed changes but had no way to check what happened to them. It couldn't close any loop.

### Solution
The **Agent Ops MCP server** (`riskready-agent-ops`) provides self-awareness tools:

| Tool | Purpose |
|------|---------|
| `check_action_status(actionId)` | Check if a proposal was approved, rejected, executed, or failed |
| `list_pending_actions(organisationId, status?, limit?)` | List actions with optional status filter |
| `list_recent_actions(organisationId, since?, limit?)` | List actions since a date (default: last 24h) |

The agent-ops server is **always loaded** regardless of message routing, ensuring the agent can always check its proposal status.

### System Prompt
The system prompt has been expanded to describe all 9 MCP servers (previously only mentioned Controls). It includes explicit instructions for the approval feedback loop:

> "When you propose changes, note the actionId. You can check status with `check_action_status`. If rejected, read reviewNotes and offer a revised proposal."

### Router Expansion
The keyword router now covers all 8 GRC domains with 40+ keyword entries (previously only controls/compliance). This ensures messages are routed to the correct MCP servers.

---

## Phase 2: Persistent Agent State (Task Tracking)

### Problem
The agent had no way to track multi-step work across conversation sessions.

### Solution
New database models and MCP tools for task management:

#### Database Schema
```
AgentTask
├── id, organisationId, title, instruction
├── status: PENDING → IN_PROGRESS → AWAITING_APPROVAL → COMPLETED/FAILED/CANCELLED
├── trigger: USER_REQUEST / SCHEDULED / EVENT / WORKFLOW_STEP / APPROVAL_RESUME
├── parentTaskId (hierarchy), workflowId, stepIndex
├── actionIds[] (linked McpPendingAction records)
└── result, errorMessage, completedAt
```

#### MCP Tools
| Tool | Purpose |
|------|---------|
| `create_agent_task(organisationId, title, instruction, ...)` | Create a task |
| `update_agent_task(taskId, status?, result?, actionIds?)` | Update progress |
| `get_agent_task(taskId)` | Get task with children and action statuses |
| `list_agent_tasks(organisationId, status?, limit?)` | List tasks |

#### Agent Runner Integration
The `AgentRunner.execute()` method accepts an optional `taskId` parameter:
- Sets task to `IN_PROGRESS` before execution
- Tracks `actionIds` produced during the run
- Sets task to `AWAITING_APPROVAL` if proposals are pending
- Sets task to `COMPLETED` or `FAILED` on completion/error

---

## Phase 3: Scheduled & Event-Driven Runs

### Scheduler Service
`gateway/src/scheduler/scheduler.service.ts`

- Polls the `AgentSchedule` table every 60 seconds
- For each due schedule (`enabled=true AND nextRunAt <= NOW()`):
  1. Creates an `AgentTask` for tracking
  2. Creates a system conversation
  3. Builds a synthetic `UnifiedMessage`
  4. Executes via `AgentRunner.execute()`
  5. Updates `lastRunAt`, computes `nextRunAt` from cron expression

#### Approval-Triggered Resume
The scheduler also checks for tasks in `AWAITING_APPROVAL` status:
1. When all linked `McpPendingAction` records are resolved (no longer PENDING)
2. Loads the original task instruction + approval outcomes
3. Creates a child task with trigger `APPROVAL_RESUME`
4. Executes a resume run with reviewer notes in the prompt

### Event Triggers
`apps/server/src/agent-triggers/agent-trigger.service.ts`

Listens for NestJS `EventEmitter2` events:
- `incident.created` — For CRITICAL/HIGH severity, dispatches analysis request to gateway
- `incident.status_changed` — Logged for audit trail
- `approval.resolved` — Logged (scheduler handles resume via polling)

Events are emitted from:
- `IncidentService.create()` — emits `incident.created`
- `IncidentService.updateStatus()` — emits `incident.status_changed`
- `McpApprovalController.approve()` — emits `approval.resolved`
- `McpApprovalController.reject()` — emits `approval.resolved`

### Schedule Management API
```
GET    /agent-schedules          — List schedules
GET    /agent-schedules/:id      — Get schedule
POST   /agent-schedules          — Create schedule
PUT    /agent-schedules/:id      — Update schedule
DELETE /agent-schedules/:id      — Delete schedule
POST   /agent-schedules/:id/run-now — Trigger immediate execution
```

### Cron Expression Format
Standard 5-field cron: `minute hour day month weekday`

Examples:
- `*/5 * * * *` — Every 5 minutes
- `0 8 * * 1` — Monday at 8 AM
- `0 9 1 * *` — 1st of month at 9 AM

---

## Phase 4: Cross-Domain Workflows

### Workflow Executor
`gateway/src/workflows/workflow-executor.ts`

Executes multi-step workflows sequentially with full lifecycle management:
1. Creates (or reuses) a parent `AgentTask` for the workflow
2. For each step:
   - Creates a child task with `stepIndex` for ordering
   - Builds instruction with cumulative context from all previous steps
   - Executes via `AgentRunner.execute()`
   - If step has an `approvalGate`, pauses the entire workflow until all proposals are resolved
3. Returns `WorkflowExecution` with step-by-step results

### Scheduler Integration

The `SchedulerService` fully manages workflow lifecycle:

**Workflow Pickup** — The scheduler polls for `AgentTask` records with `workflowId` set and `status = PENDING`. For each:
1. Marks the task `IN_PROGRESS` immediately (prevents re-pickup on next tick)
2. Looks up the workflow definition via `getWorkflowById()`
3. Enqueues execution through `LaneQueue` for mutual exclusion with user runs
4. If the workflow definition is unknown, marks the task `FAILED`
5. If the queue is full, reverts the task to `PENDING` for retry on the next tick

**Workflow-Aware Approval Resume** — When a workflow step hits an approval gate:
1. The step task enters `AWAITING_APPROVAL`, and the parent task follows
2. The scheduler detects the parent task (filtering `parentTaskId: null` to avoid child step tasks)
3. It collects `actionIds` from all child step tasks in `AWAITING_APPROVAL` status
4. Once all linked `McpPendingAction` records are resolved (approved/rejected/executed/failed):
   - Rebuilds cumulative context from all completed steps
   - Appends approval outcomes (action type, status, reviewer notes)
   - Calls `WorkflowExecutor.resume()` to continue from the next step
5. The workflow continues seamlessly with full context preservation

### Built-in Workflows

| Workflow | Steps | Schedule |
|----------|-------|----------|
| **Incident Response Flow** | Incident analysis → Control gap ID → Risk re-assessment → Treatment proposal | Monday 8 AM |
| **Weekly Risk Review** | Tolerance breaches → KRI trends → Overdue treatments → Executive summary | Monday 7 AM |
| **Control Assurance Cycle** | Assessment review → Gap analysis → Nonconformity tracking | Wednesday 8 AM |
| **Policy Compliance Check** | Overdue reviews → Exception expiry → Evidence coverage | 1st of month 9 AM |

All workflows ship **disabled by default**. Enable via the schedule management API.

### Workflow API
```
GET    /agent-workflows                    — List workflow executions
GET    /agent-workflows/:taskId            — Get workflow execution status
POST   /agent-workflows/trigger            — Trigger a built-in workflow
GET    /agent-workflows/definitions/built-in — List available workflow definitions
```

---

## Phase 5: AI Agents Council

### Overview
For complex, cross-domain questions, the platform convenes a **council of 6 specialized AI agents** that analyze the question from their domain perspective, then a CISO Strategist synthesizes findings into a unified deliberation.

### Council Members

| Agent | Role | MCP Servers |
|-------|------|-------------|
| `risk-analyst` | Risk landscape, KRIs, tolerance, treatments | risks, controls |
| `controls-auditor` | Control effectiveness, SOA, assessments, gaps | controls, evidence, audits |
| `compliance-officer` | Policy alignment, ISO 27001/DORA/NIS2 | policies, controls, organisation |
| `incident-commander` | Incident patterns, response metrics, lessons | incidents, itsm, evidence |
| `evidence-auditor` | Evidence coverage, audit readiness, documentation | evidence, audits, controls |
| `ciso-strategist` | Cross-domain synthesis, executive reporting | all 8 servers |

### When Is the Council Convened?

The **heuristic classifier** (`gateway/src/council/council-classifier.ts`) decides:

1. **3+ distinct GRC domains** are triggered by keyword analysis, OR
2. **Explicit trigger phrases** are matched:
   - "overall posture", "maturity assessment", "board report"
   - "council review", "multi-perspective", "full assessment"
   - "comprehensive review", "posture assessment", "cross-domain"
   - "holistic view", "executive summary", "security posture"

### Deliberation Patterns

| Pattern | When Used | Flow |
|---------|-----------|------|
| **Parallel Then Synthesis** (default) | Broad questions | All members run in parallel → CISO synthesizes |
| **Sequential Buildup** | Investigations | Each member receives prior findings as context |
| **Challenge-Response** | Risk acceptance | Agent A proposes → Agent B challenges → Synthesis |

### Council Output

Each council member produces:
- **Findings** with severity (critical/high/medium/low/info) and evidence
- **Recommendations** with priority (immediate/short_term/medium_term/long_term)
- **Dissents** against other members' conclusions
- **Data sources** and confidence level

The CISO Strategist synthesis produces:
- **Consensus Summary** — What the council agrees on
- **Cross-Domain Correlations** — Links between domains (e.g., incident → control gap → risk)
- **Consolidated Recommendations** — Prioritized with supporting agents
- **Dissenting Opinions** — Preserved for GRC audit trail
- **Proposed Actions** — Concrete next steps by domain
- **Confidence Level** — Overall assessment confidence

### Audit Trail

Every council deliberation is persisted for GRC compliance:

```
CouncilSession
├── id, conversationId, question, pattern
├── participatingAgents[], consensusSummary
├── deliberation (full JSON), confidenceLevel
├── inputTokens, outputTokens
└── startedAt, completedAt

CouncilOpinion (one per participating agent)
├── id, sessionId, agentRole
├── findings (JSON), recommendations (JSON)
├── dissents (JSON), dataSources (JSON)
├── confidence, inputTokens, outputTokens
└── createdAt
```

### Streaming UX Events

The council emits real-time events via SSE:

| Event | When |
|-------|------|
| `council_start` | Council convened, lists participating agents |
| `council_member_start` | Individual agent begins analysis |
| `council_member_done` | Individual agent completes analysis |
| `council_synthesis` | CISO synthesis phase begins |
| `council_done` | Full deliberation complete |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COUNCIL_ENABLED` | `true` | Enable/disable the AI Agents Council |
| `COUNCIL_CLASSIFIER_MODE` | `heuristic` | `heuristic` or `llm` |
| `COUNCIL_MAX_MEMBERS` | `6` | Max council members per session |
| `COUNCIL_MAX_TURNS_PER_MEMBER` | `15` | Max agent turns per council member |
| `COUNCIL_DEFAULT_PATTERN` | `parallel_then_synthesis` | Default deliberation pattern |
| `COUNCIL_MEMBER_MODEL` | *(inherit)* | Model for council members (e.g., use a cheaper model) |

### Safety

All mutations still go through the **human-approval queue** (`McpPendingAction`). The autonomous capabilities (scheduler, events, council) can propose changes but cannot execute them without human approval. This preserves the safety model.

---

## File Structure

```
gateway/
├── src/
│   ├── agent/
│   │   ├── agent-runner.ts        # Task-aware + council hook
│   │   └── system-prompt.ts       # All 9 servers described
│   ├── council/
│   │   ├── council-types.ts       # Interfaces and config
│   │   ├── council-classifier.ts  # When to convene
│   │   ├── council-members.ts     # AgentDefinition factory
│   │   ├── council-prompts.ts     # 6 role prompts
│   │   ├── council-orchestrator.ts# Deliberation engine
│   │   └── council-renderer.ts    # Markdown renderer
│   ├── scheduler/
│   │   ├── scheduler.service.ts   # Cron + workflow pickup + approval resume
│   │   └── __tests__/
│   │       └── scheduler.service.test.ts
│   ├── workflows/
│   │   ├── types.ts               # Workflow definitions + getWorkflowById()
│   │   ├── workflow-executor.ts   # Step execution + resume after approval
│   │   └── __tests__/
│   │       ├── types.test.ts
│   │       └── workflow-executor.test.ts
│   ├── router/
│   │   └── router.ts             # Expanded keywords + domain counting
│   ├── channels/
│   │   └── types.ts              # Council event types
│   └── config.ts                 # Council config section
├── skills.yaml                   # 9 MCP servers

apps/
├── mcp-server-agent-ops/         # New MCP server
│   └── src/
│       ├── tools/
│       │   ├── action-tools.ts   # check_action_status, list_*
│       │   └── task-tools.ts     # create/update/get/list tasks
│       ├── index.ts
│       └── prisma.ts
├── server/
│   ├── prisma/schema/
│   │   ├── agent-tasks.prisma    # AgentTask + AgentSchedule
│   │   └── council.prisma        # CouncilSession + CouncilOpinion
│   ├── prisma/seed/
│   │   └── agent-workflows/      # Built-in workflow seed data
│   └── src/
│       ├── agent-schedule/       # CRUD API for schedules
│       ├── agent-triggers/       # Event listener service
│       └── agent-workflow/       # Workflow management API
```
