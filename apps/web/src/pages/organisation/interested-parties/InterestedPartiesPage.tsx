import { useEffect, useState } from "react";
import { Users, Plus, Edit3, Trash2, Zap, Target, Eye } from "lucide-react";
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
  getInterestedParties,
  createInterestedParty,
  updateInterestedParty,
  deleteInterestedParty,
  type InterestedParty,
} from "@/lib/organisation-api";

const partyTypeLabels: Record<string, string> = {
  customer: "Customer",
  employee: "Employee",
  shareholder: "Shareholder",
  supplier: "Supplier",
  regulator: "Regulator",
  partner: "Partner",
  board: "Board",
  community: "Community",
  media: "Media",
  competitor: "Competitor",
};

const powerLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const engagementLabels: Record<string, string> = {
  monitor: "Monitor",
  keep_informed: "Keep Informed",
  keep_satisfied: "Keep Satisfied",
  manage_closely: "Manage Closely",
};

interface PartyFormData {
  partyCode: string;
  name: string;
  partyType: string;
  description: string;
  expectations: string;
  requirements: string;
  powerLevel: string;
  interestLevel: string;
  engagementStrategy: string;
  communicationFrequency: string;
  primaryContact: string;
  contactEmail: string;
  ismsRelevance: string;
  isActive: boolean;
}

const emptyFormData: PartyFormData = {
  partyCode: "",
  name: "",
  partyType: "customer",
  description: "",
  expectations: "",
  requirements: "",
  powerLevel: "medium",
  interestLevel: "medium",
  engagementStrategy: "keep_informed",
  communicationFrequency: "quarterly",
  primaryContact: "",
  contactEmail: "",
  ismsRelevance: "",
  isActive: true,
};

export default function InterestedPartiesPage() {
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<InterestedParty[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");

  // CRUD state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<PartyFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingParty, setDeletingParty] = useState<InterestedParty | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getInterestedParties();
      setParties(data.results);
    } catch (err) {
      console.error("Error loading parties:", err);
      toast.error("Failed to load interested parties");
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

  const handleEdit = (party: InterestedParty) => {
    setFormMode("edit");
    setFormData({
      partyCode: party.partyCode,
      name: party.name,
      partyType: party.partyType,
      description: party.description || "",
      expectations: party.expectations || "",
      requirements: party.requirements || "",
      powerLevel: party.powerLevel || "medium",
      interestLevel: party.interestLevel || "medium",
      engagementStrategy: party.engagementStrategy || "keep_informed",
      communicationFrequency: party.communicationFrequency || "quarterly",
      primaryContact: party.primaryContact || "",
      contactEmail: party.contactEmail || "",
      ismsRelevance: party.ismsRelevance || "",
      isActive: party.isActive,
    });
    setEditingId(party.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createInterestedParty(formData);
        toast.success("Interested party created successfully");
      } else if (editingId) {
        await updateInterestedParty(editingId, formData);
        toast.success("Interested party updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving party:", err);
      toast.error("Failed to save interested party");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (party: InterestedParty) => {
    setDeletingParty(party);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingParty) return;
    try {
      setIsDeleting(true);
      await deleteInterestedParty(deletingParty.id);
      toast.success("Interested party deleted successfully");
      setDeleteOpen(false);
      setDeletingParty(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting party:", err);
      toast.error("Failed to delete interested party");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof PartyFormData>(field: K, value: PartyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name.trim() !== "" && formData.partyCode.trim() !== "";

  const filteredParties = parties.filter((p) => {
    if (typeFilter !== "all" && p.partyType !== typeFilter) return false;
    return true;
  });

  const columns: Column<InterestedParty>[] = [
    {
      key: "name",
      header: "Interested Party",
      render: (party) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{party.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{party.partyCode}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (party) => (
        <Badge variant="outline" className="text-xs">
          {partyTypeLabels[party.partyType] || party.partyType}
        </Badge>
      ),
    },
    {
      key: "power",
      header: "Power",
      render: (party) => (
        <StatusBadge
          status={powerLabels[party.powerLevel || ""] || party.powerLevel || "-"}
          variant={party.powerLevel === "high" ? "destructive" : party.powerLevel === "medium" ? "warning" : "secondary"}
        />
      ),
    },
    {
      key: "interest",
      header: "Interest",
      render: (party) => (
        <StatusBadge
          status={powerLabels[party.interestLevel || ""] || party.interestLevel || "-"}
          variant={party.interestLevel === "high" ? "success" : party.interestLevel === "medium" ? "warning" : "secondary"}
        />
      ),
    },
    {
      key: "engagement",
      header: "Engagement",
      render: (party) => (
        <span className="text-sm">
          {engagementLabels[party.engagementStrategy || ""] || party.engagementStrategy || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (party) => (
        <StatusBadge
          status={party.isActive ? "Active" : "Inactive"}
          variant={party.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions = (party: InterestedParty): RowAction<InterestedParty>[] => [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      href: (p) => `/organisation/interested-parties/${party.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (p) => handleEdit(party),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (p) => handleDeleteClick(party),
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

  const activeCount = parties.filter((p) => p.isActive).length;
  const highPowerCount = parties.filter((p) => p.powerLevel === "high").length;
  const highInterestCount = parties.filter((p) => p.interestLevel === "high").length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Interested Parties"
        description="ISO 27001 Clause 4.2 - Understanding the needs and expectations of interested parties"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Interested Party
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Parties"
          value={parties.length}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="High Power"
          value={highPowerCount}
          icon={<Zap className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
        <StatCard
          title="High Interest"
          value={highInterestCount}
          icon={<Target className="h-4 w-4" />}
          iconClassName="text-primary"
        />
      </StatCardGrid>

      <DataTable
        title="Interested Parties Register (Clause 4.2)"
        data={filteredParties}
        columns={columns}
        keyExtractor={(party) => party.id}
        searchPlaceholder="Search parties..."
        searchFilter={(party, query) =>
          party.name.toLowerCase().includes(query.toLowerCase()) ||
          party.partyCode.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No interested parties found"
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="regulator">Regulator</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="board">Board</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Add Interested Party" : "Edit Interested Party"}
        description={formMode === "create" ? "Add a new interested party (stakeholder)" : "Update interested party details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Create" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="partyCode"
            label="Party Code"
            value={formData.partyCode}
            onChange={(v) => updateField("partyCode", v)}
            placeholder="e.g., IP-001"
            required
          />
          <FormField
            type="text"
            name="name"
            label="Name"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            placeholder="Interested party name"
            required
          />
        </FormRow>

        <FormRow>
          <FormField
            type="select"
            name="partyType"
            label="Type"
            value={formData.partyType}
            onChange={(v) => updateField("partyType", v)}
            options={[
              { value: "customer", label: "Customer" },
              { value: "employee", label: "Employee" },
              { value: "shareholder", label: "Shareholder" },
              { value: "supplier", label: "Supplier" },
              { value: "regulator", label: "Regulator" },
              { value: "partner", label: "Partner" },
              { value: "board", label: "Board" },
              { value: "community", label: "Community" },
            ]}
          />
          <FormField
            type="select"
            name="engagementStrategy"
            label="Engagement Strategy"
            value={formData.engagementStrategy}
            onChange={(v) => updateField("engagementStrategy", v)}
            options={[
              { value: "monitor", label: "Monitor" },
              { value: "keep_informed", label: "Keep Informed" },
              { value: "keep_satisfied", label: "Keep Satisfied" },
              { value: "manage_closely", label: "Manage Closely" },
            ]}
          />
        </FormRow>

        <FormField
          type="textarea"
          name="expectations"
          label="Expectations"
          value={formData.expectations}
          onChange={(v) => updateField("expectations", v)}
          placeholder="What do they expect from the organization?"
          rows={2}
        />

        <FormField
          type="textarea"
          name="requirements"
          label="Requirements"
          value={formData.requirements}
          onChange={(v) => updateField("requirements", v)}
          placeholder="Specific requirements they have"
          rows={2}
        />

        <FormRow>
          <FormField
            type="select"
            name="powerLevel"
            label="Power Level"
            value={formData.powerLevel}
            onChange={(v) => updateField("powerLevel", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
          <FormField
            type="select"
            name="interestLevel"
            label="Interest Level"
            value={formData.interestLevel}
            onChange={(v) => updateField("interestLevel", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
        </FormRow>

        <FormField
          type="textarea"
          name="ismsRelevance"
          label="ISMS Relevance"
          value={formData.ismsRelevance}
          onChange={(v) => updateField("ismsRelevance", v)}
          placeholder="How does this party relate to the ISMS?"
          rows={2}
        />

        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive}
          onChange={(v) => updateField("isActive", v)}
          description="Interested party is currently active"
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Interested Party"
        description={`Are you sure you want to delete "${deletingParty?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
