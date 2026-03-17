# Setup Guide

## Prerequisites

- Node.js 18+
- Access to the RiskReady PostgreSQL database
- The main server's Prisma schema generated (`apps/server/prisma`)

## Installation

From the monorepo root:

```bash
cd apps/mcp-server
npm install
```

The `postinstall` script symlinks the Prisma client from the main server package to avoid generating a duplicate client.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `MCP_DEBUG` | No | Set to `"true"` to enable Prisma query logging |

## Running the Server

```bash
# Production
DATABASE_URL="postgresql://user:pass@host:5432/riskready" npm start

# Development (auto-reload on file changes)
DATABASE_URL="postgresql://user:pass@host:5432/riskready" npm run dev
```

The server communicates over stdio (standard input/output). It does not open an HTTP port. An MCP client (Claude Desktop, Cursor, Claude Code) connects by spawning this process.

## Client Integration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "riskready-risk": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/riskready-community/apps/mcp-server",
      "env": {
        "DATABASE_URL": "postgresql://user:pass@host:5432/riskready"
      }
    }
  }
}
```

### Claude Desktop over SSH (remote server)

If the database and MCP server run on a remote machine:

```json
{
  "mcpServers": {
    "riskready-risk": {
      "command": "ssh",
      "args": [
        "user@remote-host",
        "cd /path/to/apps/mcp-server && DATABASE_URL='postgresql://...' npx tsx src/index.ts"
      ]
    }
  }
}
```

### Cursor

In Cursor settings, add the MCP server under **Features > MCP Servers** with the same command/args pattern as Claude Desktop.

### Claude Code

In your project's `.mcp.json` or `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "riskready-risk": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/riskready-community/apps/mcp-server",
      "env": {
        "DATABASE_URL": "postgresql://user:pass@host:5432/riskready"
      }
    }
  }
}
```

## Prisma Client

The MCP server shares the Prisma schema with the main NestJS server (`apps/server/prisma/`). The `postinstall` script creates a symlink so both packages use the same generated client.

If you modify the Prisma schema, regenerate from the main server:

```bash
cd apps/server
npx prisma generate
```

The MCP server will pick up the changes via the symlink.

## Verifying the Connection

After configuring your client, look for the `riskready-risk` server in the client's MCP server list. You should see:

- **34 tools** available
- **6 resources** available
- **5 prompts** available

Try calling `get_risk_stats` (no parameters) to verify database connectivity.
