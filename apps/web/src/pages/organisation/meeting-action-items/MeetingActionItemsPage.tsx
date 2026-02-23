import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckSquare, AlertTriangle, Clock, Eye, Edit3, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  CriticalityBadge,
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
import { getMeetingActionItems, getActionItemsSummary, type MeetingActionItem } from "@/lib/organisation-api";

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  open: "default",
  in_progress: "warning",
  completed: "success",
  cancelled: "secondary",
  blocked: "destructive",
};

interface ActionItemFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  progressPercentage: number;
}

const emptyFormData: ActionItemFormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "open",
  dueDate: "",
  progressPercentage: 0,
};

export default function MeetingActionItemsPage() {
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [summary, setSummary] = useState<{ total: number; open: number; inProgress: number; completed: number; overdue: number } | null>(null);

  // Slide-over state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<ActionItemFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MeetingActionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, summaryData] = await Promise.all([
        getMeetingActionItems(),
        getActionItemsSummary(),
      ]);
      setActionItems(itemsData.results);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error loading action items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MeetingActionItem) => {
    setFormMode("edit");
    setFormData({
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      dueDate: item.dueDate.split("T")[0]!,
      progressPercentage: item.progressPercentage,
    });
    setEditingId(item.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // TODO: Implement API call when backend is ready
      toast.info("Save functionality not yet available");
      setFormOpen(false);
    } catch (err) {
      console.error("Error saving action item:", err);
      toast.error("Failed to save action item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item: MeetingActionItem) => {
    setDeletingItem(item);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      // TODO: Implement API call when backend is ready
      toast.info("Delete functionality not yet available");
      setDeleteOpen(false);
      setDeletingItem(null);
    } catch (err) {
      console.error("Error deleting action item:", err);
      toast.error("Failed to delete action item");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof ActionItemFormData>(field: K, value: ActionItemFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.title.trim() !== "" && formData.dueDate !== "";

  const isOverdue = (item: MeetingActionItem) => {
    return new Date(item.dueDate) < new Date() && !["completed", "cancelled"].includes(item.status);
  };

  const filteredItems = statusFilter === "all"
    ? actionItems
    : actionItems.filter((item) => item.status === statusFilter);

  const columns: Column<MeetingActionItem>[] = [
    {
      key: "actionNumber",
      header: "Action",
      className: "font-mono text-xs text-muted-foreground",
      render: (item) => item.actionNumber || "-",
    },
    {
      key: "title",
      header: "Title",
      render: (item) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/meeting-action-items/${item.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {item.title}
          </Link>
          <span className="text-xs text-muted-foreground">{item.meeting.committee.name}</span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      className: "text-center",
      render: (item) => <CriticalityBadge level={item.priority} />,
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (item) =>
        item.assignedTo ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {item.assignedTo.firstName?.[0]}{item.assignedTo.lastName?.[0]}
            </div>
            <span className="text-sm">{item.assignedTo.firstName} {item.assignedTo.lastName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (item) => (
        <div className={`text-sm ${isOverdue(item) ? "text-destructive font-medium" : ""}`}>
          {new Date(item.dueDate).toLocaleDateString()}
          {isOverdue(item) && <AlertTriangle className="inline ml-1 h-3 w-3" />}
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${item.progressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.progressPercentage}%</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (item) => (
        <StatusBadge
          status={item.status?.replace("_", " ") || "unknown"}
          variant={statusVariants[item.status] || "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<MeetingActionItem>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (item) => `/organisation/meeting-action-items/${item.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (item) => handleEdit(item),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (item) => handleDeleteClick(item),
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

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Action Items"
        description="Track and manage committee action items"
        backLink="/organisation"
        backLabel="Back"
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Open"
          value={summary?.open ?? 0}
          icon={<CheckSquare className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="In Progress"
          value={summary?.inProgress ?? 0}
          icon={<Clock className="h-4 w-4" />}
          iconClassName="text-warning"
        />
        <StatCard
          title="Overdue"
          value={summary?.overdue ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
        <StatCard
          title="Completed"
          value={summary?.completed ?? 0}
          icon={<CheckSquare className="h-4 w-4" />}
          iconClassName="text-success"
        />
      </StatCardGrid>

      <DataTable
        title="Action Items"
        data={filteredItems}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search action items..."
        searchFilter={(item, query) =>
          item.title.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No action items found"
        filterSlot={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Edit Slide-Over */}
      <SlideOverForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Edit Action Item"
        description="Update action item details"
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
          placeholder="Action item title"
          required
        />

        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(v) => updateField("description", v)}
          placeholder="Detailed description..."
          rows={3}
        />

        <FormRow>
          <FormField
            type="select"
            name="priority"
            label="Priority"
            value={formData.priority}
            onChange={(v) => updateField("priority", v)}
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
            value={formData.status}
            onChange={(v) => updateField("status", v)}
            options={[
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "blocked", label: "Blocked" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="date"
            name="dueDate"
            label="Due Date"
            value={formData.dueDate}
            onChange={(v) => updateField("dueDate", v)}
            required
          />
          <FormField
            type="number"
            name="progressPercentage"
            label="Progress (%)"
            value={formData.progressPercentage}
            onChange={(v) => updateField("progressPercentage", parseInt(v) || 0)}
            placeholder="0-100"
          />
        </FormRow>
      </SlideOverForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Action Item"
        description={`Are you sure you want to delete "${deletingItem?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
