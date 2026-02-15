import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gavel, Calendar, Eye, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  SlideOverForm,
  FormField,
  FormRow,
  ConfirmDialog,
  type Column,
  type RowAction,
} from "@/components/common";

interface MeetingDecision {
  id: string;
  decisionNumber?: string;
  title: string;
  description: string;
  decisionType: string;
  status: string;
  effectiveDate?: string;
  expiryDate?: string;
  meeting: {
    id: string;
    title: string;
    meetingDate: string;
    committee: { id: string; name: string };
  };
  createdAt: string;
  updatedAt: string;
}

const decisionTypeLabels: Record<string, string> = {
  policy: "Policy",
  procedure: "Procedure",
  approval: "Approval",
  budget: "Budget",
  strategic: "Strategic",
  operational: "Operational",
  risk_acceptance: "Risk Acceptance",
};

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  draft: "secondary",
  pending_approval: "warning",
  approved: "success",
  implemented: "success",
  rejected: "destructive",
  superseded: "secondary",
  expired: "secondary",
};

async function getMeetingDecisions(): Promise<{ results: MeetingDecision[]; count: number }> {
  const res = await fetch('/api/organisation/meeting-decisions', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch meeting decisions');
  return res.json();
}

interface DecisionFormData {
  title: string;
  description: string;
  decisionType: string;
  status: string;
  effectiveDate: string;
  expiryDate: string;
}

const emptyFormData: DecisionFormData = {
  title: "",
  description: "",
  decisionType: "policy",
  status: "draft",
  effectiveDate: "",
  expiryDate: "",
};

export default function MeetingDecisionsPage() {
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Slide-over state
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<DecisionFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDecision, setDeletingDecision] = useState<MeetingDecision | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMeetingDecisions();
      setDecisions(data.results);
    } catch (err) {
      console.error("Error loading decisions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (decision: MeetingDecision) => {
    setFormData({
      title: decision.title,
      description: decision.description,
      decisionType: decision.decisionType,
      status: decision.status,
      effectiveDate: decision.effectiveDate?.split("T")[0] || "",
      expiryDate: decision.expiryDate?.split("T")[0] || "",
    });
    setEditingId(decision.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // TODO: Implement API call when backend is ready
      console.log("Updating decision:", formData);
      toast.success("Decision updated successfully");
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving decision:", err);
      toast.error("Failed to save decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (decision: MeetingDecision) => {
    setDeletingDecision(decision);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDecision) return;
    try {
      setIsDeleting(true);
      // TODO: Implement API call when backend is ready
      console.log("Deleting decision:", deletingDecision.id);
      toast.success("Decision deleted successfully");
      setDeleteOpen(false);
      setDeletingDecision(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting decision:", err);
      toast.error("Failed to delete decision");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof DecisionFormData>(field: K, value: DecisionFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.title.trim() !== "";

  const filteredDecisions = statusFilter === "all"
    ? decisions
    : decisions.filter((d) => d.status === statusFilter);

  const columns: Column<MeetingDecision>[] = [
    {
      key: "decisionNumber",
      header: "#",
      className: "font-mono text-xs text-muted-foreground w-20",
      render: (decision) => decision.decisionNumber || "-",
    },
    {
      key: "title",
      header: "Decision",
      render: (decision) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/meeting-decisions/${decision.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {decision.title}
          </Link>
          <span className="text-xs text-muted-foreground">{decision.meeting.committee.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (decision) => (
        <Badge variant="outline">
          {decisionTypeLabels[decision.decisionType] || decision.decisionType}
        </Badge>
      ),
    },
    {
      key: "meeting",
      header: "Meeting",
      render: (decision) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {new Date(decision.meeting.meetingDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "effectiveDate",
      header: "Effective",
      render: (decision) =>
        decision.effectiveDate ? (
          new Date(decision.effectiveDate).toLocaleDateString()
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "expiryDate",
      header: "Expiry",
      render: (decision) =>
        decision.expiryDate ? (
          <span className={new Date(decision.expiryDate) < new Date() ? "text-destructive" : ""}>
            {new Date(decision.expiryDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (decision) => (
        <StatusBadge
          status={decision.status?.replace("_", " ") || "unknown"}
          variant={statusVariants[decision.status] || "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<MeetingDecision>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (decision) => `/organisation/meeting-decisions/${decision.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (decision) => handleEdit(decision),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (decision) => handleDeleteClick(decision),
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

  const approvedCount = decisions.filter((d) => d.status === "approved" || d.status === "implemented").length;
  const pendingCount = decisions.filter((d) => d.status === "pending_approval" || d.status === "draft").length;
  const expiredCount = decisions.filter((d) => d.expiryDate && new Date(d.expiryDate) < new Date()).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Meeting Decisions"
        description="Track and manage committee decisions and their implementation"
        backLink="/organisation"
        backLabel="Back"
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Decisions"
          value={decisions.length}
          icon={<Gavel className="h-4 w-4" />}
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={<Gavel className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={<Gavel className="h-4 w-4" />}
          iconClassName="text-warning"
        />
        <StatCard
          title="Expired"
          value={expiredCount}
          icon={<Gavel className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
      </StatCardGrid>

      <DataTable
        title="Decision Registry"
        data={filteredDecisions}
        columns={columns}
        keyExtractor={(decision) => decision.id}
        searchPlaceholder="Search decisions..."
        searchFilter={(decision, query) =>
          decision.title.toLowerCase().includes(query.toLowerCase()) ||
          (decision.decisionNumber?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No decisions found"
        filterSlot={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="superseded">Superseded</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Edit Slide-Over */}
      <SlideOverForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Edit Decision"
        description="Update decision details"
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="md"
      >
        <FormField
          type="text"
          name="title"
          label="Title"
          value={formData.title}
          onChange={(v) => updateField("title", v)}
          placeholder="Decision title"
          required
        />

        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(v) => updateField("description", v)}
          placeholder="Decision details..."
          rows={3}
        />

        <FormRow>
          <FormField
            type="select"
            name="decisionType"
            label="Type"
            value={formData.decisionType}
            onChange={(v) => updateField("decisionType", v)}
            options={[
              { value: "policy", label: "Policy" },
              { value: "procedure", label: "Procedure" },
              { value: "approval", label: "Approval" },
              { value: "budget", label: "Budget" },
              { value: "strategic", label: "Strategic" },
              { value: "operational", label: "Operational" },
              { value: "risk_acceptance", label: "Risk Acceptance" },
            ]}
          />
          <FormField
            type="select"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(v) => updateField("status", v)}
            options={[
              { value: "draft", label: "Draft" },
              { value: "pending_approval", label: "Pending Approval" },
              { value: "approved", label: "Approved" },
              { value: "implemented", label: "Implemented" },
              { value: "rejected", label: "Rejected" },
              { value: "superseded", label: "Superseded" },
            ]}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="date"
            name="effectiveDate"
            label="Effective Date"
            value={formData.effectiveDate}
            onChange={(v) => updateField("effectiveDate", v)}
          />
          <FormField
            type="date"
            name="expiryDate"
            label="Expiry Date"
            value={formData.expiryDate}
            onChange={(v) => updateField("expiryDate", v)}
          />
        </FormRow>
      </SlideOverForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Decision"
        description={`Are you sure you want to delete "${deletingDecision?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
