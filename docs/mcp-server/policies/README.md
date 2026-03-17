# Policies MCP Server

Comprehensive policy document management including documents, sections, versions, approvals, acknowledgments, change requests, reviews, exceptions, external requirements mappings, and compliance analysis.

## Key Numbers

| Metric | Count |
|--------|-------|
| Query Tools | 35 |
| Mutation Tools | 6 |
| Resources | 4 |
| Prompts | 3 |

## Core Design Principle

The Policies MCP server provides complete read access to the policy management system through query tools, while requiring human approval for all mutations. This ensures AI agents can analyze policy coverage, identify gaps, and propose changes, but cannot make unauthorized modifications to policy documents. The server implements the full policy document lifecycle from draft through approval, publication, review, exceptions, and retirement.

## Documentation

- [Tool Reference](./tool-reference.md) - Complete tool documentation with parameters and returns
- [Resources & Prompts](./resources-prompts.md) - Static resources and prompt templates

## Quick Start

```bash
cd apps/mcp-server-policies
npm install
npm run build
npm start
```

The server runs on stdio transport and is designed for integration with Claude Desktop, Cursor, and other MCP clients.

## Tech Stack

- **MCP SDK**: @modelcontextprotocol/sdk
- **Database**: Prisma ORM with PostgreSQL
- **Validation**: Zod schemas
- **Transport**: stdio (MCP standard)
- **Runtime**: Node.js

## Architecture

The server is organized into functional modules:

- **Documents**: Core policy document CRUD, search, and hierarchy
- **Sections**: Document structure including sections, definitions, process steps, roles
- **Versions**: Version history and comparison
- **Approvals**: Approval workflows with delegations and step tracking
- **Acknowledgments**: User acknowledgment tracking and statistics
- **Change Requests**: Change request lifecycle management
- **Reviews**: Scheduled and triggered document reviews
- **Exceptions**: Policy exceptions with risk assessment
- **Mappings**: Document relationships with controls, risks, and other documents
- **External Requirements**: Regulatory, certification, contractual, and industry requirements
- **Analysis**: Policy statistics, dashboard metrics, compliance matrices
- **Mutations**: Approval-gated creation and update operations

All mutation tools create pending actions in the approval queue rather than directly modifying data, ensuring human oversight of policy changes.

## Related Servers

- **Organisation MCP Server**: Provides organisation context entities
- **Controls MCP Server**: Manages security controls referenced by policies
