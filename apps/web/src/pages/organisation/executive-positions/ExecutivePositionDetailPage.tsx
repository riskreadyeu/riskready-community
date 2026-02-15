import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Crown,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArcherTabs,
  ArcherTabsContent,
  ArcherTabsList,
  ArcherTabsTrigger,
} from "@/components/common";
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
  getExecutivePosition,
  updateExecutivePosition,
  deleteExecutivePosition,
  type ExecutivePosition,
} from "@/lib/organisation-api";

export default function ExecutivePositionDetailPage() {
  const { positionId } = useParams<{ positionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<ExecutivePosition | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<ExecutivePosition>>({
    title: "",
    positionLevel: "",
    responsibilities: "",
    isActive: true,
  });

  useEffect(() => {
    if (positionId) {
      loadData();
    }
  }, [positionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getExecutivePosition(positionId!);
      setPosition(data);
      if (data) {
        setFormData({
          title: data.title,
          positionLevel: data.positionLevel || "",
          responsibilities: data.responsibilities || "",
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading position:", err);
      toast.error("Failed to load position");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateExecutivePosition(positionId!, formData);
      toast.success("Position updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating position:", err);
      toast.error("Failed to update position");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteExecutivePosition(positionId!);
      toast.success("Position deleted successfully");
      navigate("/organisation/executive-positions");
    } catch (err) {
      console.error("Error deleting position:", err);
      toast.error("Failed to delete position");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof ExecutivePosition>(field: K, value: ExecutivePosition[K]) => {
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

  if (!position) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Position not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/executive-positions")}>
          Back to Executive Positions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={position.title}
        description="Executive position details"
        backLink="/organisation/executive-positions"
        backLabel="Back to Executive Positions"
        badge={
          <div className="flex gap-2">
            {position.positionLevel && <Badge variant="outline">{position.positionLevel}</Badge>}
            <StatusBadge
              status={position.isActive ? "Active" : "Inactive"}
              variant={position.isActive ? "success" : "secondary"}
            />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <RecordActionsMenu
              onEdit={() => setEditOpen(true)}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-medium capitalize">{position.positionLevel?.replace("_", " ") || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holder</p>
                <p className="font-medium">
                  {position.holder ? `${position.holder.firstName} ${position.holder.lastName}` : "Vacant"}
                </p>
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
                <p className="text-sm text-muted-foreground">Appointed</p>
                <p className="font-medium">
                  {position.appointmentDate ? new Date(position.appointmentDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{position.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs syncWithUrl defaultValue="overview" className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Position Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {position.responsibilities && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Responsibilities</p>
                  <p className="text-sm">{position.responsibilities}</p>
                </div>
              )}
              {position.holder && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Current Holder</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p>{position.holder.firstName} {position.holder.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{position.holder.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={position.createdAt}
            updatedAt={position.updatedAt}
            entityType="Executive Position"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Position"
        description="Update position details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.title?.trim() !== ""}
        size="lg"
      >
        <FormField
          type="text"
          name="title"
          label="Title"
          value={formData.title || ""}
          onChange={(v) => updateField("title", v)}
          required
        />
        <FormField
          type="select"
          name="positionLevel"
          label="Level"
          value={formData.positionLevel || ""}
          onChange={(v) => updateField("positionLevel", v)}
          options={[
            { value: "c_level", label: "C-Level" },
            { value: "vp", label: "VP" },
            { value: "director", label: "Director" },
            { value: "senior_manager", label: "Senior Manager" },
          ]}
        />
        <FormField
          type="textarea"
          name="responsibilities"
          label="Responsibilities"
          value={formData.responsibilities || ""}
          onChange={(v) => updateField("responsibilities", v)}
          rows={3}
        />
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
        title="Delete Position"
        description={`Are you sure you want to delete "${position.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
