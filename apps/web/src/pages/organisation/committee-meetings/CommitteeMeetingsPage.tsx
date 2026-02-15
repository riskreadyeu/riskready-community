import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus, Users, Clock, Eye, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  getCommitteeMeetings,
  getSecurityCommittees,
  type CommitteeMeeting,
  type SecurityCommittee,
} from "@/lib/organisation-api";

const meetingTypeLabels: Record<string, string> = {
  regular: "Regular",
  special: "Special",
  emergency: "Emergency",
  annual: "Annual",
  quarterly: "Quarterly",
};

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  scheduled: "default",
  in_progress: "warning",
  completed: "success",
  cancelled: "secondary",
  postponed: "warning",
};

interface MeetingFormData {
  committeeId: string;
  title: string;
  meetingType: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  status: string;
}

const emptyFormData: MeetingFormData = {
  committeeId: "",
  title: "",
  meetingType: "regular",
  meetingDate: "",
  startTime: "",
  endTime: "",
  location: "",
  agenda: "",
  status: "scheduled",
};

export default function CommitteeMeetingsPage() {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<CommitteeMeeting[]>([]);
  const [committees, setCommittees] = useState<SecurityCommittee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Slide-over state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<MeetingFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState<CommitteeMeeting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meetingsData, committeesData] = await Promise.all([
        getCommitteeMeetings(),
        getSecurityCommittees(),
      ]);
      setMeetings(meetingsData.results);
      setCommittees(committeesData.results);
    } catch (err) {
      console.error("Error loading meetings:", err);
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

  const handleEdit = (meeting: CommitteeMeeting) => {
    setFormMode("edit");
    setFormData({
      committeeId: meeting.committee.id,
      title: meeting.title,
      meetingType: meeting.meetingType,
      meetingDate: meeting.meetingDate.split("T")[0]!,
      startTime: meeting.startTime,
      endTime: meeting.endTime || "",
      location: "",
      agenda: "",
      status: meeting.status,
    });
    setEditingId(meeting.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // TODO: Implement API call when backend is ready
      console.log(formMode === "create" ? "Creating meeting:" : "Updating meeting:", formData);
      toast.success(formMode === "create" ? "Meeting scheduled successfully" : "Meeting updated successfully");
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving meeting:", err);
      toast.error("Failed to save meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (meeting: CommitteeMeeting) => {
    setDeletingMeeting(meeting);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMeeting) return;
    try {
      setIsDeleting(true);
      // TODO: Implement API call when backend is ready
      console.log("Deleting meeting:", deletingMeeting.id);
      toast.success("Meeting deleted successfully");
      setDeleteOpen(false);
      setDeletingMeeting(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting meeting:", err);
      toast.error("Failed to delete meeting");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof MeetingFormData>(field: K, value: MeetingFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.title.trim() !== "" && formData.committeeId !== "" && formData.meetingDate !== "";

  const filteredMeetings = statusFilter === "all"
    ? meetings
    : meetings.filter((m) => m.status === statusFilter);

  const columns: Column<CommitteeMeeting>[] = [
    {
      key: "meetingNumber",
      header: "#",
      className: "font-mono text-xs text-muted-foreground w-16",
      render: (meeting) => meeting.meetingNumber || "-",
    },
    {
      key: "title",
      header: "Meeting",
      render: (meeting) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/committee-meetings/${meeting.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {meeting.title}
          </Link>
          <span className="text-xs text-muted-foreground">{meeting.committee.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (meeting) => (
        <Badge variant="outline">
          {meetingTypeLabels[meeting.meetingType] || meeting.meetingType}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      render: (meeting) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {new Date(meeting.meetingDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {meeting.startTime}{meeting.endTime ? ` - ${meeting.endTime}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "chair",
      header: "Chair",
      render: (meeting) =>
        meeting.chair ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {meeting.chair.firstName?.[0]}{meeting.chair.lastName?.[0]}
            </div>
            <span className="text-sm">{meeting.chair.firstName} {meeting.chair.lastName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "attendees",
      header: "Attendees",
      className: "text-center",
      render: (meeting) => (
        <div className="flex items-center justify-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{meeting._count?.attendances ?? 0}</span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      className: "text-center",
      render: (meeting) => (
        <div className="flex items-center justify-center gap-2 text-xs">
          <span title="Decisions">{meeting._count?.decisions ?? 0} D</span>
          <span className="text-muted-foreground">|</span>
          <span title="Actions">{meeting._count?.actionItems ?? 0} A</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (meeting) => (
        <StatusBadge
          status={meeting.status?.replace("_", " ") || "unknown"}
          variant={statusVariants[meeting.status] || "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<CommitteeMeeting>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (meeting) => `/organisation/committee-meetings/${meeting.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (meeting) => handleEdit(meeting),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (meeting) => handleDeleteClick(meeting),
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

  const scheduledCount = meetings.filter((m) => m.status === "scheduled").length;
  const completedCount = meetings.filter((m) => m.status === "completed").length;
  const totalDecisions = meetings.reduce((sum, m) => sum + (m._count?.decisions ?? 0), 0);
  const totalActions = meetings.reduce((sum, m) => sum + (m._count?.actionItems ?? 0), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Committee Meetings"
        description="Schedule and manage committee meetings, decisions, and action items"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Meetings"
          value={meetings.length}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Scheduled"
          value={scheduledCount}
          icon={<Clock className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<Calendar className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Decisions / Actions"
          value={`${totalDecisions} / ${totalActions}`}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-muted-foreground"
        />
      </StatCardGrid>

      <DataTable
        title="Meeting Schedule"
        data={filteredMeetings}
        columns={columns}
        keyExtractor={(meeting) => meeting.id}
        searchPlaceholder="Search meetings..."
        searchFilter={(meeting, query) =>
          meeting.title.toLowerCase().includes(query.toLowerCase()) ||
          meeting.committee.name.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No meetings found"
        filterSlot={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="postponed">Postponed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create/Edit Slide-Over */}
      <SlideOverForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Schedule Meeting" : "Edit Meeting"}
        description={formMode === "create" ? "Schedule a new committee meeting" : "Update meeting details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Schedule" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="lg"
      >
        <FormField
          type="select"
          name="committeeId"
          label="Committee"
          value={formData.committeeId}
          onChange={(v) => updateField("committeeId", v)}
          options={committees.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select committee"
          required
        />

        <FormField
          type="text"
          name="title"
          label="Meeting Title"
          value={formData.title}
          onChange={(v) => updateField("title", v)}
          placeholder="e.g., Q4 Security Review"
          required
        />

        <FormRow>
          <FormField
            type="select"
            name="meetingType"
            label="Meeting Type"
            value={formData.meetingType}
            onChange={(v) => updateField("meetingType", v)}
            options={[
              { value: "regular", label: "Regular" },
              { value: "special", label: "Special" },
              { value: "emergency", label: "Emergency" },
              { value: "annual", label: "Annual" },
              { value: "quarterly", label: "Quarterly" },
            ]}
          />
          <FormField
            type="select"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(v) => updateField("status", v)}
            options={[
              { value: "scheduled", label: "Scheduled" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
              { value: "postponed", label: "Postponed" },
            ]}
          />
        </FormRow>

        <FormField
          type="date"
          name="meetingDate"
          label="Meeting Date"
          value={formData.meetingDate}
          onChange={(v) => updateField("meetingDate", v)}
          required
        />

        <FormRow>
          <FormField
            type="text"
            name="startTime"
            label="Start Time"
            value={formData.startTime}
            onChange={(v) => updateField("startTime", v)}
            placeholder="e.g., 09:00"
          />
          <FormField
            type="text"
            name="endTime"
            label="End Time"
            value={formData.endTime}
            onChange={(v) => updateField("endTime", v)}
            placeholder="e.g., 10:30"
          />
        </FormRow>

        <FormField
          type="text"
          name="location"
          label="Location"
          value={formData.location}
          onChange={(v) => updateField("location", v)}
          placeholder="e.g., Conference Room A / Virtual"
        />

        <FormField
          type="textarea"
          name="agenda"
          label="Agenda"
          value={formData.agenda}
          onChange={(v) => updateField("agenda", v)}
          placeholder="Meeting agenda items..."
          rows={4}
        />
      </SlideOverForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Meeting"
        description={`Are you sure you want to delete "${deletingMeeting?.title}"? This will also remove all associated decisions and action items.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
