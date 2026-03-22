import { api } from './api';
import { fetchWithAuth } from './fetch-with-auth';

export interface GatewayConfig {
  anthropicApiKey: string | null;
  anthropicApiKeySet: boolean;
  agentModel: string;
  gatewayUrl: string;
  maxAgentTurns: number;
  updatedAt: string;
}

export interface UsageByModel {
  model: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
}

export interface UsageResponse {
  period: { start: string; end: string };
  totals: { messageCount: number; inputTokens: number; outputTokens: number };
  byModel: UsageByModel[];
}

export function getGatewayConfig(): Promise<GatewayConfig> {
  return api.get<GatewayConfig>('/gateway-config');
}

export function updateGatewayConfig(data: {
  anthropicApiKey?: string | null;
  agentModel?: string;
}): Promise<GatewayConfig> {
  return api.put<GatewayConfig>('/gateway-config', data);
}

export function getUsage(): Promise<UsageResponse> {
  return api.get<UsageResponse>('/gateway-config/usage');
}

export interface McpApiKey {
  id: string;
  prefix: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface McpApiKeyCreated extends McpApiKey {
  key: string; // Full key, shown once
}

export async function createMcpKey(name: string): Promise<McpApiKeyCreated> {
  const res = await fetchWithAuth('/api/gateway-config/mcp-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create API key');
  return res.json();
}

export async function listMcpKeys(): Promise<McpApiKey[]> {
  const res = await fetchWithAuth('/api/gateway-config/mcp-keys');
  if (!res.ok) throw new Error('Failed to load API keys');
  return res.json();
}

export async function revokeMcpKey(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/gateway-config/mcp-keys/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke API key');
}
