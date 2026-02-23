import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Shield,
  Edit3,
  Trash2,
  Users,
  Calendar,
  Clock,
  Plus,
  Eye,
  CheckSquare,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  ConfirmDialog,
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
  getSecurityCommittee,
  type SecurityCommittee,
  type CommitteeMeeting,
} from "@/lib/organisation-api";

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
  ad_hoc: "Ad Hoc",
};

export default function SecurityCommitteeDetailPage() {
  const { committeeId } = useParams<{ committeeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [committee, setCommittee] = useState<SecurityCommittee | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (committeeId) {
      loadData();
    }
  }, [committeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSecurityCommittee(committeeId!);
      setCommittee(data);
    } catch (err) {
      console.error("Error loading committee:", err);
    } finally {
      setLoading(false);
    }
  };

  const meetingColumns: Column<CommitteeMeeting>[] = [
    {
      key: "date",
      header: "Date",
      render: (meeting) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {new Date(meeting.meetingDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (meeting) => (
        <Link
          to={`/organisation/committee-meetings/${meeting.id}`}
          className="font-medium hover:underline hover:text-primary"
        >
          {meeting.title}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (meeting) => (
        <StatusBadge
          status={meeting.status?.replace("_", " ") || "scheduled"}
          variant={
            meeting.status === "completed" ? "success" :
            meeting.status === "cancelled" ? "destructive" : "default"
          }
        />
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (meeting) => (
        <div className="flex gap-2 text-xs">
          <span title="Decisions">{meeting._count?.decisions ?? 0} D</span>
          <span title="Actions">{meeting._count?.actionItems ?? 0} A</span>
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

  if (!committee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Committee not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/security-committees")}>
          Back to Committees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={committee.name}
        description={committee.purpose || "Security committee details"}
        backLink="/organisation/security-committees"
        backLabel="Back to Committees"
        badge={
          <div className="flex gap-2">
            <StatusBadge
              status={committee.isActive ? "Active" : "Inactive"}
              variant={committee.isActive ? "success" : "secondary"}
            />
            <Badge variant="outline">
              {frequencyLabels[committee.meetingFrequency] || committee.meetingFrequency}
            </Badge>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <RecordActionsMenu
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-semibold">{committee._count?.memberships ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meetings</p>
                <p className="text-2xl font-semibold">{committee._count?.meetings ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Meeting</p>
                <p className="font-medium">
                  {committee.nextMeetingDate
                    ? new Date(committee.nextMeetingDate).toLocaleDateString()
                    : "Not scheduled"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Committee Type</p>
                <p className="font-medium capitalize">{committee.committeeType?.replace("_", " ") || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs syncWithUrl defaultValue="overview" className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="members">Members</ArcherTabsTrigger>
          <ArcherTabsTrigger value="meetings">Meetings</ArcherTabsTrigger>
          <ArcherTabsTrigger value="decisions">Decisions</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Committee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Chair</p>
                  <p className="font-medium">
                    {committee.chair
                      ? `${committee.chair.firstName || ''} ${committee.chair.lastName || committee.chair.email}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secretary</p>
                  <p className="font-medium">
                    {committee.secretary
                      ? `${committee.secretary.firstName || ''} ${committee.secretary.lastName || committee.secretary.email}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Authority Level</p>
                  <p className="capitalize">{committee.authorityLevel?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meeting Frequency</p>
                  <p>{frequencyLabels[committee.meetingFrequency] || committee.meetingFrequency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Established</p>
                  <p>{committee.establishedDate ? new Date(committee.establishedDate).toLocaleDateString() : "-"}</p>
                </div>
                {committee.dissolvedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dissolved</p>
                    <p className="text-destructive">{new Date(committee.dissolvedDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              {committee.purpose && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                  <p className="text-sm">{committee.purpose}</p>
                </div>
              )}
              {committee.mandate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mandate</p>
                  <p className="text-sm">{committee.mandate}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Committee Members
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              {committee.memberships && committee.memberships.length > 0 ? (
                <div className="space-y-2">
                  {committee.memberships.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {membership.user?.firstName?.[0]}{membership.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{membership.user?.firstName} {membership.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{membership.role?.replace("_", " ")}</p>
                        </div>
                      </div>
                      <Badge variant={membership.isActive ? "default" : "secondary"}>
                        {membership.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No members assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Committee Meetings
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Schedule Meeting
              </Button>
            </CardHeader>
            <CardContent>
              {committee.meetings && committee.meetings.length > 0 ? (
                <DataTable
                  data={committee.meetings}
                  columns={meetingColumns}
                  keyExtractor={(m) => m.id}
                  emptyMessage="No meetings found"
                />
              ) : (
                <p className="text-muted-foreground text-sm">No meetings scheduled yet.</p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Recent Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No decisions recorded yet.
              </p>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={committee.createdAt}
            updatedAt={committee.updatedAt}
            entityType="Security Committee"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Committee"
        description={`Are you sure you want to delete "${committee.name}"? This will also remove all associated meetings and decisions.`}
        onConfirm={() => {
          navigate("/organisation/security-committees");
        }}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
