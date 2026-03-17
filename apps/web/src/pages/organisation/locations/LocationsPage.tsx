import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Eye, Edit3, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
  type CreateLocationDto,
} from "@/lib/organisation-api";

const emptyFormData: CreateLocationDto = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  locationType: "",
  isHeadquarters: false,
  isActive: true,
};

export default function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<CreateLocationDto>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data.results);
    } catch (err) {
      console.error("Error loading locations:", err);
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

  const handleEdit = (location: Location) => {
    setFormMode("edit");
    setFormData({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      country: location.country || "",
      postalCode: location.postalCode || "",
      isActive: location.isActive,
    });
    setEditingId(location.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createLocation(formData);
        toast.success("Location created successfully");
      } else if (editingId) {
        await updateLocation(editingId, formData);
        toast.success("Location updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving location:", err);
      toast.error("Failed to save location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (location: Location) => {
    setDeletingLocation(location);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLocation) return;
    try {
      setIsDeleting(true);
      await deleteLocation(deletingLocation.id);
      toast.success("Location deleted successfully");
      setDeleteOpen(false);
      setDeletingLocation(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting location:", err);
      toast.error("Failed to delete location");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof CreateLocationDto>(field: K, value: CreateLocationDto[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name.trim() !== "";

  const columns: Column<Location>[] = [
    {
      key: "name",
      header: "Location",
      render: (location) => (
        <Link
          to={`/organisation/locations/${location.id}`}
          className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
        >
          {location.name}
        </Link>
      ),
    },
    {
      key: "address",
      header: "Address",
      className: "text-sm text-muted-foreground",
      render: (location) => location.address || "-",
    },
    {
      key: "city",
      header: "City",
      render: (location) => location.city || "-",
    },
    {
      key: "country",
      header: "Country",
      render: (location) => location.country || "-",
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (location) => (
        <StatusBadge
          status={location.isActive ? "Active" : "Inactive"}
          variant={location.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<Location>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (location) => `/organisation/locations/${location.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (location) => handleEdit(location),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (location) => handleDeleteClick(location),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Locations"
        description="Manage organizational facilities and offices"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        }
      />

      <StatCardGrid columns={3}>
        <StatCard
          title="Total Locations"
          value={locations.length}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={locations.filter((l) => l.isActive).length}
          icon={<MapPin className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Countries"
          value={new Set(locations.map((l) => l.country).filter(Boolean)).size}
          icon={<Globe className="h-4 w-4" />}
          iconClassName="text-primary"
        />
      </StatCardGrid>

      <DataTable
        title="Location Directory"
        data={locations}
        columns={columns}
        keyExtractor={(location) => location.id}
        searchPlaceholder="Search locations..."
        searchFilter={(location, query) =>
          location.name.toLowerCase().includes(query.toLowerCase()) ||
          (location.city?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (location.country?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No locations found"
      />

      {/* Create/Edit Modal */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Add Location" : "Edit Location"}
        description={formMode === "create" ? "Add a new location to your organization" : "Update location details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Create" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="md"
      >
        <FormField
          type="text"
          name="name"
          label="Location Name"
          value={formData.name}
          onChange={(v) => updateField("name", v)}
          placeholder="e.g., Headquarters, Branch Office"
          required
        />

        <FormField
          type="text"
          name="address"
          label="Address"
          value={formData.address || ""}
          onChange={(v) => updateField("address", v)}
          placeholder="Street address"
        />

        <FormRow>
          <FormField
            type="text"
            name="city"
            label="City"
            value={formData.city || ""}
            onChange={(v) => updateField("city", v)}
            placeholder="City"
          />
          <FormField
            type="text"
            name="state"
            label="State/Province"
            value={formData.state || ""}
            onChange={(v) => updateField("state", v)}
            placeholder="State or Province"
          />
        </FormRow>

        <FormRow>
          <FormField
            type="text"
            name="country"
            label="Country"
            value={formData.country || ""}
            onChange={(v) => updateField("country", v)}
            placeholder="Country"
          />
          <FormField
            type="text"
            name="postalCode"
            label="Postal Code"
            value={formData.postalCode || ""}
            onChange={(v) => updateField("postalCode", v)}
            placeholder="Postal/ZIP code"
          />
        </FormRow>

        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive ?? true}
          onChange={(v) => updateField("isActive", v)}
          description="Location is currently active"
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Location"
        description={`Are you sure you want to delete "${deletingLocation?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
