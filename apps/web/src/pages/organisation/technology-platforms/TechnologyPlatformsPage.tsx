import { useEffect, useState } from "react";
import { Server, Plus, Edit3, Trash2, Shield, Cloud, AlertTriangle } from "lucide-react";
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
  CriticalityBadge,
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
  getTechnologyPlatforms,
  createTechnologyPlatform,
  updateTechnologyPlatform,
  deleteTechnologyPlatform,
  type TechnologyPlatform,
} from "@/lib/organisation-api";

const platformTypeLabels: Record<string, string> = {
  infrastructure: "Infrastructure",
  application: "Application",
  database: "Database",
  security: "Security",
  network: "Network",
  cloud: "Cloud",
  development: "Development",
  collaboration: "Collaboration",
};

const hostingLabels: Record<string, string> = {
  on_premise: "On-Premise",
  cloud: "Cloud",
  hybrid: "Hybrid",
};

interface PlatformFormData {
  platformCode: string;
  name: string;
  platformType: string;
  description: string;
  vendor: string;
  hostingLocation: string;
  cloudProvider: string;
  deploymentModel: string;
  version: string;
  criticalityLevel: string;
  inIsmsScope: boolean;
  isActive: boolean;
}

const emptyFormData: PlatformFormData = {
  platformCode: "",
  name: "",
  platformType: "application",
  description: "",
  vendor: "",
  hostingLocation: "cloud",
  cloudProvider: "",
  deploymentModel: "saas",
  version: "",
  criticalityLevel: "medium",
  inIsmsScope: true,
  isActive: true,
};

export default function TechnologyPlatformsPage() {
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState<TechnologyPlatform[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");

  // CRUD state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<PlatformFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPlatform, setDeletingPlatform] = useState<TechnologyPlatform | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTechnologyPlatforms();
      setPlatforms(data.results);
    } catch (err) {
      console.error("Error loading platforms:", err);
      toast.error("Failed to load technology platforms");
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

  const handleEdit = (platform: TechnologyPlatform) => {
    setFormMode("edit");
    setFormData({
      platformCode: platform.platformCode,
      name: platform.name,
      platformType: platform.platformType,
      description: platform.description || "",
      vendor: platform.vendor || "",
      hostingLocation: platform.hostingLocation || "cloud",
      cloudProvider: platform.cloudProvider || "",
      deploymentModel: platform.deploymentModel || "saas",
      version: platform.version || "",
      criticalityLevel: platform.criticalityLevel || "medium",
      inIsmsScope: platform.inIsmsScope,
      isActive: platform.isActive,
    });
    setEditingId(platform.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createTechnologyPlatform(formData);
        toast.success("Platform created successfully");
      } else if (editingId) {
        await updateTechnologyPlatform(editingId, formData);
        toast.success("Platform updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving platform:", err);
      toast.error("Failed to save platform");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (platform: TechnologyPlatform) => {
    setDeletingPlatform(platform);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlatform) return;
    try {
      setIsDeleting(true);
      await deleteTechnologyPlatform(deletingPlatform.id);
      toast.success("Platform deleted successfully");
      setDeleteOpen(false);
      setDeletingPlatform(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting platform:", err);
      toast.error("Failed to delete platform");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof PlatformFormData>(field: K, value: PlatformFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name.trim() !== "" && formData.platformCode.trim() !== "";

  const filteredPlatforms = platforms.filter((p) => {
    if (typeFilter !== "all" && p.platformType !== typeFilter) return false;
    return true;
  });

  const columns: Column<TechnologyPlatform>[] = [
    {
      key: "name",
      header: "Platform",
      render: (platform) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{platform.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{platform.platformCode}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (platform) => (
        <Badge variant="outline" className="text-xs">
          {platformTypeLabels[platform.platformType] || platform.platformType}
        </Badge>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (platform) => platform.vendor || "-",
    },
    {
      key: "hosting",
      header: "Hosting",
      render: (platform) => (
        <div className="flex items-center gap-1">
          <Cloud className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{hostingLabels[platform.hostingLocation || ""] || platform.hostingLocation || "-"}</span>
        </div>
      ),
    },
    {
      key: "criticality",
      header: "Criticality",
      render: (platform) => platform.criticalityLevel ? (
        <CriticalityBadge level={platform.criticalityLevel} />
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "inScope",
      header: "In Scope",
      render: (platform) => (
        <div className="flex items-center gap-1">
          {platform.inIsmsScope ? (
            <Shield className="h-4 w-4 text-success" />
          ) : (
            <Shield className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (platform) => (
        <StatusBadge
          status={platform.isActive ? "Active" : "Inactive"}
          variant={platform.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<TechnologyPlatform>[] = [
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (platform) => handleEdit(platform),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (platform) => handleDeleteClick(platform),
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

  const activeCount = platforms.filter((p) => p.isActive).length;
  const criticalCount = platforms.filter((p) => p.criticalityLevel === "critical").length;
  const inScopeCount = platforms.filter((p) => p.inIsmsScope).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Technology Platforms"
        description="Manage technology landscape and platforms"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Platform
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Platforms"
          value={platforms.length}
          icon={<Server className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Server className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Critical"
          value={criticalCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
        <StatCard
          title="In ISMS Scope"
          value={inScopeCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-warning"
        />
      </StatCardGrid>

      <DataTable
        title="Technology Platform Register"
        data={filteredPlatforms}
        columns={columns}
        keyExtractor={(platform) => platform.id}
        searchPlaceholder="Search platforms..."
        searchFilter={(platform, query) =>
          platform.name.toLowerCase().includes(query.toLowerCase()) ||
          platform.platformCode.toLowerCase().includes(query.toLowerCase()) ||
          (platform.vendor?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No technology platforms found"
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Add Platform" : "Edit Platform"}
        description={formMode === "create" ? "Add a new technology platform" : "Update platform details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Create" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="platformCode"
            label="Platform Code"
            value={formData.platformCode}
            onChange={(v) => updateField("platformCode", v)}
            placeholder="e.g., PLAT-001"
            required
          />
          <FormField
            type="text"
            name="name"
            label="Name"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            placeholder="Platform name"
            required
          />
        </FormRow>

        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(v) => updateField("description", v)}
          placeholder="Describe the platform..."
          rows={2}
        />

        <FormRow>
          <FormField
            type="select"
            name="platformType"
            label="Type"
            value={formData.platformType}
            onChange={(v) => updateField("platformType", v)}
            options={[
              { value: "infrastructure", label: "Infrastructure" },
              { value: "application", label: "Application" },
              { value: "database", label: "Database" },
              { value: "security", label: "Security" },
              { value: "network", label: "Network" },
              { value: "cloud", label: "Cloud" },
              { value: "development", label: "Development" },
              { value: "collaboration", label: "Collaboration" },
            ]}
          />
          <FormField
            type="text"
            name="vendor"
            label="Vendor"
            value={formData.vendor}
            onChange={(v) => updateField("vendor", v)}
            placeholder="e.g., Microsoft, AWS"
          />
        </FormRow>

        <FormRow>
          <FormField
            type="select"
            name="hostingLocation"
            label="Hosting"
            value={formData.hostingLocation}
            onChange={(v) => updateField("hostingLocation", v)}
            options={[
              { value: "on_premise", label: "On-Premise" },
              { value: "cloud", label: "Cloud" },
              { value: "hybrid", label: "Hybrid" },
            ]}
          />
          <FormField
            type="select"
            name="criticalityLevel"
            label="Criticality"
            value={formData.criticalityLevel}
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
            type="text"
            name="version"
            label="Version"
            value={formData.version}
            onChange={(v) => updateField("version", v)}
            placeholder="e.g., 2.5.1"
          />
          <FormField
            type="switch"
            name="inIsmsScope"
            label="In ISMS Scope"
            value={formData.inIsmsScope}
            onChange={(v) => updateField("inIsmsScope", v)}
          />
        </FormRow>

        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive}
          onChange={(v) => updateField("isActive", v)}
          description="Platform is currently active"
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Platform"
        description={`Are you sure you want to delete "${deletingPlatform?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
