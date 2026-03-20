# AI Agents Council — Performance Benchmarks

Real-world benchmarks from the RiskReady AI Agents Council running against a live GRC database with 15 risks, 40 controls, 30 scenarios, 8 KRIs, and 12 active incidents.

## Token Usage: Before & After Tool Search

The gateway was refactored from the Claude Agent SDK to the raw Anthropic Messages API with `tool_search_tool_bm25` and `defer_loading: true`.

| Metric | Before (Agent SDK) | After (Tool Search) | Reduction |
|--------|-------------------|---------------------|-----------|
| Input tokens per request | 228,610 | 8,586 | **96.2%** |
| Tool definitions in context | ~77k tokens (253 tools) | ~500 tokens (search tool only) | **99.4%** |
| Typical first request | ~228k tokens | ~1.4k tokens | **99.4%** |
| Request with tool calls | ~230k tokens | ~4-8k tokens | **96-98%** |

## Single Agent — Cost Per Query

Tested with "Show me the top risks" on Haiku 4.5:

| Metric | Value |
|--------|-------|
| Input tokens | 3,999 |
| Output tokens | 948 |
| Tool calls | 1 (propose_create_risk) |
| **Total cost** | **~$0.007** |

## AI Agents Council — Haiku 4.5

Full council deliberation with "Give me a comprehensive review of our security posture":

| Council Member | Input Tokens | Output Tokens | Total | Tool Calls | Cost |
|---------------|-------------|---------------|-------|------------|------|
| risk-analyst | 1,269 | 3,493 | 4,762 | 0 | $0.015 |
| controls-auditor | 1,257 | 1,985 | 3,242 | 0 | $0.009 |
| incident-commander | 1,259 | 463 | 1,722 | 0 | $0.003 |
| compliance-officer | 31,230 | 6,856 | 38,086 | 13 | $0.052 |
| evidence-auditor | 50,496 | 8,254 | 58,750 | 19 | $0.073 |
| CISO synthesis | 3,920 | 9,488 | 13,408 | 0 | $0.042 |
| **Total** | **89,431** | **30,539** | **119,970** | **32** | **~$0.19** |

**Observations:**
- 2 out of 5 members successfully used tools (compliance-officer: 13 tools, evidence-auditor: 19 tools)
- 3 members provided analysis based on general knowledge without querying tools
- Total deliberation time: ~2 minutes
- Confidence level: medium

## AI Agents Council — Opus 4.6

Same query, same database:

| Council Member | Input Tokens | Output Tokens | Total | Tool Calls | Cost |
|---------------|-------------|---------------|-------|------------|------|
| risk-analyst | 80,126 | 7,279 | 87,405 | 14 | $1.75 |
| controls-auditor | 96,661 | 7,119 | 103,780 | 21 | $1.98 |
| compliance-officer | 82,739 | 8,660 | 91,399 | 24 | $1.89 |
| incident-commander | 85,616 | 8,230 | 93,846 | 28 | $1.90 |
| evidence-auditor | ~80,000 | ~7,000 | ~87,000 | ~15 | ~$1.73 |
| CISO synthesis | ~5,000 | ~10,000 | ~15,000 | 0 | ~$0.83 |
| **Total** | **~430,000** | **~48,000** | **~478,000** | **~102** | **~$10.08** |

**Observations:**
- All 5 members successfully used tools (14-28 calls each)
- Every member produced structured findings with specific record IDs, evidence citations, and severity ratings
- Total deliberation time: ~4 minutes
- Confidence level: high

## Model Comparison

| Dimension | Haiku 4.5 | Opus 4.6 |
|-----------|-----------|----------|
| **Cost per council** | $0.19 | $10.08 |
| **Tool discovery** | 2/5 members | 5/5 members |
| **Total tool calls** | 32 | ~102 |
| **Analysis quality** | Medium — some generic | High — all data-backed |
| **Deliberation time** | ~2 min | ~4 min |
| **Best for** | Quick checks, daily use | Board reports, audits |

## Pricing Reference

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Opus 4.6 | $15.00 | $75.00 |

## Architecture

```
Browser → NestJS Proxy → Gateway (Fastify)
                            ├── tool_search_tool_bm25 (on-demand tool discovery)
                            ├── 254 MCP tools with defer_loading: true
                            ├── Prompt caching (system prompt cached for 5 min)
                            ├── Council batching (2 members at a time)
                            └── Per-member token usage logging
```

### Key Optimisations
- **Tool Search**: 96% input token reduction via `defer_loading` — Claude discovers tools on demand instead of loading all 254 schemas
- **Prompt Caching**: System prompt cached with `cache_control: { type: 'ephemeral' }` — 90% discount on cached portion for subsequent messages
- **Council Batching**: Members run in pairs of 2 to stay within 512MB Docker memory limit
- **Model Capability Detection**: Automatic fallback to full tool loading for models that don't support `tool_search_tool_bm25`

## Council Members

| Role | Domain | MCP Servers |
|------|--------|-------------|
| Risk Analyst | Risk register, scenarios, KRIs, tolerance, treatment | riskready-risks, riskready-controls, riskready-agent-ops |
| Controls Auditor | Control effectiveness, SOA, assessments, gap analysis | riskready-controls, riskready-evidence, riskready-audits, riskready-agent-ops |
| Compliance Officer | Policies, framework alignment, governance | riskready-policies, riskready-controls, riskready-organisation, riskready-agent-ops |
| Incident Commander | Incident patterns, lessons learned, response metrics | riskready-incidents, riskready-itsm, riskready-evidence, riskready-agent-ops |
| Evidence Auditor | Evidence coverage, audit readiness, nonconformities | riskready-evidence, riskready-audits, riskready-controls, riskready-agent-ops |
| CISO Strategist | Cross-domain synthesis (all 9 servers) | All MCP servers |

## Trigger Conditions

The council convenes when:
1. **3+ GRC domains** are mentioned in a single message, OR
2. **Trigger phrases** are used: "overall posture", "maturity assessment", "board report", "council review", "multi-perspective", "full assessment", "comprehensive review", "posture assessment", "cross-domain", "holistic view", "executive summary", "security posture"
