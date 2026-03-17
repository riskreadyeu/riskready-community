# ITSM MCP Server

IT Service Management MCP server providing comprehensive access to asset CMDB, change management, capacity management, and software inventory.

## Key Numbers

| Metric | Count |
|--------|-------|
| Query Tools | 23 |
| Mutation Tools | 7 |
| Resources | 3 |
| Prompts | 3 |

## Core Design Principle

The ITSM MCP server follows a read-mostly architecture with safe mutation capabilities. All read operations (queries) are executed directly and return immediate results. All mutation operations (create, update, link) generate proposals that enter an approval queue for human review before being applied to the production database. This ensures LLM agents can safely explore and analyze the CMDB, change records, and capacity data without risk of accidental modifications, while still enabling them to propose improvements that require human oversight.

## Documentation

| Document | Description |
|----------|-------------|
| [tool-reference.md](./tool-reference.md) | Complete reference for all 30 tools with parameters and return types |
| [resources-prompts.md](./resources-prompts.md) | Resource URIs and prompt templates for guided workflows |

## Quick Start

```bash
cd apps/mcp-server-itsm
npm install
DATABASE_URL="postgresql://user:pass@localhost:5432/riskready" npm start
```

## Tech Stack

- **Runtime**: Node.js with tsx (TypeScript execution)
- **SDK**: @modelcontextprotocol/sdk for MCP protocol implementation
- **Database**: Prisma Client for type-safe database access
- **Validation**: Zod schemas for input validation
- **Transport**: stdio transport for communication with MCP clients
