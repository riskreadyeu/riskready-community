import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Building2,
  Target,
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
  getInterestedParty,
  updateInterestedParty,
  deleteInterestedParty,
  type InterestedParty,
} from "@/lib/organisation-api";

export default function InterestedPartyDetailPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [party, setParty] = useState<InterestedParty | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<InterestedParty>>({
    name: "",
    partyCode: "",
    partyType: "",
    description: "",
    powerLevel: "",
    interestLevel: "",
    isActive: true,
  });

  useEffect(() => {
    if (partyId) {
      loadData();
    }
  }, [partyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getInterestedParty(partyId!);
      setParty(data);
      if (data) {
        setFormData({
          name: data.name,
          partyCode: data.partyCode,
          partyType: data.partyType,
          description: data.description || "",
          powerLevel: data.powerLevel || "",
          interestLevel: data.interestLevel || "",
          contactName: data.contactName || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading party:", err);
      toast.error("Failed to load interested party");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateInterestedParty(partyId!, formData);
      toast.success("Interested party updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating party:", err);
      toast.error("Failed to update interested party");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteInterestedParty(partyId!);
      toast.success("Interested party deleted successfully");
      navigate("/organisation/interested-parties");
    } catch (err) {
      console.error("Error deleting party:", err);
      toast.error("Failed to delete interested party");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof InterestedParty>(field: K, value: InterestedParty[K]) => {
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

  if (!party) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Interested party not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/interested-parties")}>
          Back to Interested Parties
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={party.name}
        description={party.description || "Interested party details"}
        backLink="/organisation/interested-parties"
        backLabel="Back to Interested Parties"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono text-xs">{party.partyCode}</Badge>
            <Badge variant="secondary">{party.partyType}</Badge>
            <StatusBadge
              status={party.isActive ? "Active" : "Inactive"}
              variant={party.isActive ? "success" : "secondary"}
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
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{party.partyType.replace("_", " ")}</p>
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
                <p className="text-sm text-muted-foreground">Power Level</p>
                <p className="font-medium capitalize">{party.powerLevel || "-"}</p>
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
                <p className="text-sm text-muted-foreground">Interest Level</p>
                <p className="font-medium capitalize">{party.interestLevel || "-"}</p>
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
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium text-sm truncate">{party.contactEmail || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs syncWithUrl defaultValue="overview" className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="engagement">Engagement</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Party Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p>{party.contactName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Email</p>
                  <p>{party.contactEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Phone</p>
                  <p>{party.contactPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relationship Status</p>
                  <p className="capitalize">{party.relationshipStatus?.replace("_", " ") || "-"}</p>
                </div>
              </div>
              {party.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{party.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Strategy</p>
                  <p className="capitalize">{party.engagementStrategy?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Communication Frequency</p>
                  <p className="capitalize">{party.communicationFrequency?.replace("_", " ") || "-"}</p>
                </div>
              </div>
              {party.expectations && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expectations</p>
                  <p className="text-sm">{party.expectations}</p>
                </div>
              )}
              {party.requirements && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Requirements</p>
                  <p className="text-sm">{party.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={party.createdAt}
            updatedAt={party.updatedAt}
            entityType="Interested Party"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Interested Party"
        description="Update interested party details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name?.trim() !== "" && formData.partyCode?.trim() !== ""}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="name"
            label="Name"
            value={formData.name || ""}
            onChange={(v) => updateField("name", v)}
            required
          />
          <FormField
            type="text"
            name="partyCode"
            label="Party Code"
            value={formData.partyCode || ""}
            onChange={(v) => updateField("partyCode", v)}
            required
          />
        </FormRow>
        <FormRow>
          <FormField
            type="select"
            name="partyType"
            label="Type"
            value={formData.partyType || ""}
            onChange={(v) => updateField("partyType", v)}
            options={[
              { value: "customer", label: "Customer" },
              { value: "supplier", label: "Supplier" },
              { value: "regulator", label: "Regulator" },
              { value: "shareholder", label: "Shareholder" },
              { value: "employee", label: "Employee" },
              { value: "partner", label: "Partner" },
              { value: "community", label: "Community" },
            ]}
          />
          <FormField
            type="select"
            name="powerLevel"
            label="Power Level"
            value={formData.powerLevel || ""}
            onChange={(v) => updateField("powerLevel", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
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
            type="text"
            name="contactName"
            label="Contact Name"
            value={formData.contactName || ""}
            onChange={(v) => updateField("contactName", v)}
          />
          <FormField
            type="email"
            name="contactEmail"
            label="Contact Email"
            value={formData.contactEmail || ""}
            onChange={(v) => updateField("contactEmail", v)}
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
        title="Delete Interested Party"
        description={`Are you sure you want to delete "${party.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
