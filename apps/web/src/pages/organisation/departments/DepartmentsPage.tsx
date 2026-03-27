import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Users, AlertTriangle, Eye, Edit3, Trash2 } from "lucide-react";
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
  CriticalityBadge,
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
  getDepartments,
  getDepartmentSummary,
  createDepartment,
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
};

const emptyFormData: CreateDepartmentDto = {
  name: "",
  departmentCode: "",
  description: "",
  departmentCategory: "",
  functionType: "",
  criticalityLevel: "",
  headcount: undefined,
  location: "",
  contactEmail: "",
  contactPhone: "",
  isActive: true,
};

export default function DepartmentsPage() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [summary, setSummary] = useState<{ total: number; active: number; totalHeadcount: number; totalBudget: string } | null>(null);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<CreateDepartmentDto>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsData, summaryData] = await Promise.all([
        getDepartments(),
        getDepartmentSummary(),
      ]);
      setDepartments(deptsData.results);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error loading departments:", err);
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

  const handleEdit = (dept: Department) => {
    setFormMode("edit");
    setFormData({
      name: dept.name,
      departmentCode: dept.departmentCode,
      description: dept.description || "",
      departmentCategory: dept.departmentCategory || "",
      functionType: dept.functionType || "",
      criticalityLevel: dept.criticalityLevel || "",
      headcount: dept.headcount,
      location: dept.location || "",
      contactEmail: dept.contactEmail || "",
      contactPhone: dept.contactPhone || "",
      isActive: dept.isActive,
    });
    setEditingId(dept.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createDepartment(formData);
        toast.success("Department created successfully");
      } else if (editingId) {
        await updateDepartment(editingId, formData);
        toast.success("Department updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving department:", err);
      toast.error("Failed to save department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (dept: Department) => {
    setDeletingDept(dept);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    try {
      setIsDeleting(true);
      await deleteDepartment(deletingDept.id);
      toast.success("Department deleted successfully");
      setDeleteOpen(false);
      setDeletingDept(null);
      await loadData();
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

  const isFormValid = formData.name.trim() !== "" && formData.departmentCode.trim() !== "";

  const filteredDepartments = criticalityFilter === "all"
    ? departments
    : departments.filter((d) => d.criticalityLevel === criticalityFilter);

  const columns: Column<Department>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      className: "font-mono text-xs text-muted-foreground",
      render: (dept) => dept.departmentCode,
    },
    {
      key: "name",
      header: "Department",
      render: (dept) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/departments/${dept.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {dept.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {dept.departmentCategory ? categoryLabels[dept.departmentCategory] || dept.departmentCategory : ""}
          </span>
        </div>
      ),
    },
    {
      key: "criticality",
      header: "Criticality",
      className: "text-center",
      render: (dept) => dept.criticalityLevel ? <CriticalityBadge level={dept.criticalityLevel} /> : "-",
    },
    {
      key: "head",
      header: "Head",
      render: (dept) =>
        dept.departmentHead ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {dept.departmentHead.firstName?.[0]}{dept.departmentHead.lastName?.[0]}
            </div>
            <span className="text-sm">{dept.departmentHead.firstName} {dept.departmentHead.lastName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "headcount",
      header: "Headcount",
      headerClassName: "text-right",
      className: "text-right",
      render: (dept) => dept.headcount ?? "-",
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (dept) => (
        <StatusBadge
          status={dept.isActive ? "Active" : "Inactive"}
          variant={dept.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions = (dept: Department): RowAction<Department>[] => [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (d) => `/organisation/departments/${dept.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (d) => handleEdit(dept),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (dept) => handleDeleteClick(dept),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        title="Departments"
        description="Manage organizational departments and structure"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        }
      />

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Departments"
          value={summary?.total ?? 0}
          subtitle={`${summary?.active ?? 0} active`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Total Headcount"
          value={summary?.totalHeadcount ?? 0}
          subtitle="employees"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Budget"
          value={`$${Number(summary?.totalBudget ?? 0).toLocaleString()}`}
          subtitle="annual"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Critical"
          value={departments.filter((d) => d.criticalityLevel === "critical").length}
          subtitle="critical departments"
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
      </StatCardGrid>

      {/* Data Table */}
      <DataTable
        title="Department Library"
        data={filteredDepartments}
        columns={columns}
        keyExtractor={(dept) => dept.id}
        searchPlaceholder="Search departments..."
        searchFilter={(dept, query) =>
          dept.name.toLowerCase().includes(query.toLowerCase()) ||
          dept.departmentCode.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No departments found"
        filterSlot={
          <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-transparent">
              <SelectValue placeholder="Criticality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Criticality</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create/Edit Modal */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Add Department" : "Edit Department"}
        description={formMode === "create" ? "Create a new department in your organization" : "Update department details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Create" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="name"
            label="Department Name"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            placeholder="e.g., Information Technology"
            required
          />
          <FormField
            type="text"
            name="departmentCode"
            label="Department Code"
            value={formData.departmentCode}
            onChange={(v) => updateField("departmentCode", v)}
            placeholder="e.g., IT-001"
            required
          />
        </FormRow>

        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description || ""}
          onChange={(v) => updateField("description", v)}
          placeholder="Brief description of the department's purpose and responsibilities"
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
            placeholder="Select category"
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
            placeholder="Select criticality"
          />
        </FormRow>

        <FormRow>
          <FormField
            type="number"
            name="headcount"
            label="Headcount"
            value={formData.headcount ?? ""}
            onChange={(v) => updateField("headcount", v ? parseInt(v) : undefined)}
            placeholder="Number of employees"
          />
          <FormField
            type="text"
            name="location"
            label="Location"
            value={formData.location || ""}
            onChange={(v) => updateField("location", v)}
            placeholder="e.g., Building A, Floor 3"
          />
        </FormRow>

        <FormRow>
          <FormField
            type="email"
            name="contactEmail"
            label="Contact Email"
            value={formData.contactEmail || ""}
            onChange={(v) => updateField("contactEmail", v)}
            placeholder="department@company.com"
          />
          <FormField
            type="tel"
            name="contactPhone"
            label="Contact Phone"
            value={formData.contactPhone || ""}
            onChange={(v) => updateField("contactPhone", v)}
            placeholder="+1 (555) 123-4567"
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
        description={`Are you sure you want to delete "${deletingDept?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
