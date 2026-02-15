import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Network, Plus, Users, Eye, Edit3, Trash2 } from "lucide-react";
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
  getOrganisationalUnits,
  createOrganisationalUnit,
  updateOrganisationalUnit,
  deleteOrganisationalUnit,
  type OrganisationalUnit,
} from "@/lib/organisation-api";

const unitTypeLabels: Record<string, string> = {
  division: "Division",
  department: "Department",
  team: "Team",
  unit: "Unit",
  branch: "Branch",
  section: "Section",
};

interface FormData {
  name: string;
  code: string;
  unitType: string;
  description: string;
  costCenter: string;
  isActive: boolean;
}

const emptyFormData: FormData = {
  name: "",
  code: "",
  unitType: "",
  description: "",
  costCenter: "",
  isActive: true,
};

export default function OrganisationalUnitsPage() {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<OrganisationalUnit[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<OrganisationalUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrganisationalUnits();
      setUnits(data.results);
    } catch (err) {
      console.error("Error loading organisational units:", err);
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

  const handleEdit = (unit: OrganisationalUnit) => {
    setFormMode("edit");
    setFormData({
      name: unit.name,
      code: unit.code,
      unitType: unit.unitType || "",
      description: unit.description || "",
      costCenter: unit.costCenter || "",
      isActive: unit.isActive,
    });
    setEditingId(unit.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createOrganisationalUnit(formData);
        toast.success("Organisational unit created successfully");
      } else if (editingId) {
        await updateOrganisationalUnit(editingId, formData);
        toast.success("Organisational unit updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving organisational unit:", err);
      toast.error("Failed to save organisational unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (unit: OrganisationalUnit) => {
    setDeletingUnit(unit);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUnit) return;
    try {
      setIsDeleting(true);
      await deleteOrganisationalUnit(deletingUnit.id);
      toast.success("Organisational unit deleted successfully");
      setDeleteOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error deleting organisational unit:", err);
      toast.error("Failed to delete organisational unit");
    } finally {
      setIsDeleting(false);
      setDeletingUnit(null);
    }
  };

  const filteredUnits = typeFilter === "all"
    ? units
    : units.filter((u) => u.unitType === typeFilter);

  const columns: Column<OrganisationalUnit>[] = [
    {
      key: "code",
      header: "Code",
      render: (unit) => (
        <span className="font-mono text-xs text-muted-foreground">{unit.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (unit) => (
        <Link
          to={`/organisation/organisational-units/${unit.id}`}
          className="font-medium hover:underline hover:text-primary"
        >
          {unit.name}
        </Link>
      ),
    },
    {
      key: "unitType",
      header: "Type",
      render: (unit) => (
        <span className="capitalize">
          {unitTypeLabels[unit.unitType] || unit.unitType}
        </span>
      ),
    },
    {
      key: "head",
      header: "Head",
      render: (unit) => (
        <span className="text-sm">
          {unit.head
            ? `${unit.head.firstName || ""} ${unit.head.lastName || ""}`.trim() || unit.head.email
            : "-"}
        </span>
      ),
    },
    {
      key: "parent",
      header: "Parent Unit",
      render: (unit) => (
        <span className="text-sm text-muted-foreground">
          {unit.parent?.name || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (unit) => (
        <StatusBadge
          status={unit.isActive ? "Active" : "Inactive"}
          variant={unit.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<OrganisationalUnit>[] = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      href: (unit) => `/organisation/organisational-units/${unit.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: handleEdit,
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteClick,
      variant: "destructive",
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

  const activeCount = units.filter((u) => u.isActive).length;
  const typeBreakdown = units.reduce((acc, u) => {
    acc[u.unitType] = (acc[u.unitType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Organisational Units"
        description="Manage organisational structure and hierarchy"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Units"
          value={units.length}
          icon={<Network className="h-4 w-4" />}
          subtitle="All organisational units"
        />
        <StatCard
          title="Active Units"
          value={activeCount}
          icon={<Users className="h-4 w-4" />}
          subtitle={`${Math.round((activeCount / units.length) * 100) || 0}% active`}
        />
        <StatCard
          title="Divisions"
          value={typeBreakdown["division"] || 0}
          icon={<Network className="h-4 w-4" />}
          subtitle="Top-level units"
        />
        <StatCard
          title="Teams"
          value={typeBreakdown["team"] || 0}
          icon={<Users className="h-4 w-4" />}
          subtitle="Working teams"
        />
      </StatCardGrid>

      <div className="flex items-center gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="division">Division</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="unit">Unit</SelectItem>
            <SelectItem value="branch">Branch</SelectItem>
            <SelectItem value="section">Section</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredUnits}
        keyExtractor={(unit) => unit.id}
        rowActions={rowActions}
        emptyMessage="No organisational units found"
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Create Organisational Unit" : "Edit Organisational Unit"}
        description={formMode === "create" ? "Add a new organisational unit" : "Update organisational unit details"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <FormRow>
          <FormField
            type="text"
            name="code"
            label="Unit Code"
            value={formData.code}
            onChange={(v) => setFormData({ ...formData, code: v })}
            placeholder="e.g., DIV-001"
            required
          />
          <FormField
            type="text"
            name="name"
            label="Name"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            placeholder="Unit name"
            required
          />
        </FormRow>
        <FormRow>
          <FormField
            type="select"
            name="unitType"
            label="Unit Type"
            value={formData.unitType}
            onChange={(v) => setFormData({ ...formData, unitType: v })}
            options={[
              { value: "division", label: "Division" },
              { value: "department", label: "Department" },
              { value: "team", label: "Team" },
              { value: "unit", label: "Unit" },
              { value: "branch", label: "Branch" },
              { value: "section", label: "Section" },
            ]}
            placeholder="Select type"
            required
          />
          <FormField
            type="text"
            name="costCenter"
            label="Cost Center"
            value={formData.costCenter}
            onChange={(v) => setFormData({ ...formData, costCenter: v })}
            placeholder="Cost center code"
          />
        </FormRow>
        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(v) => setFormData({ ...formData, description: v })}
          placeholder="Unit description"
          rows={3}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Organisational Unit"
        description={`Are you sure you want to delete "${deletingUnit?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
