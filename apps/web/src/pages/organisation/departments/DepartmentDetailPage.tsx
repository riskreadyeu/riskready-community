import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Edit3,
  Trash2,
  Users,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Network,
  Shield,
  Clock,
  AlertTriangle,
  FileText,
  Briefcase,
  UserCheck,
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
  getDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
  type CreateDepartmentDto,
} from "@/lib/organisation-api";

const categoryLabels: Record<string, string> = {
  revenue_generating: "Revenue Generating",
  cost_center: "Cost Center",
  support_function: "Support Function",
  compliance_regulatory: "Compliance/Regulatory",
  management: "Management",
};

export default function DepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    name: "",
    departmentCode: "",
    description: "",
    departmentCategory: "",
    criticalityLevel: "",
    headcount: undefined,
    contractorCount: undefined,
    budget: undefined,
    costCenter: "",
    location: "",
    floorPlanReference: "",
    contactEmail: "",
    contactPhone: "",
    handlesPersonalData: false,
    handlesFinancialData: false,
    isActive: true,
  });

  useEffect(() => {
    if (departmentId) {
      loadData();
    }
  }, [departmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDepartment(departmentId!);
      setDepartment(data);
      if (data) {
        setFormData({
          name: data.name,
          departmentCode: data.departmentCode,
          description: data.description || "",
          departmentCategory: data.departmentCategory || "",
          criticalityLevel: data.criticalityLevel || "",
          headcount: data.headcount,
          contractorCount: data.contractorCount,
          budget: data.budget ? parseFloat(data.budget) : undefined,
          costCenter: data.costCenter || "",
          location: data.location || "",
          floorPlanReference: data.floorPlanReference || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          handlesPersonalData: data.handlesPersonalData ?? false,
          handlesFinancialData: data.handlesFinancialData ?? false,
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading department:", err);
      toast.error("Failed to load department");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateDepartment(departmentId!, formData);
      toast.success("Department updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating department:", err);
      toast.error("Failed to update department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteDepartment(departmentId!);
      toast.success("Department deleted successfully");
      navigate("/organisation/departments");
    } catch (err) {
      console.error("Error deleting department:", err);
      toast.error("Failed to delete department");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof CreateDepartmentDto>(field: K, value: CreateDepartmentDto[K]) => {
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

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Department not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/departments")}>
          Back to Departments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={department.name}
        description={department.description || "Department details"}
        backLink="/organisation/departments"
        backLabel="Back to Departments"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {department.departmentCode}
            </Badge>
            {department.criticalityLevel && <CriticalityBadge level={department.criticalityLevel} />}
            <StatusBadge
              status={department.isActive ? "Active" : "Inactive"}
              variant={department.isActive ? "success" : "secondary"}
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
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'history');
                window.history.pushState({}, '', url);
                window.dispatchEvent(new Event('popstate'));
              }}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Headcount</p>
                <p className="text-2xl font-semibold">{department.headcount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-semibold">
                  ${Number(department.budget || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processes</p>
                <p className="text-2xl font-semibold">{department._count?.businessProcesses ?? 0}</p>
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
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium text-sm">
                  {categoryLabels[department.departmentCategory || ""] || department.departmentCategory || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs defaultValue="overview" syncWithUrl className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="team">Team</ArcherTabsTrigger>
          <ArcherTabsTrigger value="processes">Processes</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department Code</p>
                  <p className="font-mono">{department.departmentCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Function Type</p>
                  <p className="capitalize">{department.functionType?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department Head</p>
                  <p>
                    {department.departmentHead
                      ? `${department.departmentHead.firstName || ''} ${department.departmentHead.lastName || department.departmentHead.email}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deputy Head</p>
                  <p>
                    {department.deputyHead
                      ? `${department.deputyHead.firstName || ''} ${department.deputyHead.lastName || department.deputyHead.email}`
                      : "-"}
                  </p>
                </div>
              </div>

              {department.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{department.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resources & Financial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resources & Financial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Headcount</p>
                  <p className="text-lg font-semibold">{department.headcount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contractors</p>
                  <p className="text-lg font-semibold">{department.contractorCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-lg font-semibold">
                    {department.budget ? `${department.budgetCurrency || 'USD'} ${Number(department.budget).toLocaleString()}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Center</p>
                  <p className="font-mono">{department.costCenter || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Key Responsibilities</p>
                {department.keyResponsibilities && department.keyResponsibilities.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {department.keyResponsibilities.map((r, i) => (
                      <li key={i} className="text-sm">{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No responsibilities defined</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Regulatory Obligations</p>
                {department.regulatoryObligations && department.regulatoryObligations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {department.regulatoryObligations.map((r, i) => (
                      <Badge key={i} variant="outline">{r}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No regulatory obligations defined</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">External Interfaces</p>
                {department.externalInterfaces && department.externalInterfaces.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {department.externalInterfaces.map((r, i) => (
                      <Badge key={i} variant="secondary">{r}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No external interfaces defined</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ISMS Data Handling */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                ISMS Data Handling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${department.handlesPersonalData ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Handles Personal Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${department.handlesFinancialData ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Handles Financial Data</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{department.location || '-'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Floor Plan Reference</p>
                  <p>{department.floorPlanReference || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Hours</p>
                  <p>{department.businessHours ? JSON.stringify(department.businessHours) : '-'}</p>
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
                {department.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{department.contactEmail}</span>
                  </div>
                )}
                {department.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{department.contactPhone}</span>
                  </div>
                )}
                {department.establishedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Est. {new Date(department.establishedDate).toLocaleDateString()}</span>
                  </div>
                )}
                {department.closureDate && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Closed: {new Date(department.closureDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {department.emergencyContact && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Emergency Contact</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span>{department.emergencyContact.name || '-'}</span>
                    <span>{department.emergencyContact.phone || '-'}</span>
                    <span>{department.emergencyContact.email || '-'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Team member management coming soon.
              </p>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4" />
                Business Processes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {department._count?.businessProcesses ?? 0} processes linked to this department.
              </p>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history" className="space-y-4">
          <HistoryTab
            createdAt={department.createdAt}
            updatedAt={department.updatedAt}
            entityType="Department"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      {/* Edit Dialog */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Department"
        description="Update department details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name.trim() !== "" && formData.departmentCode.trim() !== ""}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="name"
            label="Department Name"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            required
          />
          <FormField
            type="text"
            name="departmentCode"
            label="Department Code"
            value={formData.departmentCode}
            onChange={(v) => updateField("departmentCode", v)}
            required
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
            name="departmentCategory"
            label="Category"
            value={formData.departmentCategory || ""}
            onChange={(v) => updateField("departmentCategory", v)}
            options={[
              { value: "revenue_generating", label: "Revenue Generating" },
              { value: "cost_center", label: "Cost Center" },
              { value: "support_function", label: "Support Function" },
              { value: "compliance_regulatory", label: "Compliance/Regulatory" },
            ]}
          />
          <FormField
            type="select"
            name="criticalityLevel"
            label="Criticality Level"
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
            type="number"
            name="headcount"
            label="Headcount"
            value={formData.headcount ?? ""}
            onChange={(v) => updateField("headcount", v ? parseInt(v) : undefined)}
          />
          <FormField
            type="number"
            name="contractorCount"
            label="Contractors"
            value={formData.contractorCount ?? ""}
            onChange={(v) => updateField("contractorCount", v ? parseInt(v) : undefined)}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="number"
            name="budget"
            label="Budget"
            value={formData.budget ?? ""}
            onChange={(v) => updateField("budget", v ? parseFloat(v) : undefined)}
          />
          <FormField
            type="text"
            name="costCenter"
            label="Cost Center"
            value={formData.costCenter || ""}
            onChange={(v) => updateField("costCenter", v)}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="text"
            name="location"
            label="Location"
            value={formData.location || ""}
            onChange={(v) => updateField("location", v)}
          />
          <FormField
            type="text"
            name="floorPlanReference"
            label="Floor Plan Reference"
            value={formData.floorPlanReference || ""}
            onChange={(v) => updateField("floorPlanReference", v)}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="email"
            name="contactEmail"
            label="Contact Email"
            value={formData.contactEmail || ""}
            onChange={(v) => updateField("contactEmail", v)}
          />
          <FormField
            type="tel"
            name="contactPhone"
            label="Contact Phone"
            value={formData.contactPhone || ""}
            onChange={(v) => updateField("contactPhone", v)}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="switch"
            name="handlesPersonalData"
            label="Handles Personal Data"
            value={formData.handlesPersonalData ?? false}
            onChange={(v) => updateField("handlesPersonalData", v)}
            description="Department processes personal/PII data"
          />
          <FormField
            type="switch"
            name="handlesFinancialData"
            label="Handles Financial Data"
            value={formData.handlesFinancialData ?? false}
            onChange={(v) => updateField("handlesFinancialData", v)}
            description="Department processes financial data"
          />
        </FormRow>

        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive ?? true}
          onChange={(v) => updateField("isActive", v)}
          description="Department is currently active"
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Department"
        description={`Are you sure you want to delete "${department.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
