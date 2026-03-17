# Risk MCP Server

AI-accessible risk management interface that exposes the risk register, scenarios, KRIs, treatments, threats, and governance data through the Model Context Protocol.

## Key Numbers

| Capability | Count |
|-----------|-------|
| Query & analysis tools | 27 |
| Mutation proposal tools | 7 |
| Reference resources | 6 |
| Guided prompts | 5 |

## Core Design Principle

Read-mostly with safe mutation proposals. The MCP server has full read access to the risk register, but all write operations go through an approval queue. A human must review and approve every proposed change before it executes. Zero direct writes to the risk register.

## Documentation

| Document | Contents |
|----------|----------|
| [Tool Reference](./tool-reference.md) | All 34 tools with parameter tables and return types |
| [Resources & Prompts](./resources-prompts.md) | 6 reference resources and 5 guided prompts |

## Quick Start

```bash
cd apps/mcp-server
npm install
DATABASE_URL="postgresql://user:pass@host:5432/riskready" npm start
```

For full installation and client configuration, see the [main setup guide](../setup.md).

## Tech Stack

- **Runtime**: Node.js with [tsx](https://github.com/privatenumber/tsx) (TypeScript execution)
- **Protocol**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) v1.12+
- **Database**: Prisma Client (shared schema with main server)
- **Validation**: Zod for all tool input schemas
- **Transport**: stdio (for Claude Desktop, Cursor, Claude Code)

## Tool Domains

Tools are organized into 8 domains:

1. **Risk Register** (3 tools) - List risks, get risk details, aggregate statistics
2. **Scenarios** (7 tools) - Scenario details, factors, impacts, linked controls/threats, calculation history
3. **Key Risk Indicators** (3 tools) - List KRIs, KRI details, dashboard
4. **Treatment Plans** (3 tools) - List treatments, treatment details, statistics
5. **Threat Catalog** (4 tools) - Browse threats, threat details, emerging threats, dashboard
6. **Governance** (4 tools) - RACI matrix, escalation levels, reassessment triggers, dashboard
7. **Analysis** (4 tools) - Control effectiveness, risk appetite status, appetite stats, FAIR simulation
8. **Mutation Proposals** (7 tools) - Propose risks, scenarios, control links, factor updates, treatments, state transitions, KRI threshold updates

## Usage Pattern

1. Query the risk register using read tools
2. Analyse using analysis tools and guided prompts
3. Propose changes using mutation tools
4. Human reviews proposals in the web UI
5. Approved changes execute automatically
6. Query again to see updated data

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────────┐     Prisma     ┌────────────┐
│   MCP Client    │◄──────────────►│  MCP Server      │◄─────────────►│ PostgreSQL │
│ (Claude Desktop)│                │  (riskready-risk) │               │  (shared)  │
└─────────────────┘                └──────────────────┘               └────────────┘
                                           │                                ▲
                                           │ writes to                      │
                                           │ McpPendingAction               │
                                           ▼                                │
                                   ┌──────────────────┐    executes    ┌────────────┐
                                   │  Approval Queue  │◄──────────────►│  NestJS    │
                                   │  (DB table)      │    mutations   │  Backend   │
                                   └──────────────────┘               └────────────┘
                                           ▲                                │
                                           │ reviews via                    │
                                           │                                ▼
                                   ┌──────────────────┐               ┌────────────┐
                                   │  Human Reviewer  │◄─────────────►│  Web UI    │
                                   │  (GRC analyst)   │               │  (React)   │
                                   └──────────────────┘               └────────────┘
```

See the [main architecture guide](../architecture.md) for detailed design decisions.
