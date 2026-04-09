# Claude Desktop Integration

Connect Claude Desktop (or any MCP-compatible client) to RiskReady Community Edition. Choose the connection mode that fits your setup.

> **New to the differences?** See the [Connection Modes comparison](CONNECTION_MODES.md) for a full feature matrix.

---

## Table of Contents

- [Option 1: Claude Desktop (Local, stdio)](#option-1-claude-desktop)
- [Option 2: Claude Code (Local, stdio)](#option-2-claude-code)
- [Option 3: Remote Connection (MCP Proxy)](#option-3-remote-connection-mcp-proxy)
- [Option 4: Any MCP Client (stdio)](#option-4-any-mcp-client)
- [API Key Management](#api-key-management)
- [Security Scopes Reference](#security-scopes-reference)
- [Troubleshooting](#troubleshooting)

---

## Option 1: Claude Desktop

Direct stdio connection. Each MCP server runs as a local process with direct database access. Requires Node.js 20+ and the repository cloned locally.

### Prerequisites

- Node.js 20+
- Repository cloned and dependencies installed (`npm install`)
- PostgreSQL running (via Docker Compose or standalone)

### Config File Location

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Configuration

Add all 9 servers. Replace `/path/to/riskready-community` with your actual repo path:

```json
{
  "mcpServers": {
    "riskready-risks": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-risks/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-policies": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-policies/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-evidence": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-evidence/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-incidents": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-incidents/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-audits": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-audits/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-itsm": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-itsm/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-organisation": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-organisation/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-agent-ops": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-agent-ops/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### What You Get

- 254 tools across 9 GRC domains (risks, controls, policies, evidence, incidents, audits, ITSM, organisation, agent-ops)
- 33 resources (markdown reference documents for AI context)
- 26 prompts (guided multi-step GRC workflows)
- Human-in-the-loop: all mutations create `McpPendingAction` records requiring approval in the web UI

### Limitations

- No rate limiting, audit logging, or credential scanning
- No organisation scoping enforcement (tools operate on all data)
- Database credentials stored in plain text in the config file
- Not suitable for shared or production environments

---

## Option 2: Claude Code

RiskReady ships with a pre-configured `.mcp.json` at the repo root. Open Claude Code in the project directory and the servers are available automatically.

Or add servers manually:

```bash
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

Set the `DATABASE_URL` environment variable to point to your PostgreSQL instance.

---

## Option 3: Remote Connection (MCP Proxy)

Connect Claude Desktop to a running RiskReady instance over the network. No repo clone, no Node.js, no local database required. The gateway exposes an MCP-compatible endpoint at `POST /mcp` that bridges JSON-RPC requests to the MCP servers running inside the gateway container.

### How It Works

```
Claude Desktop  -->  mcp-remote (npm)  -->  HTTPS POST /mcp  -->  RiskReady Gateway
                                                                    |
                                                           API key validation
                                                           Scope filtering
                                                           Rate limiting
                                                           Credential scanning
                                                                    |
                                                           MCP server (stdio)
                                                                    |
                                                              PostgreSQL
```

1. Claude Desktop spawns `mcp-remote` as a stdio bridge
2. `mcp-remote` converts MCP stdio messages to HTTP POST requests
3. Gateway validates the Bearer API key (bcrypt comparison)
4. Organisation and user are resolved from the API key
5. Tools are filtered by the key's permission scopes
6. Tool calls are routed to the appropriate MCP server with enforced org scoping
7. Results are credential-scanned before returning

### Prerequisites

- A running RiskReady instance with the gateway enabled (see [Deployment Guide](DEPLOYMENT.md))
- An MCP API key (created from the web UI)
- `npx` available locally (comes with Node.js)

### Step 1: Create an API Key

1. Log in to the RiskReady web UI
2. Go to **Settings > AI Configuration**
3. Click **Create MCP API Key**
4. Give the key a descriptive name (e.g., "Alice's Claude Desktop")
5. Select the appropriate scopes (see [Security Scopes Reference](#security-scopes-reference))
6. Copy the generated key (starts with `rr_sk_`) -- it is shown only once

### Step 2: Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "riskready": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-riskready-instance.com/gateway/mcp",
        "--header",
        "Authorization: Bearer rr_sk_your_api_key_here"
      ]
    }
  }
}
```

Replace:
- `your-riskready-instance.com` with your actual RiskReady domain
- `rr_sk_your_api_key_here` with the key from Step 1

For local development (Docker Compose on the same machine):

```json
{
  "mcpServers": {
    "riskready": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3100/mcp",
        "--header",
        "Authorization: Bearer rr_sk_your_api_key_here"
      ]
    }
  }
}
```

Restart Claude Desktop after saving.

### Step 3: Verify

Open Claude Desktop and ask:

> "List all risks in the risk register"

If the connection is working, Claude will call `mcp__riskready-risks__list_risks` and return data from your RiskReady instance.

### What You Get

- Single config entry (instead of 9 servers)
- All 254 tools, filtered by your API key's scopes
- Automatic organisation scoping (bound to the API key)
- Rate limiting: 100 calls/minute per key
- Credential scanning on all tool results
- Full audit trail (tool calls logged with user, org, tool name, duration)
- Zero AI cost to the RiskReady operator (uses the user's Claude subscription)
- Human-in-the-loop: mutations still create `McpPendingAction` records in the web UI

### Local vs Remote Comparison

| | Local (stdio) | Remote (MCP Proxy) |
|---|---|---|
| Database access | Direct (MCP servers connect to PostgreSQL) | Via gateway (API key authenticated) |
| Node.js required | Yes (on your machine) | No (only `npx mcp-remote`) |
| Rate limiting | None | 100 calls/minute per key |
| Organisation scoping | Manual (`organisationId` parameter) | Automatic (bound to API key) |
| Credential scanning | None | Yes (redacts secrets from tool results) |
| Audit logging | None | Yes (user, tool, org, duration) |
| Per-tool permissions | No (all 254 tools) | Yes (scoped by API key) |
| Config entries | 9 servers | 1 server |

---

## Option 4: Any MCP Client

Any MCP-compatible client can connect to individual servers via stdio:

```bash
DATABASE_URL="postgresql://riskready:riskready@localhost:5434/riskready" \
  npx tsx apps/mcp-server-risks/src/index.ts
```

The server communicates via stdin/stdout using MCP JSON-RPC 2.0.

---

## API Key Management

API keys are managed from the RiskReady web UI under **Settings > AI Configuration**.

### Key Format

Keys use the format `rr_sk_` followed by 40 hex characters:

```
rr_sk_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

### Security

- The full key is displayed **once** at creation time
- Only the prefix (`rr_sk_ab`) and a bcrypt hash are stored in the database
- Keys are validated with timing-safe comparison
- `lastUsedAt` is updated on each successful use
- Keys can be revoked instantly from the web UI (sets `revokedAt` timestamp)

### Key Lifecycle

| Action | How |
|--------|-----|
| Create | Settings > AI Configuration > Create MCP API Key |
| List | Settings > AI Configuration (shows name, prefix, scopes, last used) |
| Revoke | Click revoke on any key (takes effect immediately) |

---

## Security Scopes Reference

API keys can be scoped to limit which tools are accessible.

### Available Scopes

| Scope | Effect |
|-------|--------|
| `all` | Full access to all tools (read + write) across all domains |
| `read` | Read-only tools across all domains (`list_*`, `get_*`, `search_*`) |
| `write` | Write tools across all domains (`propose_*`) |
| `risks` | All tools in the risks domain |
| `controls` | All tools in the controls domain |
| `policies` | All tools in the policies domain |
| `evidence` | All tools in the evidence domain |
| `incidents` | All tools in the incidents domain |
| `audits` | All tools in the audits domain |
| `itsm` | All tools in the ITSM domain |
| `organisation` | All tools in the organisation domain |
| `agent-ops` | All tools in the agent-ops domain |

### Combining Scopes

Scopes combine with AND logic when mixing access levels with domains:

| Scopes | Result |
|--------|--------|
| `["all"]` | Everything (default) |
| `["read"]` | Read-only across all domains |
| `["risks"]` | Full access to risk tools only |
| `["read", "risks"]` | Read-only risk tools only |
| `["write", "risks", "controls"]` | Write tools in risks and controls only |
| `["risks", "controls", "evidence"]` | Full access to 3 domains |

### Recommended Configurations

| Use Case | Scopes |
|----------|--------|
| Auditor (view only) | `["read"]` |
| Risk manager | `["risks"]` |
| Compliance analyst | `["read", "controls", "policies", "audits"]` |
| Evidence collector | `["evidence"]` |
| Full access (admin) | `["all"]` |

---

## Troubleshooting

### MCP Proxy (Option 3)

**"Missing or invalid Authorization header"**
- Ensure the `--header` argument includes `Authorization: Bearer ` (with a space before the key)
- Check that the key starts with `rr_sk_`

**"Invalid API key"**
- The key may have been revoked -- check Settings > AI Configuration
- Ensure you copied the full key (42 characters: `rr_sk_` + 40 hex chars)

**"Rate limit exceeded (100 calls/minute)"**
- Wait 60 seconds before retrying
- Consider whether your queries are triggering excessive tool calls

**"Tool not permitted by API key scopes"**
- Your API key's scopes don't include the requested tool's domain or access level
- Check your key's scopes in Settings > AI Configuration

**Connection refused / timeout**
- Verify the gateway is running: `curl http://localhost:3100/health`
- For remote connections, check firewall rules and ensure HTTPS is configured
- If using Caddy (production), confirm `/gateway/*` routing is in the Caddyfile

### Local stdio (Options 1, 2, 4)

**"Cannot find module" or "tsx not found"**
- Run `npm install` in the repository root
- Ensure Node.js 20+ is installed

**Database connection errors**
- Verify PostgreSQL is running: `docker compose ps db`
- Check the `DATABASE_URL` matches your setup (default port: 5434)
- Test connectivity:

```bash
DATABASE_URL="postgresql://riskready:riskready@localhost:5434/riskready" \
  npx tsx -e "import { PrismaClient } from './apps/server/node_modules/@prisma/client/index.js'; const p = new PrismaClient(); p.\$connect().then(() => console.log('OK')).catch(console.error)"
```

**No tools appearing in Claude Desktop**
- Restart Claude Desktop after saving config changes
- Check Claude Desktop logs for MCP connection errors
- Verify the server starts without errors by running it directly in a terminal
