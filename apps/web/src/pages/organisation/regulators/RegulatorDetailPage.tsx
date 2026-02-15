import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Scale,
  Edit3,
  Trash2,
  Globe,
  Calendar,
  FileText,
  Building2,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader,
  StatusBadge,
  ConfirmDialog,
  FormDialog,
  FormField,
  FormRow,
} from "@/components/common";
import {
  getRegulator,
  updateRegulator,
  deleteRegulator,
  type Regulator,
} from "@/lib/organisation-api";

export default function RegulatorDetailPage() {
  const { regulatorId } = useParams<{ regulatorId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [regulator, setRegulator] = useState<Regulator | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Regulator>>({
    name: "",
    acronym: "",
    regulatorType: "",
    jurisdiction: "",
    description: "",
    website: "",
    isActive: true,
  });

  useEffect(() => {
    if (regulatorId) {
      loadData();
    }
  }, [regulatorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getRegulator(regulatorId!);
      setRegulator(data);
      if (data) {
        setFormData({
          name: data.name,
          acronym: data.acronym || "",
          regulatorType: data.regulatorType,
          jurisdiction: data.jurisdiction,
          description: data.description || "",
          website: data.website || "",
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading regulator:", err);
      toast.error("Failed to load regulator");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateRegulator(regulatorId!, formData);
      toast.success("Regulator updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating regulator:", err);
      toast.error("Failed to update regulator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteRegulator(regulatorId!);
      toast.success("Regulator deleted successfully");
      navigate("/organisation/regulators");
    } catch (err) {
      console.error("Error deleting regulator:", err);
      toast.error("Failed to delete regulator");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof Regulator>(field: K, value: Regulator[K]) => {
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

  if (!regulator) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Regulator not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/regulators")}>
          Back to Regulators
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={regulator.name}
        description={regulator.description || "Regulator details"}
        backLink="/organisation/regulators"
        backLabel="Back to Regulators"
        badge={
          <div className="flex gap-2">
            {regulator.acronym && <Badge variant="outline">{regulator.acronym}</Badge>}
            <Badge variant="secondary">{regulator.regulatorType}</Badge>
            <StatusBadge
              status={regulator.isActive ? "Active" : "Inactive"}
              variant={regulator.isActive ? "success" : "secondary"}
            />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{regulator.regulatorType.replace("_", " ")}</p>
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
                <p className="text-sm text-muted-foreground">Jurisdiction</p>
                <p className="font-medium">{regulator.jurisdiction}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="font-medium capitalize">{regulator.registrationStatus.replace("_", " ")}</p>
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
                <p className="text-sm text-muted-foreground">Next Inspection</p>
                <p className="font-medium">
                  {regulator.nextInspectionDate ? new Date(regulator.nextInspectionDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="compliance">Compliance History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regulator Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction Level</p>
                  <p className="capitalize">{regulator.jurisdictionLevel.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  {regulator.website ? (
                    <a href={regulator.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      Visit Website
                    </a>
                  ) : <p>-</p>}
                </div>
              </div>
              {regulator.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{regulator.description}</p>
                </div>
              )}
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
                {regulator.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{regulator.contactEmail}</span>
                  </div>
                )}
                {regulator.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{regulator.contactPhone}</span>
                  </div>
                )}
                {regulator.contactAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{regulator.contactAddress}</span>
                  </div>
                )}
                {!regulator.contactEmail && !regulator.contactPhone && !regulator.contactAddress && (
                  <p className="text-sm text-muted-foreground">No contact information available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regulatory Framework */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Regulatory Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {regulator.keyRegulations && regulator.keyRegulations.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Key Regulations</p>
                  <div className="flex flex-wrap gap-2">
                    {regulator.keyRegulations.map((r, i) => <Badge key={i} variant="outline">{r}</Badge>)}
                  </div>
                </div>
              )}
              {regulator.applicableStandards && regulator.applicableStandards.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Applicable Standards</p>
                  <div className="flex flex-wrap gap-2">
                    {regulator.applicableStandards.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
              {!regulator.keyRegulations?.length && !regulator.applicableStandards?.length && (
                <p className="text-sm text-muted-foreground">No regulatory framework information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Registration Status</p>
                  <p className="capitalize">{regulator.registrationStatus.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-mono">{regulator.registrationNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Date</p>
                  <p>{regulator.registrationDate ? new Date(regulator.registrationDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
                  <p>{regulator.renewalDate ? new Date(regulator.renewalDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Last Inspection</p>
                  <p>{regulator.lastInspectionDate ? new Date(regulator.lastInspectionDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Inspection</p>
                  <p>{regulator.nextInspectionDate ? new Date(regulator.nextInspectionDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reporting Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reporting Frequency</p>
                  <p className="capitalize">{regulator.reportingFrequency?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Report Date</p>
                  <p>{regulator.lastReportDate ? new Date(regulator.lastReportDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Report Date</p>
                  <p>{regulator.nextReportDate ? new Date(regulator.nextReportDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Penalties & Fines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {regulator.penaltiesFines && regulator.penaltiesFines.length > 0 ? (
                <div className="space-y-3">
                  {regulator.penaltiesFines.map((p, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p>{p.date}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold">{p.amount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Reason</p>
                          <p>{p.reason}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant={p.status === 'paid' ? 'default' : 'destructive'}>{p.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No penalties or fines recorded</p>
              )}
            </CardContent>
          </Card>

          {regulator.complianceNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{regulator.complianceNotes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Regulator"
        description="Update regulator details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name?.trim() !== ""}
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
            name="acronym"
            label="Acronym"
            value={formData.acronym || ""}
            onChange={(v) => updateField("acronym", v)}
          />
        </FormRow>
        <FormRow>
          <FormField
            type="select"
            name="regulatorType"
            label="Type"
            value={formData.regulatorType || ""}
            onChange={(v) => updateField("regulatorType", v)}
            options={[
              { value: "financial", label: "Financial" },
              { value: "data_protection", label: "Data Protection" },
              { value: "industry_specific", label: "Industry Specific" },
              { value: "environmental", label: "Environmental" },
              { value: "health_safety", label: "Health & Safety" },
            ]}
          />
          <FormField
            type="text"
            name="jurisdiction"
            label="Jurisdiction"
            value={formData.jurisdiction || ""}
            onChange={(v) => updateField("jurisdiction", v)}
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
        <FormField
          type="url"
          name="website"
          label="Website"
          value={formData.website || ""}
          onChange={(v) => updateField("website", v)}
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
        title="Delete Regulator"
        description={`Are you sure you want to delete "${regulator.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
