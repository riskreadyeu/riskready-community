import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  ChevronRight,
  User,
  Bot,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  getTransitionHistory,
  type StateTransition,
  type ScenarioStatus,
} from "@/lib/risks-api";

// Status configuration for visual styling
const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-100" },
  ASSESSED: { label: "Assessed", color: "text-blue-600", bgColor: "bg-blue-100" },
  EVALUATED: { label: "Evaluated", color: "text-purple-600", bgColor: "bg-purple-100" },
  TREATING: { label: "Treating", color: "text-amber-600", bgColor: "bg-amber-100" },
  TREATED: { label: "Treated", color: "text-teal-600", bgColor: "bg-teal-100" },
  ACCEPTED: { label: "Accepted", color: "text-green-600", bgColor: "bg-green-100" },
  MONITORING: { label: "Monitoring", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  ESCALATED: { label: "Escalated", color: "text-red-600", bgColor: "bg-red-100" },
  REVIEW: { label: "Under Review", color: "text-orange-600", bgColor: "bg-orange-100" },
  CLOSED: { label: "Closed", color: "text-gray-500", bgColor: "bg-gray-100" },
  ARCHIVED: { label: "Archived", color: "text-gray-400", bgColor: "bg-gray-50" },
};

// Transition names mapping
const TRANSITION_NAMES: Record<string, string> = {
  T01: "Submit Assessment",
  T02: "Complete Evaluation",
  T03: "Start Treatment",
  T04: "Accept Risk",
  T05: "Escalate Risk",
  T06: "Complete Treatment",
  T07: "Re-Assess After Treatment",
  T08: "Begin Monitoring",
  T09: "Approve Treatment (from escalation)",
  T10: "Accept Exception",
  T11: "Terminate Activity",
  T12: "Trigger Scheduled Review",
  T13: "Confirm No Change",
  T14: "Update Score",
  T15: "Resume Treatment",
  T16: "Return to Monitoring",
  T17: "Close After Review",
  T18: "Close Monitored Scenario",
  T19: "Archive Closed Scenario",
  T20: "Draft Timeout",
  T21: "Acceptance Expired",
  T22: "KRI Breach Detected",
  T23: "Treatment Deadline Missed",
  T24: "Request Review",
  T25: "Close from Review",
};

interface ScenarioStateHistoryProps {
  scenarioId: string;
  maxItems?: number;
  compact?: boolean;
  className?: string;
}

export function ScenarioStateHistory({
  scenarioId,
  maxItems = 10,
  compact = false,
  className,
}: ScenarioStateHistoryProps) {
  const [history, setHistory] = useState<StateTransition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [scenarioId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransitionHistory(scenarioId, { limit: 50 });
      setHistory(data.history);
      setTotal(data.total);
    } catch (err) {
      console.error("Error loading transition history:", err);
      setError(err instanceof Error ? err.message : "Failed to load state history");
    } finally {
      setLoading(false);
    }
  };

  const displayedHistory = showAll ? history : history.slice(0, maxItems);

  const getTriggeredByIcon = (triggeredBy: StateTransition['triggeredBy']) => {
    switch (triggeredBy) {
      case 'USER':
        return <User className="w-3 h-3" />;
      case 'SYSTEM':
        return <Bot className="w-3 h-3" />;
      case 'SCHEDULER':
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTriggeredByLabel = (triggeredBy: StateTransition['triggeredBy']) => {
    switch (triggeredBy) {
      case 'USER':
        return 'Manual';
      case 'SYSTEM':
        return 'Auto';
      case 'SCHEDULER':
        return 'Scheduled';
    }
  };

  if (loading) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            State History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (Issue 16)
  if (error) {
    return (
      <Card className={cn("glass-card border-destructive/50 bg-destructive/5", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            State History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            State History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No state transitions yet</p>
            <p className="text-sm">Changes will appear here as the scenario progresses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            State History
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {total} transitions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline items */}
          <div className="space-y-4">
            {displayedHistory.map((transition, index) => {
              const fromConfig = STATUS_CONFIG[transition.fromStatus];
              const toConfig = STATUS_CONFIG[transition.toStatus];
              const isExpanded = expanded === transition.id;
              const isFirst = index === 0;

              return (
                <div key={transition.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                    isFirst ? toConfig.bgColor : "bg-muted"
                  )} />

                  {/* Transition card */}
                  <div
                    className={cn(
                      "rounded-lg border p-3 transition-all cursor-pointer hover:bg-accent/50",
                      isFirst && "ring-2 ring-primary/20"
                    )}
                    onClick={() => setExpanded(isExpanded ? null : transition.id)}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Status transition badges */}
                        <Badge
                          className={cn(
                            "shrink-0 text-xs",
                            fromConfig.bgColor,
                            fromConfig.color
                          )}
                        >
                          {fromConfig.label}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Badge
                          className={cn(
                            "shrink-0 text-xs",
                            toConfig.bgColor,
                            toConfig.color
                          )}
                        >
                          {toConfig.label}
                        </Badge>
                      </div>

                      {/* Trigger type */}
                      <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs shrink-0",
                        transition.triggeredBy === 'USER' ? "bg-blue-50 text-blue-600" :
                        transition.triggeredBy === 'SYSTEM' ? "bg-purple-50 text-purple-600" :
                        "bg-amber-50 text-amber-600"
                      )}>
                        {getTriggeredByIcon(transition.triggeredBy)}
                        <span>{getTriggeredByLabel(transition.triggeredBy)}</span>
                      </div>
                    </div>

                    {/* Transition name and timestamp */}
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="font-medium text-foreground">
                        {TRANSITION_NAMES[transition.transitionCode] || transition.transitionName}
                      </span>
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(transition.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Expand indicator */}
                    {(transition.justification || transition.reviewOutcome || transition.createdBy) && (
                      <div className="flex items-center justify-center mt-2 pt-2 border-t">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {/* User info */}
                        {transition.createdBy && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">By:</span>
                            <span>
                              {transition.createdBy.firstName} {transition.createdBy.lastName}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">When:</span>
                          <span>{format(new Date(transition.createdAt), "PPpp")}</span>
                        </div>

                        {/* Transition code */}
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Code:</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {transition.transitionCode}
                          </Badge>
                        </div>

                        {/* Review outcome */}
                        {transition.reviewOutcome && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Review Outcome:</span>
                              <p className="mt-1">{transition.reviewOutcome}</p>
                            </div>
                          </div>
                        )}

                        {/* Escalation decision */}
                        {transition.escalationDecision && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Escalation Decision:</span>
                              <p className="mt-1">{transition.escalationDecision}</p>
                            </div>
                          </div>
                        )}

                        {/* Justification */}
                        {transition.justification && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Justification:</span>
                              <p className="mt-1 bg-muted/50 p-2 rounded text-sm">
                                {transition.justification}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more button */}
          {history.length > maxItems && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show All ({history.length - maxItems} more)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline version for embedding
interface CompactHistoryProps {
  transitions: StateTransition[];
  limit?: number;
}

export function CompactStateHistory({ transitions, limit = 3 }: CompactHistoryProps) {
  const displayedTransitions = transitions.slice(0, limit);

  if (displayedTransitions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No transitions recorded
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedTransitions.map((transition) => {
        const toConfig = STATUS_CONFIG[transition.toStatus];
        return (
          <div
            key={transition.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <Badge
                className={cn("text-xs", toConfig.bgColor, toConfig.color)}
              >
                {toConfig.label}
              </Badge>
              <span className="text-muted-foreground">
                {TRANSITION_NAMES[transition.transitionCode] || transition.transitionName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(transition.createdAt), { addSuffix: true })}
            </span>
          </div>
        );
      })}
      {transitions.length > limit && (
        <div className="text-xs text-muted-foreground text-center">
          +{transitions.length - limit} more
        </div>
      )}
    </div>
  );
}
