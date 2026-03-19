import { api } from './api';

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
