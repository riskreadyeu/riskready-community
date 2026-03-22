// gateway/src/channels/mcp-http-transport.ts

import type { FastifyInstance } from 'fastify';
import type { FullToolSchema } from '../agent/tool-schema-loader.js';
import { McpToolExecutor, TOOL_NAME_PATTERN } from '../agent/mcp-tool-executor.js';
import { logger } from '../logger.js';

interface McpTransportOptions {
  toolSchemas: FullToolSchema[];
  getServerConfig: (serverName: string) => { command: string; args: string[]; env?: Record<string, string> } | undefined;
  validateApiKey: (key: string) => Promise<{ valid: boolean; userId?: string; organisationId?: string }>;
  databaseUrl: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: number | string;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// Simple in-memory rate limiter: 100 calls/minute per API key
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(apiKey);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function jsonRpcError(id: number | string | null, code: number, message: string): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? 0,
    error: { code, message },
  };
}

function jsonRpcResult(id: number | string, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

export function registerMcpTransport(server: FastifyInstance, options: McpTransportOptions): void {
  server.post('/mcp', async (request, reply) => {
    // 1. Extract Bearer token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send(jsonRpcError(null, -32000, 'Missing or invalid Authorization header'));
    }
    const apiKey = authHeader.slice(7);

    // 2. Rate limiting
    if (!checkRateLimit(apiKey)) {
      return reply.status(429).send(jsonRpcError(null, -32000, 'Rate limit exceeded (100 calls/minute)'));
    }

    // 3. Validate API key
    let auth: { valid: boolean; userId?: string; organisationId?: string };
    try {
      auth = await options.validateApiKey(apiKey);
    } catch {
      return reply.status(500).send(jsonRpcError(null, -32000, 'API key validation failed'));
    }

    if (!auth.valid) {
      return reply.status(401).send(jsonRpcError(null, -32000, 'Invalid API key'));
    }

    // 4. Parse JSON-RPC body
    const body = request.body as JsonRpcRequest;
    if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
      return reply.status(400).send(jsonRpcError(body?.id ?? null, -32600, 'Invalid JSON-RPC request'));
    }

    const { method, params, id } = body;

    // 5. Route by method
    switch (method) {
      case 'initialize': {
        return reply.send(
          jsonRpcResult(id, {
            protocolVersion: '2025-03-26',
            serverInfo: { name: 'riskready', version: '1.0.0' },
            capabilities: { tools: {} },
          }),
        );
      }

      case 'tools/list': {
        const tools = options.toolSchemas.map((s) => ({
          name: s.fullName,
          description: s.description,
          inputSchema: s.inputSchema,
        }));
        return reply.send(jsonRpcResult(id, { tools }));
      }

      case 'tools/call': {
        const toolParams = params as { name?: string; arguments?: Record<string, unknown> } | undefined;
        const toolName = toolParams?.name;

        if (!toolName || !TOOL_NAME_PATTERN.test(toolName)) {
          return reply.send(jsonRpcError(id, -32602, `Invalid tool name: ${toolName ?? '(none)'}`));
        }

        const startMs = Date.now();
        const executor = new McpToolExecutor({
          organisationId: auth.organisationId!,
          getServerConfig: options.getServerConfig,
        });

        try {
          const result = await executor.execute(toolName, toolParams?.arguments ?? {});
          const durationMs = Date.now() - startMs;

          logger.info(
            { userId: auth.userId, tool: toolName, org: auth.organisationId, durationMs },
            'MCP tools/call',
          );

          return reply.send(
            jsonRpcResult(id, {
              content: [{ type: 'text', text: result.content }],
              isError: result.isError,
            }),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error({ err, tool: toolName, userId: auth.userId }, 'MCP tools/call failed');
          return reply.send(
            jsonRpcResult(id, {
              content: [{ type: 'text', text: `Tool execution error: ${message}` }],
              isError: true,
            }),
          );
        } finally {
          await executor.shutdown();
        }
      }

      default: {
        return reply.send(jsonRpcError(id, -32601, `Method not found: ${method}`));
      }
    }
  });

  logger.info('MCP HTTP transport registered at POST /mcp');
}
