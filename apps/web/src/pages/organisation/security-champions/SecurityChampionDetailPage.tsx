import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Shield,
  Edit3,
  Trash2,
  Mail,
  Building2,
  Calendar,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  ConfirmDialog,
  FormDialog,
  FormField,
  FormRow,
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import {
  getSecurityChampion,
  updateSecurityChampion,
  deleteSecurityChampion,
  type SecurityChampion,
} from "@/lib/organisation-api";

export default function SecurityChampionDetailPage() {
  const { championId } = useParams<{ championId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [champion, setChampion] = useState<SecurityChampion | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<SecurityChampion>>({
    focusArea: "",
    certifications: "",
    isActive: true,
  });

  useEffect(() => {
    if (championId) {
      loadData();
    }
  }, [championId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSecurityChampion(championId!);
      setChampion(data);
      if (data) {
        setFormData({
          focusArea: data.focusArea || "",
          certifications: data.certifications || "",
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading champion:", err);
      toast.error("Failed to load security champion");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateSecurityChampion(championId!, formData);
      toast.success("Security champion updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating champion:", err);
      toast.error("Failed to update security champion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSecurityChampion(championId!);
      toast.success("Security champion deleted successfully");
      navigate("/organisation/security-champions");
    } catch (err) {
      console.error("Error deleting champion:", err);
      toast.error("Failed to delete security champion");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof SecurityChampion>(field: K, value: SecurityChampion[K]) => {
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

  if (!champion) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Security champion not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/security-champions")}>
          Back to Security Champions
        </Button>
      </div>
    );
  }

  const championName = champion.user ? `${champion.user.firstName} ${champion.user.lastName}` : "Unknown";

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={championName}
        description="Security champion details"
        backLink="/organisation/security-champions"
        backLabel="Back to Security Champions"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline">
              <Shield className="h-3 w-3 mr-1" />
              Security Champion
            </Badge>
            <StatusBadge
              status={champion.isActive ? "Active" : "Inactive"}
              variant={champion.isActive ? "success" : "secondary"}
            />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <RecordActionsMenu
              recordType="Security Champion"
              recordName={championName}
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
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Focus Area</p>
                <p className="font-medium">{champion.focusArea || "-"}</p>
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
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{champion.department?.name || "-"}</p>
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
                  {champion.appointmentDate ? new Date(champion.appointmentDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certifications</p>
                <p className="font-medium text-sm">{champion.certifications || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs defaultValue="overview" className="space-y-4" syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Champion Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {champion.user && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p>{champion.user.firstName} {champion.user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{champion.user.email}</p>
                  </div>
                </div>
              )}
              {champion.responsibilities && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Responsibilities</p>
                  <p className="text-sm">{champion.responsibilities}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            entityType="SecurityChampion"
            entityId={championId!}
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Security Champion"
        description="Update security champion details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={true}
        size="lg"
      >
        <FormField
          type="text"
          name="focusArea"
          label="Focus Area"
          value={formData.focusArea || ""}
          onChange={(v) => updateField("focusArea", v)}
        />
        <FormField
          type="text"
          name="certifications"
          label="Certifications"
          value={formData.certifications || ""}
          onChange={(v) => updateField("certifications", v)}
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
        title="Delete Security Champion"
        description={`Are you sure you want to remove "${championName}" as a security champion? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
