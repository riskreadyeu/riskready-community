import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArcherTabs, ArcherTabsContent, ArcherTabsList, ArcherTabsTrigger } from "@/components/common";
import {
  PageHeader,
  StatusBadge,
  ConfirmDialog,
  FormDialog,
  FormField,
  FormRow,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import {
  getContextIssue,
  updateContextIssue,
  deleteContextIssue,
  type ContextIssue,
} from "@/lib/organisation-api";

export default function ContextIssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<ContextIssue | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<ContextIssue>>({
    title: "",
    issueCode: "",
    issueType: "",
    category: "",
    description: "",
    status: "identified",
    isActive: true,
  });

  useEffect(() => {
    if (issueId) {
      loadData();
    }
  }, [issueId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getContextIssue(issueId!);
      setIssue(data);
      if (data) {
        setFormData({
          title: data.title,
          issueCode: data.issueCode,
          issueType: data.issueType,
          category: data.category,
          description: data.description || "",
          impactType: data.impactType || "",
          impactLevel: data.impactLevel || "",
          likelihood: data.likelihood || "",
          status: data.status,
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading issue:", err);
      toast.error("Failed to load context issue");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateContextIssue(issueId!, formData);
      toast.success("Context issue updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating issue:", err);
      toast.error("Failed to update context issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteContextIssue(issueId!);
      toast.success("Context issue deleted successfully");
      navigate("/organisation/context-issues");
    } catch (err) {
      console.error("Error deleting issue:", err);
      toast.error("Failed to delete context issue");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof ContextIssue>(field: K, value: ContextIssue[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Context issue not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/context-issues")}>
          Back to Context Issues
        </Button>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (issue.trendDirection === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (issue.trendDirection === "worsening") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={issue.title}
        description={issue.description || "Context issue details"}
        backLink="/organisation/context-issues"
        backLabel="Back to Context Issues"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono text-xs">{issue.issueCode}</Badge>
            <Badge variant={issue.issueType === "internal" ? "secondary" : "outline"}>
              {issue.issueType}
            </Badge>
            <Badge variant="secondary">{issue.category}</Badge>
            <StatusBadge
              status={issue.status}
              variant={issue.status === "resolved" ? "success" : issue.status === "monitoring" ? "warning" : "secondary"}
            />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <RecordActionsMenu
              onDelete={() => setDeleteOpen(true)}
              onHistory={() => {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set("tab", "history");
                window.history.pushState({}, "", `${window.location.pathname}?${urlParams.toString()}`);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impact Type</p>
                <p className="font-medium capitalize">{issue.impactType?.replace("_", " ") || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impact Level</p>
                <p className="font-medium capitalize">{issue.impactLevel || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getTrendIcon() || <TrendingUp className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <p className="font-medium capitalize">{issue.trendDirection || "-"}</p>
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
                <p className="text-sm text-muted-foreground">Next Review</p>
                <p className="font-medium">
                  {issue.nextReviewDate ? new Date(issue.nextReviewDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs defaultValue="overview" syncWithUrl className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="response">Response</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Likelihood</p>
                  <p className="capitalize">{issue.likelihood || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ISMS Relevance</p>
                  <p className="capitalize">{issue.ismsRelevance?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monitoring Frequency</p>
                  <p className="capitalize">{issue.monitoringFrequency?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Review</p>
                  <p>{issue.lastReviewDate ? new Date(issue.lastReviewDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
              {issue.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{issue.description}</p>
                </div>
              )}
              {issue.controlImplications && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Control Implications</p>
                  <p className="text-sm">{issue.controlImplications}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Response Strategy</p>
                <p className="capitalize">{issue.responseStrategy?.replace("_", " ") || "-"}</p>
              </div>
              {issue.mitigationActions && issue.mitigationActions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mitigation Actions</p>
                  <ul className="list-disc list-inside space-y-1">
                    {issue.mitigationActions.map((action, idx) => (
                      <li key={idx} className="text-sm">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {issue.affectedAreas && issue.affectedAreas.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Affected Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {issue.affectedAreas.map((area, idx) => (
                      <Badge key={idx} variant="outline">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={issue.createdAt}
            updatedAt={issue.updatedAt}
            entityType="Context Issue"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Context Issue"
        description="Update context issue details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.title?.trim() !== "" && formData.issueCode?.trim() !== ""}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="title"
            label="Title"
            value={formData.title || ""}
            onChange={(v) => updateField("title", v)}
            required
          />
          <FormField
            type="text"
            name="issueCode"
            label="Issue Code"
            value={formData.issueCode || ""}
            onChange={(v) => updateField("issueCode", v)}
            required
          />
        </FormRow>
        <FormRow>
          <FormField
            type="select"
            name="issueType"
            label="Type"
            value={formData.issueType || ""}
            onChange={(v) => updateField("issueType", v)}
            options={[
              { value: "internal", label: "Internal" },
              { value: "external", label: "External" },
            ]}
          />
          <FormField
            type="select"
            name="category"
            label="Category"
            value={formData.category || ""}
            onChange={(v) => updateField("category", v)}
            options={[
              { value: "political", label: "Political" },
              { value: "economic", label: "Economic" },
              { value: "social", label: "Social" },
              { value: "technological", label: "Technological" },
              { value: "legal", label: "Legal" },
              { value: "environmental", label: "Environmental" },
            ]}
          />
        </FormRow>
        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description || ""}
          onChange={(v) => updateField("description", v)}
          rows={2}
        />
        <FormRow>
          <FormField
            type="select"
            name="impactLevel"
            label="Impact Level"
            value={formData.impactLevel || ""}
            onChange={(v) => updateField("impactLevel", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ]}
          />
          <FormField
            type="select"
            name="status"
            label="Status"
            value={formData.status || ""}
            onChange={(v) => updateField("status", v)}
            options={[
              { value: "identified", label: "Identified" },
              { value: "monitoring", label: "Monitoring" },
              { value: "mitigating", label: "Mitigating" },
              { value: "resolved", label: "Resolved" },
            ]}
          />
        </FormRow>
        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive ?? true}
          onChange={(v) => updateField("isActive", v)}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Context Issue"
        description={`Are you sure you want to delete "${issue.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
