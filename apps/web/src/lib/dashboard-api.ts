import { api } from './api';

// Types
export interface DashboardMetrics {
  riskScore: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  openRisks: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  complianceRate: {
    percentage: number;
    frameworksTracked: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  pendingActions: {
    total: number;
    dueThisWeek: number;
    overdue: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  activeIncidents: {
    total: number;
    critical: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  policies: {
    total: number;
    pendingReview: number;
    pendingApproval: number;
  };
  controls: {
    total: number;
    implemented: number;
    notImplemented: number;
  };
}

export interface RecentActivityItem {
  id: string;
  type: 'risk' | 'control' | 'policy' | 'incident' | 'evidence' | 'audit';
  title: string;
  detail: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface UpcomingTask {
  id: string;
  type: 'review' | 'assessment' | 'approval' | 'test' | 'remediation';
  title: string;
  dueDate: string;
  status: 'urgent' | 'in_progress' | 'not_started';
  assignee?: string;
  entityId?: string;
  entityType?: string;
}

export interface RiskTrendData {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ComplianceData {
  framework: string;
  score: number;
}

// API Functions
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return api.get<DashboardMetrics>('/dashboard/metrics');
}

export async function getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  return api.get<RecentActivityItem[]>(`/dashboard/recent-activity?limit=${limit}`);
}

export async function getUpcomingTasks(limit = 10): Promise<UpcomingTask[]> {
  return api.get<UpcomingTask[]>(`/dashboard/upcoming-tasks?limit=${limit}`);
}

export async function getRiskTrends(months = 6): Promise<RiskTrendData[]> {
  return api.get<RiskTrendData[]>(`/dashboard/risk-trends?months=${months}`);
}

export async function getComplianceData(): Promise<ComplianceData[]> {
  return api.get<ComplianceData[]>('/dashboard/compliance');
}
