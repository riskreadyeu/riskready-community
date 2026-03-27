import { useEffect, useState } from "react";
import { AlertCircle, Plus, Edit3, Trash2, TrendingUp, TrendingDown, Minus, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  StatCard,
  StatCardGrid,
  FormDialog,
  ConfirmDialog,
  FormField,
  FormRow,
  type Column,
  type RowAction,
} from "@/components/common";
import {
  getContextIssues,
  createContextIssue,
  updateContextIssue,
  deleteContextIssue,
  type ContextIssue,
} from "@/lib/organisation-api";

const issueTypeLabels: Record<string, string> = {
  internal: "Internal",
  external: "External",
};

const categoryLabels: Record<string, string> = {
  people: "People",
  technology: "Technology",
  process: "Process",
  resources: "Resources",
  legal_regulatory: "Legal/Regulatory",
  market: "Market",
  economic: "Economic",
  political: "Political",
  social: "Social",
  environmental: "Environmental",
};

const impactTypeLabels: Record<string, string> = {
  positive: "Opportunity",
  negative: "Threat",
  neutral: "Neutral",
};

const impactTypeVariants: Record<string, "success" | "destructive" | "secondary"> = {
  positive: "success",
  negative: "destructive",
  neutral: "secondary",
};

interface IssueFormData {
  issueCode: string;
  issueType: string;
  category: string;
  title: string;
  description: string;
  impactType: string;
  impactLevel: string;
  likelihood: string;
  ismsRelevance: string;
  responseStrategy: string;
  monitoringFrequency: string;
  status: string;
  isActive: boolean;
}

const emptyFormData: IssueFormData = {
  issueCode: "",
  issueType: "internal",
  category: "technology",
  title: "",
  description: "",
  impactType: "negative",
  impactLevel: "medium",
  likelihood: "possible",
  ismsRelevance: "",
  responseStrategy: "mitigate",
  monitoringFrequency: "quarterly",
  status: "active",
  isActive: true,
};

export default function ContextIssuesPage() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<ContextIssue[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");

  // CRUD state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<IssueFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState<ContextIssue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getContextIssues();
      setIssues(data.results);
    } catch (err) {
      console.error("Error loading issues:", err);
      toast.error("Failed to load context issues");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormMode("create");
    setFormData(emptyFormData);
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (issue: ContextIssue) => {
    setFormMode("edit");
    setFormData({
      issueCode: issue.issueCode,
      issueType: issue.issueType,
      category: issue.category,
      title: issue.title,
      description: issue.description || "",
      impactType: issue.impactType || "negative",
      impactLevel: issue.impactLevel || "medium",
      likelihood: issue.likelihood || "possible",
      ismsRelevance: issue.ismsRelevance || "",
      responseStrategy: issue.responseStrategy || "mitigate",
      monitoringFrequency: issue.monitoringFrequency || "quarterly",
      status: issue.status,
      isActive: issue.isActive,
    });
    setEditingId(issue.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createContextIssue(formData);
        toast.success("Context issue created successfully");
      } else if (editingId) {
        await updateContextIssue(editingId, formData);
        toast.success("Context issue updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving issue:", err);
      toast.error("Failed to save context issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (issue: ContextIssue) => {
    setDeletingIssue(issue);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIssue) return;
    try {
      setIsDeleting(true);
      await deleteContextIssue(deletingIssue.id);
      toast.success("Context issue deleted successfully");
      setDeleteOpen(false);
      setDeletingIssue(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting issue:", err);
      toast.error("Failed to delete context issue");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof IssueFormData>(field: K, value: IssueFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.title.trim() !== "" && formData.issueCode.trim() !== "";

  const filteredIssues = issues.filter((i) => {
    if (typeFilter !== "all" && i.issueType !== typeFilter) return false;
    return true;
  });

  const columns: Column<ContextIssue>[] = [
    {
      key: "title",
      header: "Issue",
      render: (issue) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{issue.title}</span>
          <span className="text-xs text-muted-foreground font-mono">{issue.issueCode}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (issue) => (
        <Badge variant={issue.issueType === "internal" ? "default" : "outline"} className="text-xs">
          {issueTypeLabels[issue.issueType] || issue.issueType}
        </Badge>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (issue) => (
        <span className="text-sm">{categoryLabels[issue.category] || issue.category}</span>
      ),
    },
    {
      key: "impact",
      header: "Impact",
      render: (issue) => (
        <StatusBadge
          status={impactTypeLabels[issue.impactType || ""] || issue.impactType || "-"}
          variant={impactTypeVariants[issue.impactType || ""] || "secondary"}
        />
      ),
    },
    {
      key: "trend",
      header: "Trend",
      render: (issue) => {
        if (issue.trendDirection === "improving") {
          return <TrendingUp className="h-4 w-4 text-success" />;
        } else if (issue.trendDirection === "worsening") {
          return <TrendingDown className="h-4 w-4 text-destructive" />;
        }
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (issue) => (
        <StatusBadge
          status={issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
          variant={issue.status === "active" ? "warning" : issue.status === "resolved" ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions = (issue: ContextIssue): RowAction<ContextIssue>[] => [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      href: (i) => `/organisation/context-issues/${issue.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (i) => handleEdit(issue),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (i) => handleDeleteClick(issue),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const internalCount = issues.filter((i) => i.issueType === "internal").length;
  const externalCount = issues.filter((i) => i.issueType === "external").length;
  const threatCount = issues.filter((i) => i.impactType === "negative").length;
  const opportunityCount = issues.filter((i) => i.impactType === "positive").length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Context Issues"
        description="ISO 27001 Clause 4.1 - Understanding the organization and its context"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Issue
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Issues"
          value={issues.length}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Internal"
          value={internalCount}
          icon={<AlertCircle className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="External"
          value={externalCount}
          icon={<AlertCircle className="h-4 w-4" />}
          iconClassName="text-warning"
        />
        <StatCard
          title="Threats"
          value={threatCount}
          subtitle={`${opportunityCount} opportunities`}
          icon={<TrendingDown className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
      </StatCardGrid>

      <DataTable
        title="Context Issues Register (Clause 4.1)"
        data={filteredIssues}
        columns={columns}
        keyExtractor={(issue) => issue.id}
        searchPlaceholder="Search issues..."
        searchFilter={(issue, query) =>
          issue.title.toLowerCase().includes(query.toLowerCase()) ||
          issue.issueCode.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No context issues found"
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Add Context Issue" : "Edit Context Issue"}
        description={formMode === "create" ? "Add a new internal or external issue" : "Update context issue details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Create" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="issueCode"
            label="Issue Code"
            value={formData.issueCode}
            onChange={(v) => updateField("issueCode", v)}
            placeholder="e.g., INT-001 or EXT-001"
            required
          />
          <FormField
            type="text"
            name="title"
            label="Title"
            value={formData.title}
            onChange={(v) => updateField("title", v)}
            placeholder="Issue title"
            required
          />
        </FormRow>

        <FormRow>
          <FormField
            type="select"
            name="issueType"
            label="Type"
            value={formData.issueType}
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
            value={formData.category}
            onChange={(v) => updateField("category", v)}
            options={[
              { value: "people", label: "People" },
              { value: "technology", label: "Technology" },
              { value: "process", label: "Process" },
              { value: "resources", label: "Resources" },
              { value: "legal_regulatory", label: "Legal/Regulatory" },
              { value: "market", label: "Market" },
              { value: "economic", label: "Economic" },
              { value: "political", label: "Political" },
            ]}
          />
        </FormRow>

        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(v) => updateField("description", v)}
          placeholder="Describe the issue..."
          rows={2}
        />

        <FormRow>
          <FormField
            type="select"
            name="impactType"
            label="Impact Type"
            value={formData.impactType}
            onChange={(v) => updateField("impactType", v)}
            options={[
              { value: "positive", label: "Opportunity" },
              { value: "negative", label: "Threat" },
              { value: "neutral", label: "Neutral" },
            ]}
          />
          <FormField
            type="select"
            name="impactLevel"
            label="Impact Level"
            value={formData.impactLevel}
            onChange={(v) => updateField("impactLevel", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ]}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="select"
            name="responseStrategy"
            label="Response Strategy"
            value={formData.responseStrategy}
            onChange={(v) => updateField("responseStrategy", v)}
            options={[
              { value: "accept", label: "Accept" },
              { value: "mitigate", label: "Mitigate" },
              { value: "transfer", label: "Transfer" },
              { value: "avoid", label: "Avoid" },
            ]}
          />
          <FormField
            type="select"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(v) => updateField("status", v)}
            options={[
              { value: "active", label: "Active" },
              { value: "monitoring", label: "Monitoring" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ]}
          />
        </FormRow>

        <FormField
          type="textarea"
          name="ismsRelevance"
          label="ISMS Relevance"
          value={formData.ismsRelevance}
          onChange={(v) => updateField("ismsRelevance", v)}
          placeholder="How does this issue affect the ISMS?"
          rows={2}
        />

        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive}
          onChange={(v) => updateField("isActive", v)}
          description="Issue is currently being tracked"
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Context Issue"
        description={`Are you sure you want to delete "${deletingIssue?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
