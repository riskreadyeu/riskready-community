# RiskReady Gateway — AI Assistant for Community Edition

The Gateway is a multi-channel AI agent orchestrator that powers the RiskReady AI GRC Assistant. It uses the Anthropic SDK with tool search to run agentic message loops with MCP servers as tools, exposed via HTTP/SSE (Fastify).

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────────────┐
│   Frontend   │     │                  Gateway                     │
│  (React UI)  │────▶│                                              │
│  /settings   │     │  Fastify HTTP  ──▶  LaneQueue  ──▶  Agent   │
│  /chat       │ SSE │    :3100            (per-user)     Runner    │
│              │◀────│                                      │       │
└──────────────┘     │              ┌───────────────────────┘       │
                     │              ▼                               │
                     │     Claude Agent SDK                        │
                     │       (query loop)                          │
                     │              │                               │
                     │              ▼                               │
                     │     8 MCP Servers (248 tools)               │
                     │     Controls · Risks · Evidence             │
                     │     Policies · Organisation · ITSM          │
                     │     Audits · Incidents                      │
                     │                                              │
                     │     ┌────────────────────────┐              │
                     │     │  PostgreSQL (shared)    │              │
                     │     │  - ChatConversation     │              │
                     │     │  - ChatMessage          │              │
                     │     │  - Memory               │              │
                     │     │  - GatewayConfig        │              │
                     │     └────────────────────────┘              │
                     └──────────────────────────────────────────────┘
```

### Key Components

| Component | File | Description |
|-----------|------|-------------|
| **Fastify server** | `src/channels/internal.adapter.ts` | HTTP endpoints: `/dispatch`, `/stream/:runId`, `/cancel/:runId`, `/health` |
| **Agent runner** | `src/agent/agent-runner.ts` | Orchestrates the Claude Agent SDK loop, streams events, saves messages |
| **Skill registry** | `src/agent/skill-registry.ts` | Loads MCP server definitions from `skills.yaml`, hot-reloads on change |
| **Router** | `src/router/router.ts` | Keyword-based routing to select which MCP servers to activate per message |
| **Lane queue** | `src/queue/lane-queue.ts` | Per-user sequential job queue with timeout and cancellation |
| **Run manager** | `src/run/run-manager.ts` | SSE event buffering, subscriber management, replay for late-joining clients |
| **Memory** | `src/memory/` | Conversation memory with full-text search (tsvector) and LLM distillation |
| **Block extractor** | `src/agent/block-extractor.ts` | Extracts structured UI blocks (tables, cards) from MCP tool results |
| **DB config** | `src/db-config.ts` | Loads runtime settings (API key, model, max turns) from the `GatewayConfig` table |

### MCP Servers

The gateway connects to **8 MCP servers** exposing **248 tools** (139 query + 109 mutation):

| Server | Tools | Domain |
|--------|-------|--------|
| `riskready-controls` | 68 | Controls, SOA, assessments, metrics, gap analysis |
| `riskready-risks` | 33 | Risk register, scenarios, KRIs, treatment plans |
| `riskready-itsm` | 40 | CMDB assets, change management, capacity planning |
| `riskready-organisation` | 32 | Departments, processes, governance, committees |
| `riskready-policies` | 25 | Policy documents, reviews, exceptions, mappings |
| `riskready-incidents` | 19 | Security incidents, timeline, lessons learned |
| `riskready-evidence` | 16 | Evidence records, requests, coverage analysis |
| `riskready-audits` | 15 | Nonconformities, corrective action plans |

All mutations go through a human approval queue — the AI proposes changes, humans approve them.

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (shared with the NestJS server)
- Anthropic API key

### 1. Configure

The gateway reads settings from two sources, with database config taking priority:

**Database settings** (managed via Settings > AI Assistant in the web UI):
- Anthropic API key (stored encrypted)
- Model selection
- Gateway URL
- Max agent turns

**Environment variables** (fallback):

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/riskready

# Optional — overridden by database settings if configured
ANTHROPIC_API_KEY=sk-ant-...        # Anthropic API key
AGENT_MODEL=claude-haiku-4-5-20251001  # Claude model ID
GATEWAY_PORT=3100                   # HTTP port (default: 3100)
LOG_LEVEL=info                      # debug | info | warn | error
GATEWAY_SECRET=                     # Optional shared secret for request auth
ENCRYPTION_KEY=                     # Or JWT_SECRET — for decrypting DB-stored API keys

# Queue tuning
QUEUE_MAX_DEPTH=5                   # Max queued jobs per user
QUEUE_TIMEOUT_MS=300000             # Job timeout (5 min)

# Skill registry
SKILLS_CONFIG=./skills.yaml         # Path to MCP server definitions
SKILL_IDLE_MS=600000                # Idle timeout before reaping MCP processes
```

### 2. Install dependencies

```bash
cd gateway
npm install --legacy-peer-deps
```

The `postinstall` script symlinks the Prisma client from `apps/server/node_modules` — make sure the server dependencies are installed and `prisma generate` has been run first.

### 3. Run the database migration

```bash
cd apps/server
npx prisma migrate dev
```

This creates the gateway tables: `ChatConversation`, `ChatMessage`, `Memory`, and `GatewayConfig`.

### 4. Start the gateway

```bash
cd gateway
npm start
# or for development with hot-reload:
npm run dev
```

The gateway starts on port 3100 (configurable via `GATEWAY_PORT`).

### 5. Verify

```bash
curl http://localhost:3100/health
# → {"status":"ok","adapter":"internal","timestamp":"..."}
```

---

## API Endpoints

### `POST /dispatch`

Start a new AI conversation turn.

```json
{
  "userId": "user-id",
  "organisationId": "org-id",
  "conversationId": "optional-conversation-id",
  "text": "Show me all controls that are not yet implemented"
}
```

**Response** (202 Accepted):
```json
{
  "runId": "uuid"
}
```

### `GET /stream/:runId`

SSE stream for real-time events. Events:

| Event type | Description |
|------------|-------------|
| `text_delta` | Incremental text from the AI |
| `tool_start` | MCP tool invocation started |
| `tool_done` | MCP tool invocation completed |
| `action_proposed` | A mutation was proposed (needs human approval) |
| `block` | Structured UI block (control_table, etc.) |
| `done` | Conversation turn complete, includes `messageId` |
| `error` | Error occurred |

### `POST /cancel/:runId`

Cancel a running conversation turn.

### `GET /health`

Health check endpoint.

---

## AI Assistant Settings

The gateway supports runtime configuration via the `GatewayConfig` database table, managed through the web UI at **Settings > AI Assistant**.

### How it works

1. User configures settings in the web UI (API key, model, max turns, gateway URL)
2. The NestJS server encrypts the API key with AES-256-GCM and stores it in `GatewayConfig`
3. On each conversation turn, the gateway's `AgentRunner` calls `loadFirstDbConfig()` to read the latest settings
4. If no database config exists, it falls back to environment variables

### Available models

| Model ID | Description |
|----------|-------------|
| `claude-haiku-4-5-20251001` | Fast and cost-effective. Good for routine GRC queries. |
| `claude-sonnet-4-5-20250929` | Balanced performance. Good for complex analysis. |
| `claude-opus-4-20250514` | Most capable. Best for nuanced compliance assessments. |

### API key security

- API keys are encrypted at rest using AES-256-GCM
- The encryption key is derived from `ENCRYPTION_KEY` (or `JWT_SECRET`) using scrypt
- The web UI only ever displays a masked version (e.g., `sk-a...xyzw`)
- Both the NestJS server and gateway must share the same encryption key env var

---

## MCP Server Configuration

MCP servers are defined in `skills.yaml`:

```yaml
skills:
  - name: riskready-controls
    description: "Security controls, SOA, assessments, metrics, gap analysis"
    tags: [grc, controls, compliance, soa, iso27001]
    capabilities: [query, mutation]
    command: npx
    args: [tsx, ../mcp-server-controls/src/index.ts]
    requiresDb: true

  - name: riskready-risks
    description: "Risk register, scenarios, KRIs, tolerance, treatment plans"
    tags: [grc, risk, kri, treatment, scenarios]
    capabilities: [query, mutation]
    command: npx
    args: [tsx, ../mcp-server-risks/src/index.ts]
    requiresDb: true

  # + 6 more: evidence, policies, organisation, itsm, audits, incidents
```

The skill registry hot-reloads `skills.yaml` when changes are detected.

---

## Database Models

### ChatConversation

Stores conversation metadata. One per chat session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | CUID primary key |
| `title` | String? | Auto-set from first user message |
| `userId` | String | User who started the conversation |
| `organisationId` | String | Organisation context |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last activity timestamp |

### ChatMessage

Stores individual messages in a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | CUID primary key |
| `conversationId` | String | FK to ChatConversation |
| `role` | ChatRole | `USER` or `ASSISTANT` |
| `content` | Text | Message text |
| `toolCalls` | Json? | Array of tool calls made |
| `actionIds` | String[] | IDs of proposed mutations |
| `blocks` | Json? | Structured UI blocks extracted |
| `inputTokens` | Int? | Token usage tracking |
| `outputTokens` | Int? | Token usage tracking |
| `model` | String? | Model used for this response |

### Memory

Long-term memory extracted from conversations via LLM distillation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | CUID primary key |
| `type` | MemoryType | `PREFERENCE`, `CONTEXT`, or `KNOWLEDGE` |
| `content` | Text | Memory content |
| `tags` | String[] | Search tags |
| `source` | String | How this memory was created |
| `organisationId` | String | Organisation scope |
| `userId` | String? | User scope (null = org-wide) |
| `search_vector` | tsvector | PostgreSQL full-text search index |

### GatewayConfig

Per-organisation AI assistant settings. Singleton per org (unique constraint on `organisationId`).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | cuid() | Primary key |
| `organisationId` | String | — | Unique per org |
| `anthropicApiKey` | Text? | null | AES-256-GCM encrypted |
| `agentModel` | String | `claude-haiku-4-5-20251001` | Claude model ID |
| `gatewayUrl` | String | `http://localhost:3100` | Gateway base URL |
| `maxAgentTurns` | Int | 25 | Max tool-use loops per request |

---

## Conversation Flow

```
User sends message
       │
       ▼
  POST /dispatch
       │
       ▼
  InternalAdapter creates UnifiedMessage
       │
       ▼
  LaneQueue enqueues job (per-user sequential)
       │
       ▼
  AgentRunner.execute()
       │
       ├── Load DB config (model, API key, max turns)
       ├── Save user message to ChatMessage
       ├── Auto-title conversation if first message
       ├── Build conversation history (last 20 messages)
       ├── Recall relevant memories (full-text search)
       ├── Build prompt with context
       │
       ▼
  Claude Agent SDK query loop
       │
       ├── Stream text_delta events → SSE
       ├── MCP tool calls → tool_start/tool_done events
       ├── Extract structured blocks from tool results
       ├── Detect proposed mutations → action_proposed events
       │
       ▼
  Save assistant message to ChatMessage
       │
       ├── Track token usage
       ├── Store tool calls, action IDs, blocks
       │
       ▼
  Emit 'done' event
       │
       ▼
  (Background) Distill memories from conversation
```

---

## Docker

The `Dockerfile` builds a production image with the gateway and all 8 MCP servers bundled:

```bash
# Build from project root
docker build -f gateway/Dockerfile -t riskready-gateway .

# Run
docker run -p 3100:3100 \
  -e DATABASE_URL=postgresql://... \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e JWT_SECRET=your-secret \
  riskready-gateway
```

---

## Development

### Run tests

```bash
cd gateway
npm test
```

### Type check

```bash
cd gateway
npx tsc --noEmit
```

### Project structure

```
gateway/
├── src/
│   ├── main.ts                    # Entry point
│   ├── config.ts                  # Environment config loader
│   ├── gateway.ts                 # Main orchestrator class
│   ├── prisma.ts                  # Prisma client singleton
│   ├── logger.ts                  # Pino logger
│   ├── db-config.ts               # DB config loader (decrypt + fallback)
│   ├── agent/
│   │   ├── agent-runner.ts        # Claude Agent SDK orchestration
│   │   ├── system-prompt.ts       # System prompt for the AI
│   │   ├── block-extractor.ts     # Structured block extraction
│   │   └── skill-registry.ts      # YAML-based MCP server registry
│   ├── channels/
│   │   ├── internal.adapter.ts    # Fastify HTTP/SSE adapter
│   │   ├── channel.interface.ts   # Adapter interface
│   │   └── types.ts               # Shared types
│   ├── router/
│   │   └── router.ts             # Keyword-based skill routing
│   ├── queue/
│   │   ├── lane-queue.ts         # Per-user job queue
│   │   └── types.ts              # Queue types
│   ├── run/
│   │   └── run-manager.ts        # SSE event buffer + subscribers
│   └── memory/
│       ├── memory.service.ts     # Memory CRUD
│       ├── search.service.ts     # Hybrid full-text + vector search
│       └── distiller.ts          # LLM-based memory extraction
├── skills.yaml                    # MCP server definitions
├── Dockerfile                     # Production container
├── package.json
└── tsconfig.json
```
