import { useState, useEffect } from "react";
import {
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatCard, StatCardGrid } from "@/components/common";
import {
  getMcpApprovals,
  getMcpApprovalStats,
  approveMcpAction,
  rejectMcpAction,
  retryMcpAction,
  type McpPendingAction,
  type McpActionStatus,
  type McpApprovalStats,
} from "@/lib/mcp-approvals-api";

// =============================================================================
// Helpers
// =============================================================================

const statusConfig: Record<
  McpActionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  APPROVED: { label: "Approved", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  EXECUTED: { label: "Executed", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function getModuleLabel(actionType: string): string {
  if (actionType.includes("CONTROL") && !actionType.includes("ASSESSMENT")) return "Controls";
  if (actionType.includes("ASSESSMENT") || actionType.includes("TEST")) return "Assessments";
  if (actionType.includes("SOA")) return "SOA";
  if (actionType.includes("SCOPE")) return "Scope";
  if (actionType.includes("RISK") || actionType.includes("KRI") || actionType.includes("RTS") || actionType.includes("TREATMENT") || actionType.includes("SCENARIO")) return "Risks";
  if (actionType.includes("INCIDENT") || actionType.includes("LESSON") || actionType.includes("TIMELINE")) return "Incidents";
  if (actionType.includes("EVIDENCE")) return "Evidence";
  if (actionType.includes("POLICY") || actionType.includes("EXCEPTION") || actionType.includes("ACKNOWLEDGMENT")) return "Policies";
  if (actionType.includes("AUDIT") || actionType.includes("NONCONFORMITY") || actionType.includes("CAP")) return "Audits";
  if (actionType.includes("CHANGE") || actionType.includes("ASSET") || actionType.includes("CAPACITY")) return "ITSM";
  if (actionType.includes("ORG") || actionType.includes("DEPARTMENT") || actionType.includes("LOCATION") || actionType.includes("COMMITTEE") || actionType.includes("PROCESS") || actionType.includes("DEPENDENCY")) return "Organisation";
  if (actionType.includes("METRIC")) return "Metrics";
  if (actionType.includes("REMEDIATION")) return "Remediation";
  return "Other";
}

function formatActionType(actionType: string): string {
  return actionType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// =============================================================================
// Component
// =============================================================================

export default function McpApprovalsPage() {
  const [actions, setActions] = useState<McpPendingAction[]>([]);
  const [stats, setStats] = useState<McpApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = statusFilter !== "all" ? (statusFilter as McpActionStatus) : undefined;
      const [actionsRes, statsRes] = await Promise.all([
        getMcpApprovals({ status, take: 100 }),
        getMcpApprovalStats(),
      ]);
      setActions(actionsRes.results);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setReviewNotes("");
    } else {
      setExpandedId(id);
      setReviewNotes("");
    }
  };

  const handleApprove = async (action: McpPendingAction) => {
    try {
      setSubmitting(true);
      const updated = await approveMcpAction(action.id, reviewNotes || undefined);
      if (updated.status === "EXECUTED") {
        toast.success("Action approved and executed successfully");
      } else if (updated.status === "FAILED") {
        toast.error(`Action approved but execution failed: ${updated.errorMessage}`);
      } else {
        toast.success("Action approved (no auto-executor available)");
      }
      setExpandedId(null);
      setReviewNotes("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve action");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (action: McpPendingAction) => {
    try {
      setSubmitting(true);
      await rejectMcpAction(action.id, reviewNotes || undefined);
      toast.success("Action rejected");
      setExpandedId(null);
      setReviewNotes("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject action");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (action: McpPendingAction) => {
    try {
      setSubmitting(true);
      await retryMcpAction(action.id);
      toast.success("Action reset to pending — you can approve it again");
      setExpandedId(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry action");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatClick = (status: string) => {
    setStatusFilter(statusFilter === status ? "all" : status);
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <>
      <PageHeader
        title="AI Action Queue"
        description="Review and approve actions proposed by AI assistants"
        icon={<Bot className="h-5 w-5" />}
      />

      <div className="mt-6 space-y-6">
        {/* Stat Cards */}
        {stats && (
          <StatCardGrid columns={4}>
            <button className="text-left" onClick={() => handleStatClick("PENDING")}>
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={<Clock className="h-4 w-4" />}
                variant={statusFilter === "PENDING" ? "warning" : "default"}
              />
            </button>
            <button className="text-left" onClick={() => handleStatClick("EXECUTED")}>
              <StatCard
                title="Executed"
                value={stats.executed}
                icon={<CheckCircle className="h-4 w-4" />}
                variant={statusFilter === "EXECUTED" ? "success" : "default"}
              />
            </button>
            <button className="text-left" onClick={() => handleStatClick("REJECTED")}>
              <StatCard
                title="Rejected"
                value={stats.rejected}
                icon={<XCircle className="h-4 w-4" />}
                variant={statusFilter === "REJECTED" ? "destructive" : "default"}
              />
            </button>
            <button className="text-left" onClick={() => handleStatClick("FAILED")}>
              <StatCard
                title="Failed"
                value={stats.failed}
                icon={<AlertTriangle className="h-4 w-4" />}
                variant={statusFilter === "FAILED" ? "destructive" : "default"}
              />
            </button>
          </StatCardGrid>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXECUTED">Executed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          {stats && (
            <span className="text-sm text-muted-foreground">
              {actions.length} of {stats.total} actions
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={loadData} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && actions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No actions found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? "No actions match the current filter. Try changing the status filter."
                  : "Actions proposed by AI assistants will appear here for review."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action List */}
        {!loading && !error && actions.length > 0 && (
          <div className="space-y-3">
            {actions.map((action) => {
              const config = statusConfig[action.status];
              const isExpanded = expandedId === action.id;

              return (
                <Card key={action.id} className={isExpanded ? "ring-1 ring-primary/30" : "transition-colors hover:bg-muted/30"}>
                  <CardContent className="py-4">
                    {/* Summary row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{action.summary}</span>
                            <Badge variant={config.variant}>{config.label}</Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {getModuleLabel(action.actionType)}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatActionType(action.actionType)}</span>
                            <span>{formatRelativeTime(action.createdAt)}</span>
                            {action.mcpToolName && (
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {action.mcpToolName}
                              </span>
                            )}
                          </div>
                          {!isExpanded && action.reason && (
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                              {action.reason}
                            </p>
                          )}
                          {!isExpanded && action.errorMessage && (
                            <p className="mt-1.5 text-xs text-destructive line-clamp-2">
                              Error: {action.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={isExpanded ? "secondary" : action.status === "PENDING" ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => toggleExpand(action.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-1.5 h-3 w-3" />
                            Collapse
                          </>
                        ) : action.status === "PENDING" ? (
                          <>
                            <Eye className="mr-1.5 h-3 w-3" />
                            Review
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1.5 h-3 w-3" />
                            Details
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4 space-y-4">
                        {/* Reason */}
                        {action.reason && (
                          <div>
                            <label className="text-sm font-medium">Reason</label>
                            <p className="mt-1 text-sm text-muted-foreground">{action.reason}</p>
                          </div>
                        )}

                        {/* Tool & Session */}
                        {(action.mcpToolName || action.mcpSessionId) && (
                          <div className="flex gap-6">
                            {action.mcpToolName && (
                              <div>
                                <label className="text-sm font-medium">Tool</label>
                                <p className="mt-1 text-sm font-mono text-muted-foreground">
                                  {action.mcpToolName}
                                </p>
                              </div>
                            )}
                            {action.mcpSessionId && (
                              <div>
                                <label className="text-sm font-medium">Session</label>
                                <p className="mt-1 text-sm font-mono text-muted-foreground truncate max-w-[200px]">
                                  {action.mcpSessionId}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Created: {formatDate(action.createdAt)}</span>
                          {action.reviewedAt && (
                            <span>Reviewed: {formatDate(action.reviewedAt)}</span>
                          )}
                          {action.executedAt && (
                            <span>Executed: {formatDate(action.executedAt)}</span>
                          )}
                        </div>

                        {/* Reviewer info */}
                        {action.reviewedBy && (
                          <div>
                            <label className="text-sm font-medium">Reviewed by</label>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {action.reviewedBy.email}
                            </p>
                          </div>
                        )}

                        {/* Existing review notes */}
                        {action.reviewNotes && action.status !== "PENDING" && (
                          <div>
                            <label className="text-sm font-medium">Review Notes</label>
                            <p className="mt-1 text-sm text-muted-foreground">{action.reviewNotes}</p>
                          </div>
                        )}

                        {/* Error message */}
                        {action.errorMessage && (
                          <div>
                            <label className="text-sm font-medium text-destructive">Error</label>
                            <p className="mt-1 text-sm text-destructive">{action.errorMessage}</p>
                          </div>
                        )}

                        {/* Payload */}
                        <div>
                          <label className="text-sm font-medium">Payload</label>
                          <pre className="mt-1 max-h-[200px] overflow-auto rounded-lg bg-muted p-3 text-xs font-mono">
                            {JSON.stringify(action.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Retry button for FAILED actions */}
                        {action.status === "FAILED" && (
                          <div className="flex items-center justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(action)}
                              disabled={submitting}
                            >
                              {submitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                              Retry
                            </Button>
                          </div>
                        )}

                        {/* Review notes input + actions (only for PENDING) */}
                        {action.status === "PENDING" && (
                          <>
                            <div>
                              <label className="text-sm font-medium">Review Notes (optional)</label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add notes about your decision..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(action)}
                                disabled={submitting}
                              >
                                {submitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(action)}
                                disabled={submitting}
                              >
                                {submitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                Approve & Execute
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
