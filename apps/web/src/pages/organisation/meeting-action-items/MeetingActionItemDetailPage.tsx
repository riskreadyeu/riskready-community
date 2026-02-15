import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CheckSquare,
  Edit3,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  Flag,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PageHeader,
  StatusBadge,
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import {
  type MeetingActionItem,
  getMeetingActionItem,
} from "@/lib/organisation-api";

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
  cancelled: "Cancelled",
  deferred: "Deferred",
};

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};



export default function MeetingActionItemDetailPage() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<MeetingActionItem | null>(null);

  useEffect(() => {
    if (actionId) {
      loadData();
    }
  }, [actionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMeetingActionItem(actionId!);
      setAction(data);
    } catch (err) {
      console.error("Error loading action item:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Action item not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const dueDate = new Date(action.dueDate);
  const isOverdue = dueDate < new Date() && action.status !== "completed" && action.status !== "cancelled";

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={action.title}
        description={action.actionNumber ? `Action Item ${action.actionNumber}` : "Action Item"}
        backLink={`/organisation/committee-meetings/${action.meetingId}`}
        backLabel="Back to Meeting"
        badge={
          <div className="flex gap-2">
            <StatusBadge
              status={statusLabels[action.status] || action.status}
              variant={
                action.status === "completed" ? "success" :
                  action.status === "blocked" ? "destructive" :
                    action.status === "in_progress" ? "default" :
                      "secondary"
              }
            />
            <Badge
              variant={
                action.priority === "critical" ? "destructive" :
                  action.priority === "high" ? "default" :
                    "secondary"
              }
              className="capitalize"
            >
              <Flag className="h-3 w-3 mr-1" />
              {priorityLabels[action.priority] || action.priority}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            <RecordActionsMenu
              recordType="meetingActionItem"
              recordId={action.id}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={() => {/* TODO: Implement delete */}}
            />
            <Button variant="outline" size="sm" onClick={() => toast.info("This feature is coming soon")}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {action.status !== "completed" && (
              <Button size="sm" onClick={() => toast.info("This feature is coming soon")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium">
                  {action.assignedTo
                    ? `${action.assignedTo.firstName || ""} ${action.assignedTo.lastName || ""}`.trim() || action.assignedTo.email
                    : "Unassigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Calendar className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                  {dueDate.toLocaleDateString()}
                </p>
                {isOverdue && (
                  <p className="text-xs text-destructive">Overdue</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Hours</p>
                <p className="text-sm font-medium">
                  {action.estimatedHours ? `${action.estimatedHours} hours` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-medium">{action.progressPercentage}%</p>
              </div>
              <Progress value={action.progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs defaultValue="details" className="space-y-4" syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="details">Details</ArcherTabsTrigger>
          <ArcherTabsTrigger value="progress">Progress</ArcherTabsTrigger>
          <ArcherTabsTrigger value="context">Context</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Action Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Action Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{action.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <Badge
                      variant={
                        action.priority === "critical" ? "destructive" :
                          action.priority === "high" ? "default" :
                            "secondary"
                      }
                      className="capitalize mt-1"
                    >
                      {priorityLabels[action.priority] || action.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <StatusBadge
                      status={statusLabels[action.status] || action.status}
                      variant={
                        action.status === "completed" ? "success" :
                          action.status === "blocked" ? "destructive" :
                            action.status === "in_progress" ? "default" :
                              "secondary"
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">
                      {action.assignedTo
                        ? `${action.assignedTo.firstName || ""} ${action.assignedTo.lastName || ""}`.trim() || action.assignedTo.email
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned By</p>
                    <p className="text-sm font-medium">
                      {action.assignedBy
                        ? `${action.assignedBy.firstName || ""} ${action.assignedBy.lastName || ""}`.trim() || action.assignedBy.email
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                      {dueDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Hours</p>
                    <p className="text-sm font-medium">
                      {action.estimatedHours ? `${action.estimatedHours} hours` : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blocking Issues */}
            {action.blockingReason && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Blocking Issue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{action.blockingReason}</p>
                </CardContent>
              </Card>
            )}

            {/* Committee Review */}
            {action.requiresCommitteeReview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Committee Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {action.reviewed ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Reviewed by committee</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm">Pending committee review</span>
                      </>
                    )}
                  </div>
                  {action.reviewDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Review Date</p>
                      <p className="text-sm font-medium">
                        {new Date(action.reviewDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ArcherTabsContent>

        <ArcherTabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Overall Progress</p>
                  <p className="text-2xl font-bold">{action.progressPercentage}%</p>
                </div>
                <Progress value={action.progressPercentage} className="h-4" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge
                    status={statusLabels[action.status] || action.status}
                    variant={
                      action.status === "completed" ? "success" :
                        action.status === "blocked" ? "destructive" :
                          action.status === "in_progress" ? "default" :
                            "secondary"
                    }
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completion Date</p>
                  <p className="text-sm font-medium">
                    {action.completionDate
                      ? new Date(action.completionDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>

              {action.lastUpdateNotes && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Update Notes</p>
                  <p className="text-sm">{action.lastUpdateNotes}</p>
                </div>
              )}

              {action.completionNotes && (
                <div>
                  <p className="text-xs text-muted-foreground">Completion Notes</p>
                  <p className="text-sm">{action.completionNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Meeting Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Source Meeting</p>
                <Link
                  to={`/organisation/committee-meetings/${action.meetingId}`}
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  {action.meeting?.title || "View Meeting"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {action.meeting?.meetingDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Meeting Date</p>
                  <p className="text-sm font-medium">
                    {new Date(action.meeting.meetingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {action.meeting?.committee && (
                <div>
                  <p className="text-xs text-muted-foreground">Committee</p>
                  <Link
                    to={`/organisation/security-committees/${action.meeting.committee.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {action.meeting.committee.name}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {new Date(action.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            recordType="meetingActionItem"
            recordId={action.id}
          />
        </ArcherTabsContent>
      </ArcherTabs>
    </div>
  );
}
