"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  CalendarDays,
  Filter,
  ChevronRight,
  Bell,
  Play,
  History,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getUpcomingReviews,
  getOverdueReviews,
  getReviewStats,
  getReviews,
  createReview,
  PolicyDocument,
  DocumentReview,
  ReviewOutcome,
} from "@/lib/policies-api";

const reviewOutcomeBadges: Record<ReviewOutcome, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NO_CHANGES: { label: "No Changes", variant: "default" },
  MINOR_CHANGES: { label: "Minor Changes", variant: "secondary" },
  MAJOR_CHANGES: { label: "Major Changes", variant: "outline" },
  SUPERSEDE: { label: "Supersede", variant: "destructive" },
  RETIRE: { label: "Retire", variant: "destructive" },
};

interface ReviewDocumentCardProps {
  document: PolicyDocument;
  type: "overdue" | "upcoming" | "recent";
  onReview?: () => void;
}

function ReviewDocumentCard({ document, type, onReview }: ReviewDocumentCardProps) {
  const navigate = useNavigate();

  const daysUntilReview = document.nextReviewDate
    ? Math.ceil(
        (new Date(document.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      {/* Status Indicator */}
      <div
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          type === "overdue" && "bg-red-100 dark:bg-red-950",
          type === "upcoming" && "bg-yellow-100 dark:bg-yellow-950",
          type === "recent" && "bg-green-100 dark:bg-green-950"
        )}
      >
        {type === "overdue" && <AlertTriangle className="h-5 w-5 text-red-500" />}
        {type === "upcoming" && <Clock className="h-5 w-5 text-yellow-500" />}
        {type === "recent" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-muted-foreground">{document.documentId}</span>
          <Badge variant="outline" className="text-[10px]">
            {document.documentType}
          </Badge>
        </div>
        <p className="font-medium text-sm truncate">{document.title}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {document.owner?.firstName} {document.owner?.lastName}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {document.reviewFrequency}
          </span>
        </div>
      </div>

      {/* Review Date */}
      <div className="text-right">
        {type === "overdue" && (
          <div>
            <p className="text-sm font-medium text-red-500">
              {Math.abs(daysUntilReview || 0)} days overdue
            </p>
            <p className="text-xs text-muted-foreground">
              Due: {document.nextReviewDate ? new Date(document.nextReviewDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
        )}
        {type === "upcoming" && (
          <div>
            <p className="text-sm font-medium text-yellow-600">
              Due in {daysUntilReview} days
            </p>
            <p className="text-xs text-muted-foreground">
              {document.nextReviewDate ? new Date(document.nextReviewDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
        )}
        {type === "recent" && document.lastReviewDate && (
          <div>
            <p className="text-sm font-medium text-green-600">Reviewed</p>
            <p className="text-xs text-muted-foreground">
              {new Date(document.lastReviewDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onReview && (type === "overdue" || type === "upcoming") && (
          <Button size="sm" onClick={onReview}>
            <Play className="h-4 w-4 mr-1" />
            Review
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/policies/documents/${document.id}`)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overdueDocuments, setOverdueDocuments] = useState<PolicyDocument[]>([]);
  const [upcomingDocuments, setUpcomingDocuments] = useState<PolicyDocument[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState("overdue");

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PolicyDocument | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>("NO_CHANGES");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overdue, upcoming, statsData] = await Promise.all([
        getOverdueReviews(),
        getUpcomingReviews(30),
        getReviewStats(),
      ]);
      setOverdueDocuments(overdue || []);
      setUpcomingDocuments(upcoming || []);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = (document: PolicyDocument) => {
    setSelectedDocument(document);
    setReviewOutcome("NO_CHANGES");
    setFindings("");
    setRecommendations("");
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedDocument) return;

    try {
      setSubmitting(true);
      await createReview(selectedDocument.id, {
        reviewType: "SCHEDULED",
        outcome: reviewOutcome,
        findings: findings || undefined,
        recommendations: recommendations || undefined,
        changesRequired: reviewOutcome !== "NO_CHANGES",
        reviewedById: "current-user-id", // Replace with actual user
      });
      setReviewDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Management</h1>
          <p className="text-muted-foreground">
            Track and complete scheduled document reviews
          </p>
        </div>
        <Button variant="outline" onClick={() => toast.info("This feature is coming soon")}>
          <Bell className="h-4 w-4 mr-2" />
          Send Reminders
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{upcomingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Within next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Reviews completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.onTimeRate || 95}%</div>
            <p className="text-xs text-muted-foreground">Reviews completed on schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Calendar Preview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Upcoming Review Schedule</CardTitle>
              <CardDescription>Next 90 days review timeline</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Simple calendar view */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 12 }).map((_, weekIndex) => {
              const weekStart = new Date();
              weekStart.setDate(weekStart.getDate() + weekIndex * 7);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);

              // Count reviews in this week
              const reviewsInWeek = upcomingDocuments.filter((doc) => {
                if (!doc.nextReviewDate) return false;
                const reviewDate = new Date(doc.nextReviewDate);
                return reviewDate >= weekStart && reviewDate <= weekEnd;
              }).length;

              return (
                <div
                  key={weekIndex}
                  className={cn(
                    "flex-shrink-0 w-20 p-3 rounded-lg text-center",
                    reviewsInWeek > 0 ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
                  )}
                >
                  <p className="text-xs text-muted-foreground">
                    Week {weekIndex + 1}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {reviewsInWeek}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    reviews
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overdue
            {overdueDocuments.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming
            {upcomingDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {upcomingDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600">Overdue Reviews</CardTitle>
              <CardDescription>
                These documents have passed their scheduled review date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : overdueDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No overdue reviews at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueDocuments.map((doc) => (
                    <ReviewDocumentCard
                      key={doc.id}
                      document={doc}
                      type="overdue"
                      onReview={() => handleStartReview(doc)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Reviews</CardTitle>
              <CardDescription>
                Documents scheduled for review in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : upcomingDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No upcoming reviews</h3>
                  <p className="text-muted-foreground">
                    No documents scheduled for review in the next 30 days.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDocuments.map((doc) => (
                    <ReviewDocumentCard
                      key={doc.id}
                      document={doc}
                      type="upcoming"
                      onReview={() => handleStartReview(doc)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review History</CardTitle>
              <CardDescription>
                Past reviews completed across all documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Review History</h3>
                <p className="text-muted-foreground">
                  Select a document to view its full review history.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/policies/documents")}
                >
                  Browse Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Document Review</DialogTitle>
            <DialogDescription>
              {selectedDocument && (
                <span className="font-mono">{selectedDocument.documentId}</span>
              )}{" "}
              - {selectedDocument?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Outcome</label>
              <Select value={reviewOutcome} onValueChange={(v) => setReviewOutcome(v as ReviewOutcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CHANGES">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      No Changes Required
                    </div>
                  </SelectItem>
                  <SelectItem value="MINOR_CHANGES">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Minor Changes Needed
                    </div>
                  </SelectItem>
                  <SelectItem value="MAJOR_CHANGES">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Major Revision Required
                    </div>
                  </SelectItem>
                  <SelectItem value="SUPERSEDE">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Supersede with New Document
                    </div>
                  </SelectItem>
                  <SelectItem value="RETIRE">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Retire Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Findings</label>
              <Textarea
                placeholder="Document any findings from the review..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Recommendations</label>
              <Textarea
                placeholder="Add recommendations or action items..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={submitting}>
              {submitting ? "Submitting..." : "Complete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
