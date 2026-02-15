import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Gavel,
  Edit3,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  type MeetingDecision,
} from "@/lib/organisation-api";

const decisionTypeLabels: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  deferred: "Deferred",
  amended: "Amended",
  noted: "Noted",
  action_required: "Action Required",
};

const voteTypeLabels: Record<string, string> = {
  unanimous: "Unanimous",
  majority: "Majority",
  consensus: "Consensus",
  no_vote: "No Vote Required",
};

async function getMeetingDecision(id: string): Promise<MeetingDecision> {
  const res = await fetch(`/api/organisation/meeting-decisions/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch decision');
  return res.json();
}

export default function MeetingDecisionDetailPage() {
  const { decisionId } = useParams<{ decisionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<MeetingDecision | null>(null);

  useEffect(() => {
    if (decisionId) {
      loadData();
    }
  }, [decisionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMeetingDecision(decisionId!);
      setDecision(data);
    } catch (err) {
      console.error("Error loading decision:", err);
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

  if (!decision) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Decision not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const totalVotes = decision.votesFor + decision.votesAgainst + decision.votesAbstain;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={decision.title}
        description={decision.decisionNumber ? `Decision ${decision.decisionNumber}` : "Meeting Decision"}
        backLink={`/organisation/committee-meetings/${decision.meetingId}`}
        backLabel="Back to Meeting"
        badge={
          <div className="flex gap-2">
            <StatusBadge
              status={decisionTypeLabels[decision.decisionType] || decision.decisionType}
              variant={
                decision.decisionType === "approved" ? "success" :
                decision.decisionType === "rejected" ? "destructive" :
                "secondary"
              }
            />
            {decision.implemented && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implemented
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            <RecordActionsMenu
              onEdit={() => console.log("Edit decision")}
              onDelete={() => console.log("Delete decision")}
              onDuplicate={() => console.log("Duplicate decision")}
            />
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Decision Type</p>
                <p className="text-sm font-medium">
                  {decisionTypeLabels[decision.decisionType] || decision.decisionType}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ThumbsUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vote Result</p>
                <p className="text-sm font-medium">
                  {voteTypeLabels[decision.voteType] || decision.voteType}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Responsible Party</p>
                <p className="text-sm font-medium">
                  {decision.responsibleParty
                    ? `${decision.responsibleParty.firstName || ""} ${decision.responsibleParty.lastName || ""}`.trim() || decision.responsibleParty.email
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium">
                  {decision.implementationDeadline
                    ? new Date(decision.implementationDeadline).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs defaultValue="details" syncWithUrl className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="details">Details</ArcherTabsTrigger>
          <ArcherTabsTrigger value="voting">Voting</ArcherTabsTrigger>
          <ArcherTabsTrigger value="implementation">Implementation</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Decision Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  Decision Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{decision.description}</p>
                </div>
                {decision.rationale && (
                  <div>
                    <p className="text-xs text-muted-foreground">Rationale</p>
                    <p className="text-sm">{decision.rationale}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Effective Date</p>
                    <p className="text-sm font-medium">
                      {decision.effectiveDate
                        ? new Date(decision.effectiveDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Review Date</p>
                    <p className="text-sm font-medium">
                      {decision.reviewDate
                        ? new Date(decision.reviewDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Implementation Deadline</p>
                    <p className="text-sm font-medium">
                      {decision.implementationDeadline
                        ? new Date(decision.implementationDeadline).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(decision.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ArcherTabsContent>

        <ArcherTabsContent value="voting">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Voting Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Vote Type</p>
                <Badge variant="outline" className="capitalize">
                  {voteTypeLabels[decision.voteType] || decision.voteType}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <ThumbsUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{decision.votesFor}</p>
                  <p className="text-xs text-muted-foreground">For</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <ThumbsDown className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{decision.votesAgainst}</p>
                  <p className="text-xs text-muted-foreground">Against</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <MinusCircle className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-500">{decision.votesAbstain}</p>
                  <p className="text-xs text-muted-foreground">Abstain</p>
                </div>
              </div>

              {totalVotes > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Vote Distribution</p>
                  <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${(decision.votesFor / totalVotes) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(decision.votesAgainst / totalVotes) * 100}%` }}
                    />
                    <div
                      className="bg-gray-400 h-full"
                      style={{ width: `${(decision.votesAbstain / totalVotes) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="implementation">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Implementation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${decision.implemented ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                  {decision.implemented ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {decision.implemented ? "Implemented" : "Pending Implementation"}
                  </p>
                  {decision.implementationDate && (
                    <p className="text-sm text-muted-foreground">
                      Completed on {new Date(decision.implementationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Responsible Party</p>
                  <p className="text-sm font-medium">
                    {decision.responsibleParty
                      ? `${decision.responsibleParty.firstName || ""} ${decision.responsibleParty.lastName || ""}`.trim() || decision.responsibleParty.email
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-sm font-medium">
                    {decision.implementationDeadline
                      ? new Date(decision.implementationDeadline).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>

              {decision.implementationNotes && (
                <div>
                  <p className="text-xs text-muted-foreground">Implementation Notes</p>
                  <p className="text-sm">{decision.implementationNotes}</p>
                </div>
              )}

              {decision.relatedDocuments && decision.relatedDocuments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Related Documents</p>
                  <div className="space-y-2">
                    {decision.relatedDocuments.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        {doc.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            entityType="MeetingDecision"
            entityId={decision.id}
          />
        </ArcherTabsContent>
      </ArcherTabs>
    </div>
  );
}
