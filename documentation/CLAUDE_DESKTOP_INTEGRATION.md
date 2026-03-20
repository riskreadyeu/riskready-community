# Connecting RiskReady to Claude Desktop & Claude Code

RiskReady's 9 MCP servers expose 254 GRC tools that any MCP-compatible client can use directly. This guide covers how to connect **Claude Desktop**, **Claude Code**, or any MCP client to your RiskReady database — turning Claude into your GRC co-worker.

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Option 1: Claude Desktop](#option-1-claude-desktop)
- [Option 2: Claude Code](#option-2-claude-code)
- [Option 3: Any MCP Client](#option-3-any-mcp-client)
- [Database Connection](#database-connection)
- [What You Get](#what-you-get)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Claude Desktop / Claude Code / Any MCP Client           │
│  (the "brain" — Claude reasons, plans, and calls tools)  │
└────────────┬─────────┬─────────┬─────────┬───────────────┘
             │         │         │         │
      ┌──────▼───┐ ┌───▼────┐ ┌─▼──────┐ ┌▼────────┐
      │ Risks    │ │Controls│ │Policies│ │ 6 more  │
      │ MCP      │ │ MCP    │ │ MCP    │ │ servers │
      │ Server   │ │ Server │ │ Server │ │  ...    │
      └──────┬───┘ └───┬────┘ └─┬──────┘ └┬────────┘
             │         │        │          │
             └─────────┴────┬───┴──────────┘
                            │
                    ┌───────▼────────┐
                    │  PostgreSQL    │
                    │  (your GRC    │
                    │   database)   │
                    └───────────────┘
```

**How it works:** Claude Desktop or Claude Code spawns the MCP servers as local processes on your machine. Each server connects directly to your PostgreSQL database. Claude discovers the available tools, reasons about your question, and calls the right tools to query or propose changes to your GRC data.

**No gateway needed.** The web app's gateway (which adds approval workflows, council deliberation, and streaming UI) is separate. When using Claude Desktop/Code directly, you get raw tool access — faster, but without the human-in-the-loop approval layer.

---

## Prerequisites

1. **Node.js 20+** installed on your machine
2. **RiskReady database running** — either via Docker or a remote PostgreSQL
3. **Dependencies installed** — run `npm install` in the project root
4. **Claude Desktop** or **Claude Code** installed

---

## Option 1: Claude Desktop

### Step 1: Find your config file

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Step 2: Add the MCP servers

Replace the contents of your config file with the following. Update the paths and `DATABASE_URL` to match your setup:

```json
{
  "mcpServers": {
    "riskready-risks": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-risks/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-policies": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-policies/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-evidence": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-evidence/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-incidents": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-incidents/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-audits": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-audits/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-itsm": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-itsm/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-organisation": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-organisation/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    },
    "riskready-agent-ops": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-agent-ops/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5545/riskready?schema=public"
      }
    }
  }
}
```

### Step 3: Update the paths

Replace `/path/to/riskready-community` with the actual path to your cloned repo. For example:

- **Linux:** `/home/daniel/projects/riskready-community`
- **macOS:** `/Users/daniel/projects/riskready-community`
- **Windows:** `C:\\Users\\daniel\\projects\\riskready-community`

### Step 4: Restart Claude Desktop

Quit and reopen Claude Desktop. You should see the MCP server icons in the chat input area, confirming the 9 servers are connected.

### Step 5: Start chatting

Try: *"Show me the top risks in my register"*

Claude will discover the risk tools, query your database, and present the results — all within Claude Desktop's native interface.

---

## Option 2: Claude Code

Claude Code reads MCP configuration from `.mcp.json` in the project root.

### Step 1: The config is already there

RiskReady ships with a pre-configured `.mcp.json` that points to all 9 MCP servers:

```bash
cd /path/to/riskready-community
cat .mcp.json
```

### Step 2: Update the DATABASE_URL

Edit `.mcp.json` to match your PostgreSQL connection:

```bash
# If using Docker Compose (default port from .env.example)
sed -i 's|localhost:5434|localhost:5545|g' .mcp.json
```

### Step 3: Open Claude Code in the project

```bash
cd /path/to/riskready-community
claude
```

Claude Code automatically discovers the `.mcp.json` and connects to all 9 MCP servers. You'll see the tools available in your session.

### Step 4: Use it as a GRC co-worker

```
> Show me all risks with residual score above 8
> What controls are linked to the ransomware scenario?
> Propose a new risk for insider threat — I'll approve it
> Give me a comprehensive review of our security posture
```

---

## Option 3: Any MCP Client

Any tool that supports the MCP protocol (stdio transport) can connect to RiskReady's servers. Each server is a standalone Node.js process:

```bash
# Spawn a single server
DATABASE_URL="postgresql://riskready:riskready@localhost:5545/riskready" \
  npx tsx apps/mcp-server-risks/src/index.ts
```

The server communicates via stdin/stdout using the MCP JSON-RPC protocol. Configure your client to spawn the process with the command and args above.

---

## Database Connection

The MCP servers connect directly to PostgreSQL. The `DATABASE_URL` must point to a running database with the RiskReady schema.

### Docker Compose (recommended)

If you're running RiskReady via Docker Compose, the database is exposed on the port configured in `.env`:

```bash
# Check your .env for DB_PORT (default: 5434)
DATABASE_URL=postgresql://riskready:riskready@localhost:5434/riskready?schema=public
```

If using the test/fresh install clone:
```bash
# Port 5545 is common for test clones
DATABASE_URL=postgresql://riskready:riskready@localhost:5545/riskready?schema=public
```

### Remote Database

For a remote PostgreSQL (e.g. AWS RDS, Supabase):
```bash
DATABASE_URL=postgresql://user:password@hostname:5432/riskready?schema=public&sslmode=require
```

### Verify connectivity

```bash
# Quick test — should return the risk count
DATABASE_URL="postgresql://riskready:riskready@localhost:5545/riskready" \
  npx tsx -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.risk.count().then(c => { console.log('Risks:', c); p.\$disconnect(); });
  "
```

---

## What You Get

### 9 MCP Servers — 254 Tools

| Server | Domain | Example Tools |
|--------|--------|--------------|
| `riskready-risks` | Risk Management | `list_risks`, `get_risk_dashboard`, `get_risk_heatmap`, `propose_create_risk` |
| `riskready-controls` | Control Management | `list_controls`, `get_gap_analysis`, `get_effectiveness_report`, `propose_assessment` |
| `riskready-policies` | Policies & Compliance | `list_policy_documents`, `get_policy_compliance_matrix`, `propose_create_policy` |
| `riskready-evidence` | Evidence Management | `list_evidence`, `get_evidence_coverage`, `propose_create_evidence` |
| `riskready-incidents` | Incident Management | `list_incidents`, `get_incident_stats`, `get_mttr_report`, `propose_create_incident` |
| `riskready-audits` | Audit & Nonconformities | `list_nonconformities`, `get_nc_stats`, `propose_create_nc` |
| `riskready-itsm` | ITSM / CMDB | `list_assets`, `list_changes`, `get_itsm_dashboard`, `propose_asset` |
| `riskready-organisation` | Organisation & Governance | `get_organisation_profile`, `list_departments`, `get_regulatory_profile` |
| `riskready-agent-ops` | Agent Self-Awareness | `check_action_status`, `list_pending_actions`, `create_agent_task` |

### Read vs Write Tools

- **Read tools** (`list_*`, `get_*`, `search_*`): Query data directly — no approval needed
- **Write tools** (`propose_*`): Create a pending action in the database. In the web app, these require human approval. In Claude Desktop/Code, they execute immediately via the MCP server.

> **Note:** When using Claude Desktop or Claude Code directly (without the web app gateway), `propose_*` tools create `McpPendingAction` records in the database with status `PENDING`. These can be reviewed and approved in the web app's AI Approvals page, or you can ask the agent to check their status via `check_action_status`.

---

## Security Considerations

### Direct database access

Claude Desktop/Code MCP servers connect directly to your database. This means:

- **No authentication layer** — anyone with the `DATABASE_URL` has full read/write access
- **No organisation scoping** — the MCP tools require `organisationId` as a parameter, but there's no enforcement at the connection level
- **No rate limiting** — no gateway throttling on tool calls

### Recommendations

1. **Local development only** — use this integration for local development and testing, not production
2. **Don't expose your database port** to the internet when using this integration
3. **Use read-only credentials** if you only need query access:
   ```sql
   CREATE USER riskready_reader WITH PASSWORD 'readonly';
   GRANT USAGE ON SCHEMA public TO riskready_reader;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO riskready_reader;
   ```
4. **For production use** — use the web app with its full security stack (JWT auth, org scoping, approval workflows, rate limiting)

---

## Troubleshooting

### "Can't reach database server"

The database isn't running or the port is wrong:

```bash
# Check if PostgreSQL is listening
docker ps | grep postgres

# Verify the port
docker port $(docker ps -q --filter name=db) 5432
```

### "Module not found" errors

Dependencies aren't installed:

```bash
cd /path/to/riskready-community
npm install

# Or install per-server
cd apps/mcp-server-risks && npm install
```

### Claude Desktop doesn't show the MCP servers

- Verify the config file path is correct for your OS
- Check the JSON syntax is valid (no trailing commas)
- Restart Claude Desktop completely (quit, not just close)
- Check Claude Desktop logs for MCP connection errors

### "organisationId is required"

Most tools need an `organisationId`. Ask Claude to find it first:

*"What organisations exist in the database?"*

Or query directly:
```bash
DATABASE_URL="..." npx tsx -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.organisationProfile.findMany({ select: { id: true, name: true } })
    .then(o => { console.log(o); p.\$disconnect(); });
"
```

---

## Example Conversations

### Quick risk overview
```
You: Show me all risks with a residual score above 8
Claude: [calls list_risks, get_risk_dashboard]
        Here are your high-risk items: R-01 Ransomware (score 9), R-03 API breach (score 10)...
```

### Cross-domain analysis
```
You: Which controls are failing and what risks do they affect?
Claude: [calls get_gap_analysis, list_risks, get_risk_heatmap]
        3 controls failed in the latest assessment. Here's how they map to your risks...
```

### Propose changes
```
You: Create a new risk for remote work data leakage
Claude: [calls propose_create_risk]
        Proposed risk R-WFH-001 created. Action ID: cmm...
        Check the AI Approvals page to approve it, or ask me to check its status.
```

### Board report (Claude Code with all 9 servers)
```
You: Give me a comprehensive security posture review
Claude: [calls 20+ tools across risks, controls, policies, incidents, evidence]
        # Security Posture Report
        ## Risk Landscape: 15 risks, 6 in treatment...
        ## Control Coverage: 75% implemented, 3 critical gaps...
        ## Compliance: ISO 88%, DORA 72%, NIS2 79%...
```
