"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  FolderTree,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  BarChart3,
  ChevronRight,
  Plus,
  TrendingUp,
  Calendar,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatCard } from "@/components/common";
import {
  getDashboardStats,
  getComplianceStatus,
  getActionsNeeded,
  getRecentActivity,
  type DashboardStats,
  type ComplianceStatus,
  type ActionsNeeded,
  type RecentActivityItem,
} from "@/lib/policies-api";
import { cn } from "@/lib/utils";

const documentTypeColors: Record<string, string> = {
  POLICY: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  STANDARD: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  PROCEDURE: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  WORK_INSTRUCTION: "bg-green-500/10 text-green-500 border-green-500/30",
  FORM: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  TEMPLATE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  CHECKLIST: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  GUIDELINE: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  RECORD: "bg-pink-500/10 text-pink-500 border-pink-500/30",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  PENDING_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/30",
  PUBLISHED: "bg-green-500/10 text-green-500 border-green-500/30",
  UNDER_REVISION: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  SUPERSEDED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  RETIRED: "bg-red-500/10 text-red-500 border-red-500/30",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

const actionIcons: Record<string, React.ReactNode> = {
  CREATED: <Plus className="h-3 w-3" />,
  UPDATED: <FileText className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <AlertTriangle className="h-3 w-3" />,
  PUBLISHED: <TrendingUp className="h-3 w-3" />,
  ACKNOWLEDGED: <UserCheck className="h-3 w-3" />,
  REVIEWED: <Calendar className="h-3 w-3" />,
};

export default function PoliciesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [actions, setActions] = useState<ActionsNeeded | null>(null);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, complianceData, actionsData, activityData] = await Promise.all([
        getDashboardStats(),
        getComplianceStatus(),
        getActionsNeeded(),
        getRecentActivity(5),
      ]);
      setStats(statsData);
      setCompliance(complianceData);
      setActions(actionsData);
      setActivity(activityData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const documentsByType = Object.entries(stats?.documents?.byType || {}).filter(
    ([_, count]) => count > 0
  );

  return (
    <div className="space-y-6 pb-8 animate-slide-up">
      <PageHeader
        title="Policy Management"
        description="Manage policies, standards, procedures and documentation for ISO 27001 compliance"
        actions={
          <div className="flex gap-2">
            <Link to="/policies/documents">
              <Button variant="outline" size="sm">
                <FolderTree className="h-4 w-4 mr-2" />
                Browse Documents
              </Button>
            </Link>
            <Link to="/policies/documents/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={stats?.documents?.total ?? 0}
          icon={<FileText className="h-4 w-4" />}
          subtitle={`${stats?.documents?.published ?? 0} published`}
        />
        <StatCard
          title="Pending Approvals"
          value={(stats?.approvals?.pending ?? 0) + (stats?.approvals?.inProgress ?? 0)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClassName="text-amber-500"
          subtitle="Awaiting action"
        />
        <StatCard
          title="Reviews Due"
          value={(stats?.reviews?.overdue ?? 0) + (stats?.reviews?.dueSoon ?? 0)}
          icon={<Clock className="h-4 w-4" />}
          iconClassName={stats?.reviews?.overdue ? "text-destructive" : "text-warning"}
          subtitle={stats?.reviews?.overdue ? `${stats.reviews.overdue} overdue` : "Within 30 days"}
        />
        <StatCard
          title="Acknowledgment Rate"
          value={`${stats?.acknowledgments?.completionRate ?? 0}%`}
          icon={<UserCheck className="h-4 w-4" />}
          iconClassName="text-primary"
          subtitle={`${stats?.acknowledgments?.pending ?? 0} pending`}
        />
      </div>

      {/* Compliance Score and Documents by Type */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compliance Score */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - (compliance?.overallScore ?? 0) / 100)}
                    className={cn(
                      "transition-all duration-1000",
                      (compliance?.overallScore ?? 0) >= 80
                        ? "text-green-500"
                        : (compliance?.overallScore ?? 0) >= 60
                        ? "text-amber-500"
                        : "text-red-500"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{compliance?.overallScore ?? 0}%</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 w-full">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Control Coverage</span>
                  <span className="font-medium">{compliance?.controlCoverage?.percentage ?? 0}%</span>
                </div>
                <Progress value={compliance?.controlCoverage?.percentage ?? 0} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mandatory Docs</span>
                  <span className="font-medium">{compliance?.mandatoryDocuments?.percentage ?? 0}%</span>
                </div>
                <Progress value={compliance?.mandatoryDocuments?.percentage ?? 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents by Type */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Documents by Type
              </CardTitle>
              <Link to="/policies/documents">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {documentsByType.length > 0 ? (
                documentsByType.map(([type, count]) => (
                  <Link
                    key={type}
                    to={`/policies/documents?type=${type}`}
                    className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={documentTypeColors[type] || ""}>
                        {type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Needed and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Actions Needed */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Actions Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overdue Reviews */}
            {(actions?.overdueReviews?.length ?? 0) > 0 && actions && (
              <div>
                <h4 className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Overdue Reviews ({actions.overdueReviews.length})
                </h4>
                <div className="space-y-2">
                  {actions.overdueReviews.slice(0, 3).map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/policies/documents/${doc.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {doc.documentId}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">{doc.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Approvals */}
            {(actions?.pendingApprovals?.length ?? 0) > 0 && actions && (
              <div>
                <h4 className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Pending Approvals ({actions.pendingApprovals.length})
                </h4>
                <div className="space-y-2">
                  {actions.pendingApprovals.slice(0, 3).map((step) => (
                    <Link
                      key={step.id}
                      to={`/policies/documents/${step.workflow?.document?.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {step.workflow?.document?.documentId}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">
                          {step.stepName}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Expiring Exceptions */}
            {(actions?.expiringExceptions?.length ?? 0) > 0 && actions && (
              <div>
                <h4 className="text-xs font-medium text-orange-500 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Expiring Exceptions ({actions.expiringExceptions.length})
                </h4>
                <div className="space-y-2">
                  {actions.expiringExceptions.slice(0, 3).map((exc) => (
                    <Link
                      key={exc.id}
                      to={`/policies/exceptions/${exc.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {exc.exceptionId}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">{exc.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!actions?.overdueReviews?.length &&
              !actions?.pendingApprovals?.length &&
              !actions?.expiringExceptions?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending actions</p>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Link to="/policies/audit-log">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-all"
                  >
                    <div className="mt-0.5 p-1.5 rounded-full bg-primary/10 text-primary">
                      {actionIcons[item.action] || <FileText className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {item.performedBy?.firstName} {item.performedBy?.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.performedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link
          to="/policies/approvals"
          className="p-4 rounded-lg border bg-card hover:border-primary/30 transition-all group"
        >
          <CheckCircle2 className="h-5 w-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-medium">Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">Review and approve documents</p>
        </Link>
        <Link
          to="/policies/changes"
          className="p-4 rounded-lg border bg-card hover:border-primary/30 transition-all group"
        >
          <Clock className="h-5 w-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-medium">Change Requests</h3>
          <p className="text-sm text-muted-foreground">Manage document changes</p>
        </Link>
        <Link
          to="/policies/exceptions"
          className="p-4 rounded-lg border bg-card hover:border-primary/30 transition-all group"
        >
          <AlertTriangle className="h-5 w-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-medium">Exceptions</h3>
          <p className="text-sm text-muted-foreground">Policy exception register</p>
        </Link>
      </div>
    </div>
  );
}
