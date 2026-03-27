# Connection Modes — Feature Comparison

RiskReady supports three ways to connect AI to your GRC data. Each mode has different trade-offs between features, security, and cost.

## Quick Summary

| Mode | Best For | AI Cost | Security |
|------|----------|---------|:--------:|
| **Web App (Gateway)** | Full platform experience, council, autonomous workflows | You pay per token | 8.1/10 |
| **MCP Proxy (Claude Desktop)** | Team use, remote access, zero AI cost | $0 (user's subscription) | 8.9/10 |
| **Direct (stdio)** | Local development, quick testing | $0 (user's subscription) | 2.3/10 |

## Detailed Comparison

### AI & Cost

| | Web App (Gateway) | MCP Proxy | Direct (stdio) |
|--|:--:|:--:|:--:|
| Brain | Your gateway (Anthropic API) | Claude Desktop (user's subscription) | Claude Desktop (user's subscription) |
| AI cost to you | You pay per token | $0 | $0 |
| Tools available | 254 (tool search + defer_loading) | 254 (filtered by key scopes) | 254 (no filtering) |
| Token tracking | Per message, per council member | N/A (user's subscription) | None |
| Prompt caching | Yes (`cache_control: ephemeral`) | N/A | N/A |
| Tool search (96% token reduction) | Yes | N/A (Claude Desktop handles discovery) | N/A |

### Authentication & Authorization

| | Web App (Gateway) | MCP Proxy | Direct (stdio) |
|--|:--:|:--:|:--:|
| Authentication | JWT + session cookies | Per-user API key (`rr_sk_`) | None |
| Org scoping | Forced by gateway | Forced by proxy | Manual |
| Per-tool permissions | No (all tools per user) | Yes (read/write/domain scopes) | No |
| API key revocation | N/A | Yes (instant, from Settings UI) | N/A |

### AI Features

| | Web App (Gateway) | MCP Proxy | Direct (stdio) |
|--|:--:|:--:|:--:|
| AI Agents Council | Yes (6 specialists deliberate) | No (single agent) | No |
| Scheduled autonomous runs | Yes (cron via SchedulerService) | No | No |
| Event-triggered runs | Yes (incident.created, etc.) | No | No |
| Conversation persistence | Yes (PostgreSQL) | No (stateless) | No (Claude Desktop local) |
| Memory recall | Yes (hybrid search across conversations) | No | No |
| Streaming UI | Yes (SSE to browser) | Claude Desktop native | Claude Desktop native |

### Security Controls

| | Web App (Gateway) | MCP Proxy | Direct (stdio) |
|--|:--:|:--:|:--:|
| Human approval workflow | Full UI (approve/reject in browser) | Actions queue in web app | Actions queue in web app |
| Grounding guard | Yes (catches hallucinated failures) | No (can't see Claude's response) | No |
| Credential scanning | Yes (before saving to DB) | Yes (on tool results) | No |
| PII redaction | Yes (on stored messages) | Yes (on tool results) | No |
| Rate limiting | 30/user/hour, 100/org/hour | 100 calls/min per key | None |
| Anomaly detection | Yes (200 calls/hour threshold) | Yes (same threshold) | No |
| Audit logging | Token usage + tool calls | Tool call logs (user, tool, org, duration) | None |
| Source tracking | Yes (`source: 'web_ui'`) | Yes (`source: 'mcp_proxy'`) | No |
| Action severity tiers | Yes (low/medium/high/critical) | Yes (same classification) | No |
| Memory injection scanning | Yes (before storing distilled memories) | N/A (stateless) | No |

### Infrastructure

| | Web App (Gateway) | MCP Proxy | Direct (stdio) |
|--|:--:|:--:|:--:|
| Network access | Browser to server | Remote (LAN, VPN, Tailscale) | Local only |
| Setup | Docker Compose | 1 API key + 1 config entry | 9 config entries + local Node.js |
| Dependencies | Docker | `mcp-remote` npm package | Node.js 20+, project deps installed |
| Requires Docker running | Yes | Yes (server-side) | Only for PostgreSQL |

### Security Audit Scores

Based on the [8-point agent security framework](AGENT_SECURITY_AUDIT.md):

| Point | Web App (Gateway) | MCP Proxy | Direct (stdio) |
|-------|:--:|:--:|:--:|
| 1. Identity & Authorization | 9/10 | 10/10 | 1/10 |
| 2. Memory & Data Retention | 7/10 | 8/10 | 1/10 |
| 3. Tool Trust & Indirect Injection | 9/10 | 9/10 | 7/10 |
| 4. Blast Radius | 8/10 | 10/10 | 3/10 |
| 5. Human Checkpoints | 9/10 | 8/10 | 4/10 |
| 6. Output Validation | 8/10 | 7/10 | 1/10 |
| 7. Cost Controls | 7/10 | 10/10 | 1/10 |
| 8. Observability | 8/10 | 9/10 | 1/10 |
| **Overall** | **8.1/10** | **8.9/10** | **2.3/10** |

## When to Use Each Mode

**Web App (Gateway)** — Use when you need the full platform: council deliberations, scheduled workflows, conversation persistence, streaming UI, and full observability. Best for production deployments where you control the AI costs.

**MCP Proxy** — Use when your team wants AI-powered GRC without you paying for API tokens. Each user brings their own Claude subscription. Full security controls via API keys with per-tool scoping. Best for team deployments and remote access.

**Direct (stdio)** — Use for local development and quick testing only. No security controls, no audit trail, no rate limiting. Never use in production or shared environments.

## Setup Guides

- **Web App**: [Deployment Guide](DEPLOYMENT.md)
- **MCP Proxy**: [Claude Desktop Integration — Remote Connection](CLAUDE_DESKTOP_INTEGRATION.md#option-3-remote-connection-mcp-proxy)
- **Direct**: [Claude Desktop Integration — Local Connection](CLAUDE_DESKTOP_INTEGRATION.md#option-1-claude-desktop)
