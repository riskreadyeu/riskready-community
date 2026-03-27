import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Server,
  Edit3,
  Trash2,
  Cloud,
  Calendar,
  Shield,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  CriticalityBadge,
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
  getTechnologyPlatform,
  updateTechnologyPlatform,
  deleteTechnologyPlatform,
  type TechnologyPlatform,
} from "@/lib/organisation-api";

export default function TechnologyPlatformDetailPage() {
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<TechnologyPlatform | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<TechnologyPlatform>>({
    name: "",
    platformCode: "",
    platformType: "",
    description: "",
    vendor: "",
    inIsmsScope: true,
    isActive: true,
  });

  useEffect(() => {
    if (platformId) {
      loadData();
    }
  }, [platformId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTechnologyPlatform(platformId!);
      setPlatform(data);
      if (data) {
        setFormData({
          name: data.name,
          platformCode: data.platformCode,
          platformType: data.platformType,
          description: data.description || "",
          vendor: data.vendor || "",
          cloudProvider: data.cloudProvider || "",
          deploymentModel: data.deploymentModel || "",
          criticalityLevel: data.criticalityLevel || "",
          inIsmsScope: data.inIsmsScope,
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading platform:", err);
      toast.error("Failed to load technology platform");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateTechnologyPlatform(platformId!, formData);
      toast.success("Platform updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating platform:", err);
      toast.error("Failed to update platform");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTechnologyPlatform(platformId!);
      toast.success("Platform deleted successfully");
      navigate("/organisation/technology-platforms");
    } catch (err) {
      console.error("Error deleting platform:", err);
      toast.error("Failed to delete platform");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof TechnologyPlatform>(field: K, value: TechnologyPlatform[K]) => {
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

  if (!platform) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Platform not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/technology-platforms")}>
          Back to Technology Platforms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={platform.name}
        description={platform.description || "Technology platform details"}
        backLink="/organisation/technology-platforms"
        backLabel="Back to Technology Platforms"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono text-xs">{platform.platformCode}</Badge>
            <Badge variant="secondary">{platform.platformType}</Badge>
            {platform.criticalityLevel && <CriticalityBadge level={platform.criticalityLevel} />}
            {platform.inIsmsScope && (
              <Badge variant="default">
                <Shield className="h-3 w-3 mr-1" />
                ISMS Scope
              </Badge>
            )}
            <StatusBadge
              status={platform.isActive ? "Active" : "Inactive"}
              variant={platform.isActive ? "success" : "secondary"}
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
              onHistory={() => {
                const historyTab = document.querySelector('[data-value="history"]');
                if (historyTab) {
                  (historyTab as HTMLElement).click();
                }
              }}
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
                <Server className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{platform.platformType.replace("_", " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{platform.vendor || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cloud className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deployment</p>
                <p className="font-medium capitalize">{platform.deploymentModel?.replace("_", " ") || "-"}</p>
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
                <p className="text-sm text-muted-foreground">End of Life</p>
                <p className="font-medium">
                  {platform.endOfLifeDate ? new Date(platform.endOfLifeDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs syncWithUrl defaultValue="overview" className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="technical">Technical</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cloud Provider</p>
                  <p>{platform.cloudProvider || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hosting Location</p>
                  <p>{platform.hostingLocation || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Type</p>
                  <p className="capitalize">{platform.licenseType?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p>{platform.version || "-"}</p>
                </div>
              </div>
              {platform.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{platform.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Technical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Business Impact</p>
                  <p className="capitalize">{platform.businessImpact?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Rating</p>
                  <p className="capitalize">{platform.riskRating?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Implementation Date</p>
                  <p>{platform.implementationDate ? new Date(platform.implementationDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In ISMS Scope</p>
                  <p>{platform.inIsmsScope ? "Yes" : "No"}</p>
                </div>
              </div>
              {platform.scopeJustification && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Scope Justification</p>
                  <p className="text-sm">{platform.scopeJustification}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={platform.createdAt}
            updatedAt={platform.updatedAt}
            entityType="Technology Platform"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Platform"
        description="Update platform details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name?.trim() !== "" && formData.platformCode?.trim() !== ""}
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
            name="platformCode"
            label="Platform Code"
            value={formData.platformCode || ""}
            onChange={(v) => updateField("platformCode", v)}
            required
          />
        </FormRow>
        <FormRow>
          <FormField
            type="select"
            name="platformType"
            label="Type"
            value={formData.platformType || ""}
            onChange={(v) => updateField("platformType", v)}
            options={[
              { value: "infrastructure", label: "Infrastructure" },
              { value: "application", label: "Application" },
              { value: "database", label: "Database" },
              { value: "security", label: "Security" },
              { value: "network", label: "Network" },
              { value: "cloud", label: "Cloud" },
            ]}
          />
          <FormField
            type="text"
            name="vendor"
            label="Vendor"
            value={formData.vendor || ""}
            onChange={(v) => updateField("vendor", v)}
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
            name="deploymentModel"
            label="Deployment Model"
            value={formData.deploymentModel || ""}
            onChange={(v) => updateField("deploymentModel", v)}
            options={[
              { value: "on_premise", label: "On-Premise" },
              { value: "cloud", label: "Cloud" },
              { value: "hybrid", label: "Hybrid" },
              { value: "saas", label: "SaaS" },
            ]}
          />
          <FormField
            type="select"
            name="criticalityLevel"
            label="Criticality"
            value={formData.criticalityLevel || ""}
            onChange={(v) => updateField("criticalityLevel", v)}
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
            type="switch"
            name="inIsmsScope"
            label="In ISMS Scope"
            value={formData.inIsmsScope ?? true}
            onChange={(v) => updateField("inIsmsScope", v)}
          />
          <FormField
            type="switch"
            name="isActive"
            label="Active"
            value={formData.isActive ?? true}
            onChange={(v) => updateField("isActive", v)}
          />
        </FormRow>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Platform"
        description={`Are you sure you want to delete "${platform.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
