import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Edit3,
  Trash2,
  Users,
  Building2,
  Globe,
  Clock,
  Shield,
  Server,
  Wifi,
  Mail,
  Phone,
  Calendar,
  Lock,
  Zap,
  CheckCircle,
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
  getLocation,
  updateLocation,
  deleteLocation,
  type Location,
} from "@/lib/organisation-api";

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({
    name: "",
    locationCode: "",
    locationType: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    region: "",
    contactEmail: "",
    contactPhone: "",
    timezone: "",
    employeeCount: undefined,
    maxCapacity: undefined,
    floorSpace: undefined,
    physicalSecurityLevel: "",
    accessControlType: "",
    isDataCenter: false,
    hasServerRoom: false,
    networkType: "",
    backupPower: false,
    inIsmsScope: true,
    scopeJustification: "",
    isActive: true,
  });

  useEffect(() => {
    if (locationId) {
      loadData();
    }
  }, [locationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getLocation(locationId!);
      setLocation(data);
      if (data) {
        setFormData({
          name: data.name,
          locationCode: data.locationCode || "",
          locationType: data.locationType || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          postalCode: data.postalCode || "",
          region: data.region || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          timezone: data.timezone || "",
          employeeCount: data.employeeCount,
          maxCapacity: data.maxCapacity,
          floorSpace: data.floorSpace,
          physicalSecurityLevel: data.physicalSecurityLevel || "",
          accessControlType: data.accessControlType || "",
          isDataCenter: data.isDataCenter ?? false,
          hasServerRoom: data.hasServerRoom ?? false,
          networkType: data.networkType || "",
          backupPower: data.backupPower ?? false,
          inIsmsScope: data.inIsmsScope ?? true,
          scopeJustification: data.scopeJustification || "",
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading location:", err);
      toast.error("Failed to load location");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateLocation(locationId!, formData);
      toast.success("Location updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating location:", err);
      toast.error("Failed to update location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteLocation(locationId!);
      toast.success("Location deleted successfully");
      navigate("/organisation/locations");
    } catch (err) {
      console.error("Error deleting location:", err);
      toast.error("Failed to delete location");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof Location>(field: K, value: Location[K]) => {
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

  if (!location) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Location not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/locations")}>
          Back to Locations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={location.name}
        description={`${location.city || ""} ${location.country || ""}`.trim() || "Location details"}
        backLink="/organisation/locations"
        backLabel="Back to Locations"
        badge={
          <StatusBadge
            status={location.isActive ? "Active" : "Inactive"}
            variant={location.isActive ? "success" : "secondary"}
          />
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
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{location.country || "-"}</p>
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
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{location.city || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">State/Region</p>
                <p className="font-medium">{location.state || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{location.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs defaultValue="overview" syncWithUrl className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="infrastructure">Infrastructure</ArcherTabsTrigger>
          <ArcherTabsTrigger value="security">Security & ISMS</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location Code</p>
                  <p className="font-mono">{location.locationCode || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location Type</p>
                  <p className="capitalize">{location.locationType?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p>{location.region || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p>{location.timezone || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Address</p>
                  <p>{location.address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Postal Code</p>
                  <p>{location.postalCode || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee Count</p>
                  <p className="text-lg font-semibold">{location.employeeCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Capacity</p>
                  <p className="text-lg font-semibold">{location.maxCapacity ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Floor Space</p>
                  <p className="text-lg font-semibold">
                    {location.floorSpace ? `${location.floorSpace} ${location.floorSpaceUnit || 'sqm'}` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {location.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location.contactEmail}</span>
                  </div>
                )}
                {location.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location.contactPhone}</span>
                  </div>
                )}
                {location.operationalSince && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Since {new Date(location.operationalSince).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="infrastructure" className="space-y-4">
          {/* IT Infrastructure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4" />
                IT Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${location.isDataCenter ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Data Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${location.hasServerRoom ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Server Room</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${location.backupPower ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Backup Power</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Network Type</p>
                  <p>{location.networkType || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Internet Provider</p>
                  <p>{location.internetProvider || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="security" className="space-y-4">
          {/* Physical Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Physical Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Security Level</p>
                  <p className="capitalize">{location.physicalSecurityLevel?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Access Control Type</p>
                  <p className="capitalize">{location.accessControlType?.replace("_", " ") || "-"}</p>
                </div>
              </div>
              {location.securityFeatures && location.securityFeatures.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Security Features</p>
                  <div className="flex flex-wrap gap-2">
                    {location.securityFeatures.map((f, i) => (
                      <Badge key={i} variant="outline">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ISMS Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                ISMS Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${location.inIsmsScope ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">{location.inIsmsScope ? 'In ISMS Scope' : 'Out of Scope'}</span>
                </div>
              </div>
              {location.scopeJustification && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Scope Justification</p>
                  <p className="text-sm">{location.scopeJustification}</p>
                </div>
              )}
              {location.complianceCertifications && location.complianceCertifications.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Compliance Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {location.complianceCertifications.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={location.createdAt}
            updatedAt={location.updatedAt}
            entityType="Location"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Location"
        description="Update location details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name?.trim() !== ""}
        size="lg"
      >
        <FormField
          type="text"
          name="name"
          label="Location Name"
          value={formData.name || ""}
          onChange={(v) => updateField("name", v)}
          required
        />
        <FormField
          type="text"
          name="address"
          label="Address"
          value={formData.address || ""}
          onChange={(v) => updateField("address", v)}
        />
        <FormRow>
          <FormField
            type="text"
            name="city"
            label="City"
            value={formData.city || ""}
            onChange={(v) => updateField("city", v)}
          />
          <FormField
            type="text"
            name="state"
            label="State/Region"
            value={formData.state || ""}
            onChange={(v) => updateField("state", v)}
          />
        </FormRow>
        <FormRow>
          <FormField
            type="text"
            name="country"
            label="Country"
            value={formData.country || ""}
            onChange={(v) => updateField("country", v)}
          />
          <FormField
            type="text"
            name="postalCode"
            label="Postal Code"
            value={formData.postalCode || ""}
            onChange={(v) => updateField("postalCode", v)}
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
        title="Delete Location"
        description={`Are you sure you want to delete "${location.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
