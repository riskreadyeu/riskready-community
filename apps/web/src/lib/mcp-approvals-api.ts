import { api } from './api';

// ============================================
// Types
// ============================================

export type McpActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';

export type McpActionType =
  | 'CREATE_CONTROL' | 'UPDATE_CONTROL' | 'UPDATE_CONTROL_STATUS' | 'DISABLE_CONTROL' | 'ENABLE_CONTROL'
  | 'CREATE_ASSESSMENT' | 'UPDATE_ASSESSMENT' | 'DELETE_ASSESSMENT' | 'START_ASSESSMENT'
  | 'SUBMIT_ASSESSMENT_REVIEW' | 'COMPLETE_ASSESSMENT' | 'CANCEL_ASSESSMENT'
  | 'ADD_ASSESSMENT_CONTROLS' | 'REMOVE_ASSESSMENT_CONTROL'
  | 'ADD_ASSESSMENT_SCOPE_ITEMS' | 'REMOVE_ASSESSMENT_SCOPE_ITEM'
  | 'POPULATE_ASSESSMENT_TESTS'
  | 'RECORD_TEST_RESULT' | 'BULK_ASSIGN_TESTS' | 'UPDATE_TEST' | 'ASSIGN_TESTER'
  | 'UPDATE_ROOT_CAUSE' | 'SKIP_TEST'
  | 'CREATE_SOA' | 'CREATE_SOA_FROM_CONTROLS' | 'CREATE_SOA_VERSION'
  | 'UPDATE_SOA' | 'SUBMIT_SOA_REVIEW' | 'APPROVE_SOA' | 'DELETE_SOA'
  | 'UPDATE_SOA_ENTRY'
  | 'CREATE_SCOPE_ITEM' | 'UPDATE_SCOPE_ITEM' | 'DELETE_SCOPE_ITEM'
  | 'CREATE_REMEDIATION' | 'UPDATE_METRIC_VALUE'
  | string;

export interface McpPendingAction {
  id: string;
  actionType: McpActionType;
  status: McpActionStatus;
  summary: string;
  reason: string | null;
  payload: any;
  mcpSessionId: string | null;
  mcpToolName: string | null;
  reviewedById: string | null;
  reviewedBy: { id: string; email: string } | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  executedAt: string | null;
  resultData: any | null;
  errorMessage: string | null;
  organisationId: string;
  organisation: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  executed: number;
  failed: number;
  total: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

// ============================================
// API Functions
// ============================================

export async function getMcpApprovals(params?: {
  status?: McpActionStatus;
  actionType?: McpActionType;
  organisationId?: string;
  skip?: number;
  take?: number;
}): Promise<PaginatedResponse<McpPendingAction>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.actionType) searchParams.set('actionType', params.actionType);
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);
  if (params?.skip != null) searchParams.set('skip', String(params.skip));
  if (params?.take != null) searchParams.set('take', String(params.take));

  const qs = searchParams.toString();
  return api.get<PaginatedResponse<McpPendingAction>>(`/mcp-approvals${qs ? `?${qs}` : ''}`);
}

export async function getMcpApprovalStats(organisationId?: string): Promise<McpApprovalStats> {
  const qs = organisationId ? `?organisationId=${organisationId}` : '';
  return api.get<McpApprovalStats>(`/mcp-approvals/stats${qs}`);
}

export async function getMcpApproval(id: string): Promise<McpPendingAction> {
  return api.get<McpPendingAction>(`/mcp-approvals/${id}`);
}

export async function approveMcpAction(id: string, reviewNotes?: string): Promise<McpPendingAction> {
  return api.post<McpPendingAction>(`/mcp-approvals/${id}/approve`, { reviewNotes });
}

export async function rejectMcpAction(id: string, reviewNotes?: string): Promise<McpPendingAction> {
  return api.post<McpPendingAction>(`/mcp-approvals/${id}/reject`, { reviewNotes });
}

export async function retryMcpAction(id: string): Promise<McpPendingAction> {
  return api.post<McpPendingAction>(`/mcp-approvals/${id}/retry`);
}
