import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Video,
  FileText,
  CheckSquare,
  Gavel,
  User,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  DataTable,
  type Column,
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import {
  getCommitteeMeeting,
  type CommitteeMeeting,
  type MeetingDecision,
  type MeetingActionItem,
} from "@/lib/organisation-api";

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  postponed: "Postponed",
};

const meetingTypeLabels: Record<string, string> = {
  regular: "Regular",
  special: "Special",
  emergency: "Emergency",
  annual: "Annual",
};

const locationTypeLabels: Record<string, string> = {
  physical: "Physical",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

export default function CommitteeMeetingDetailPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<CommitteeMeeting | null>(null);

  useEffect(() => {
    if (meetingId) {
      loadData();
    }
  }, [meetingId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCommitteeMeeting(meetingId!);
      setMeeting(data);
    } catch (err) {
      console.error("Error loading meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  const decisionColumns: Column<MeetingDecision>[] = [
    {
      key: "number",
      header: "#",
      render: (decision) => (
        <span className="text-xs text-muted-foreground">{decision.decisionNumber || "-"}</span>
      ),
    },
    {
      key: "title",
      header: "Decision",
      render: (decision) => (
        <Link
          to={`/organisation/meeting-decisions/${decision.id}`}
          className="font-medium hover:underline hover:text-primary"
        >
          {decision.title}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (decision) => (
        <Badge variant="outline" className="capitalize">
          {decision.decisionType?.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "votes",
      header: "Votes",
      render: (decision) => (
        <div className="text-xs">
          <span className="text-green-600">{decision.votesFor} For</span>
          {" / "}
          <span className="text-red-600">{decision.votesAgainst} Against</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Implemented",
      render: (decision) => (
        <StatusBadge
          status={decision.implemented ? "Yes" : "No"}
          variant={decision.implemented ? "success" : "secondary"}
        />
      ),
    },
  ];

  const actionColumns: Column<MeetingActionItem>[] = [
    {
      key: "number",
      header: "#",
      render: (action) => (
        <span className="text-xs text-muted-foreground">{action.actionNumber || "-"}</span>
      ),
    },
    {
      key: "title",
      header: "Action",
      render: (action) => (
        <Link
          to={`/organisation/meeting-action-items/${action.id}`}
          className="font-medium hover:underline hover:text-primary"
        >
          {action.title}
        </Link>
      ),
    },
    {
      key: "assignee",
      header: "Assigned To",
      render: (action) => (
        <span className="text-sm">
          {action.assignedTo
            ? `${action.assignedTo.firstName || ""} ${action.assignedTo.lastName || ""}`.trim() || action.assignedTo.email
            : "-"}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (action) => (
        <Badge
          variant={
            action.priority === "critical" ? "destructive" :
              action.priority === "high" ? "default" :
                "secondary"
          }
          className="capitalize"
        >
          {action.priority}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (action) => (
        <span className="text-sm">
          {new Date(action.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (action) => (
        <StatusBadge
          status={action.status?.replace("_", " ") || "open"}
          variant={
            action.status === "completed" ? "success" :
              action.status === "in_progress" ? "default" :
                action.status === "blocked" ? "destructive" :
                  "secondary"
          }
        />
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (action) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${action.progressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{action.progressPercentage}%</span>
        </div>
      ),
    },
  ];

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

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Meeting not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const meetingDate = new Date(meeting.meetingDate);

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={meeting.title}
        description={`${meeting.committee?.name || "Committee"} - ${meetingDate.toLocaleDateString()}`}
        backLink={`/organisation/security-committees/${meeting.committeeId}`}
        backLabel="Back to Committee"
        badge={
          <div className="flex gap-2">
            <StatusBadge
              status={statusLabels[meeting.status] || meeting.status}
              variant={
                meeting.status === "completed" ? "success" :
                  meeting.status === "cancelled" ? "destructive" :
                    meeting.status === "in_progress" ? "default" :
                      "secondary"
              }
            />
            <Badge variant="outline">
              {meetingTypeLabels[meeting.meetingType] || meeting.meetingType}
            </Badge>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <RecordActionsMenu
              onEdit={() => navigate(`/organisation/committee-meetings/${meetingId}/edit`)}
              onHistory={() => {
                const historyTab = document.querySelector('[data-value="history"]');
                if (historyTab) {
                  (historyTab as HTMLElement).click();
                }
              }}
              onDelete={async () => {
                if (confirm("Are you sure you want to delete this meeting?")) {
                  // TODO: Implement delete functionality
                  navigate(`/organisation/security-committees/${meeting.committeeId}`);
                }
              }}
            />
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-sm font-medium">
                  {meetingDate.toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {meeting.startTime}{meeting.endTime ? ` - ${meeting.endTime}` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-sm font-medium">
                  {meeting.actualAttendeesCount || 0} / {meeting.expectedAttendeesCount || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {meeting.quorumAchieved ? "Quorum achieved" : "No quorum"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Decisions</p>
                <p className="text-sm font-medium">{meeting._count?.decisions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Action Items</p>
                <p className="text-sm font-medium">{meeting._count?.actionItems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs defaultValue="overview" syncWithUrl className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="decisions">Decisions ({meeting._count?.decisions || 0})</ArcherTabsTrigger>
          <ArcherTabsTrigger value="actions">Action Items ({meeting._count?.actionItems || 0})</ArcherTabsTrigger>
          <ArcherTabsTrigger value="minutes">Minutes</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Meeting Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meeting Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Meeting Number</p>
                    <p className="text-sm font-medium">{meeting.meetingNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meeting Type</p>
                    <p className="text-sm font-medium">
                      {meetingTypeLabels[meeting.meetingType] || meeting.meetingType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">
                      {meeting.durationMinutes ? `${meeting.durationMinutes} minutes` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quorum Requirement</p>
                    <p className="text-sm font-medium">{meeting.quorumRequirement || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Location Type</p>
                  <p className="text-sm font-medium">
                    {locationTypeLabels[meeting.locationType || ""] || meeting.locationType || "-"}
                  </p>
                </div>
                {meeting.physicalLocation && (
                  <div>
                    <p className="text-xs text-muted-foreground">Physical Location</p>
                    <p className="text-sm font-medium">{meeting.physicalLocation}</p>
                  </div>
                )}
                {meeting.virtualMeetingLink && (
                  <div>
                    <p className="text-xs text-muted-foreground">Virtual Meeting</p>
                    <a
                      href={meeting.virtualMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Video className="h-3 w-3" />
                      Join Meeting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Key Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Chair</p>
                    <p className="text-sm font-medium">
                      {meeting.chair
                        ? `${meeting.chair.firstName || ""} ${meeting.chair.lastName || ""}`.trim() || meeting.chair.email
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Secretary</p>
                    <p className="text-sm font-medium">
                      {meeting.secretary
                        ? `${meeting.secretary.firstName || ""} ${meeting.secretary.lastName || ""}`.trim() || meeting.secretary.email
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agenda & Objectives */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Agenda & Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {meeting.objectives && (
                  <div>
                    <p className="text-xs text-muted-foreground">Objectives</p>
                    <p className="text-sm">{meeting.objectives}</p>
                  </div>
                )}
                {meeting.agenda && (
                  <div>
                    <p className="text-xs text-muted-foreground">Agenda</p>
                    <pre className="text-sm whitespace-pre-wrap font-sans">{meeting.agenda}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ArcherTabsContent>

        <ArcherTabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              {(meeting as any).decisions?.length > 0 ? (
                <DataTable
                  columns={decisionColumns}
                  data={(meeting as any).decisions}
                  keyExtractor={(d) => d.id}
                  emptyMessage="No decisions recorded"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No decisions recorded for this meeting
                </p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              {(meeting as any).actionItems?.length > 0 ? (
                <DataTable
                  columns={actionColumns}
                  data={(meeting as any).actionItems}
                  keyExtractor={(a) => a.id}
                  emptyMessage="No action items"
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No action items for this meeting
                </p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="minutes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Minutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.minutes ? (
                <pre className="text-sm whitespace-pre-wrap font-sans">{meeting.minutes}</pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No minutes recorded for this meeting
                </p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={meeting.createdAt}
            updatedAt={meeting.updatedAt}
            entityType="Committee Meeting"
          />
        </ArcherTabsContent>
      </ArcherTabs>
    </div>
  );
}
