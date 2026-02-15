import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Link2,
  Edit3,
  Trash2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Mail,
  Globe,
  Phone,
  Shield,
  FileText,
  Database,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
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
  getExternalDependency,
  updateExternalDependency,
  deleteExternalDependency,
  type ExternalDependency,
} from "@/lib/organisation-api";

export default function ExternalDependencyDetailPage() {
  const { dependencyId } = useParams<{ dependencyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dependency, setDependency] = useState<ExternalDependency | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<ExternalDependency>>({
    name: "",
    dependencyType: "",
    description: "",
    criticalityLevel: "",
    contactEmail: "",
  });

  useEffect(() => {
    if (dependencyId) {
      loadData();
    }
  }, [dependencyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getExternalDependency(dependencyId!);
      setDependency(data);
      if (data) {
        setFormData({
          name: data.name,
          dependencyType: data.dependencyType,
          description: data.description || "",
          criticalityLevel: data.criticalityLevel || "",
          businessImpact: data.businessImpact || "",
          contactEmail: data.contactEmail || "",
        });
      }
    } catch (err) {
      console.error("Error loading dependency:", err);
      toast.error("Failed to load dependency");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateExternalDependency(dependencyId!, formData);
      toast.success("Dependency updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating dependency:", err);
      toast.error("Failed to update dependency");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteExternalDependency(dependencyId!);
      toast.success("Dependency deleted successfully");
      navigate("/organisation/dependencies");
    } catch (err) {
      console.error("Error deleting dependency:", err);
      toast.error("Failed to delete dependency");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof ExternalDependency>(field: K, value: ExternalDependency[K]) => {
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

  if (!dependency) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dependency not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/dependencies")}>
          Back to Dependencies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={dependency.name}
        description={dependency.description || "External dependency details"}
        backLink="/organisation/dependencies"
        backLabel="Back to Dependencies"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline">{dependency.dependencyType}</Badge>
            {dependency.criticalityLevel && <CriticalityBadge level={dependency.criticalityLevel} />}
            {dependency.singlePointOfFailure && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                SPOF
              </Badge>
            )}
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
            <RecordActionsMenu
              recordType="External Dependency"
              recordId={dependencyId!}
              recordName={dependency.name}
            />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{dependency.dependencyType.replace("_", " ")}</p>
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
                <p className="text-sm text-muted-foreground">Annual Cost</p>
                <p className="font-medium">{dependency.annualCost ? `$${dependency.annualCost}` : "-"}</p>
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
                <p className="text-sm text-muted-foreground">Contract End</p>
                <p className="font-medium">
                  {dependency.contractEnd ? new Date(dependency.contractEnd).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Rating</p>
                <p className="font-medium capitalize">{dependency.riskRating || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs defaultValue="overview" className="space-y-4" syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="contract">Contract & SLA</ArcherTabsTrigger>
          <ArcherTabsTrigger value="data">Data & Compliance</ArcherTabsTrigger>
          <ArcherTabsTrigger value="contingency">Contingency</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dependency Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Business Impact</p>
                  <p>{dependency.businessImpact || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Assessment</p>
                  <p>{dependency.lastAssessmentDate ? new Date(dependency.lastAssessmentDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Rating</p>
                  <p className="capitalize">{dependency.riskRating || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  {dependency.vendorWebsite ? (
                    <a href={dependency.vendorWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {dependency.vendorWebsite}
                    </a>
                  ) : <p>-</p>}
                </div>
              </div>
              {dependency.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{dependency.description}</p>
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
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p>{dependency.primaryContact || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{dependency.contactEmail || "-"}</span>
                </div>
                {dependency.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{dependency.contactPhone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="contract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Reference</p>
                  <p className="font-mono">{dependency.contractReference || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Start</p>
                  <p>{dependency.contractStart ? new Date(dependency.contractStart).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract End</p>
                  <p>{dependency.contractEnd ? new Date(dependency.contractEnd).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Cost</p>
                  <p>{dependency.annualCost ? `$${Number(dependency.annualCost).toLocaleString()}` : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p>{dependency.paymentTerms || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLA Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA Details</CardTitle>
            </CardHeader>
            <CardContent>
              {dependency.slaDetails ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <p>{dependency.slaDetails.availability || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p>{dependency.slaDetails.responseTime || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resolution Time</p>
                    <p>{dependency.slaDetails.resolutionTime || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Penalties</p>
                    <p>{dependency.slaDetails.penalties || "-"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No SLA details defined</p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="data" className="space-y-4">
          {/* Data Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{dependency.dataLocation || "-"}</span>
                  </div>
                </div>
              </div>
              {dependency.dataProcessed && dependency.dataProcessed.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Data Processed</p>
                  <div className="flex flex-wrap gap-2">
                    {dependency.dataProcessed.map((d, i) => <Badge key={i} variant="outline">{d}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dependency.complianceCertifications && dependency.complianceCertifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dependency.complianceCertifications.map((c, i) => <Badge key={i} variant="secondary">{c}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No compliance certifications recorded</p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="contingency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Contingency Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dependency.alternativeProviders && dependency.alternativeProviders.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Alternative Providers</p>
                  <div className="flex flex-wrap gap-2">
                    {dependency.alternativeProviders.map((p, i) => <Badge key={i} variant="outline">{p}</Badge>)}
                  </div>
                </div>
              )}
              {dependency.exitStrategy && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Exit Strategy</p>
                  <p className="text-sm">{dependency.exitStrategy}</p>
                </div>
              )}
              {dependency.dataRecoveryProcedure && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data Recovery Procedure</p>
                  <p className="text-sm">{dependency.dataRecoveryProcedure}</p>
                </div>
              )}
              {!dependency.alternativeProviders?.length && !dependency.exitStrategy && !dependency.dataRecoveryProcedure && (
                <p className="text-sm text-muted-foreground">No contingency plans defined</p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history" className="space-y-4">
          <HistoryTab
            recordType="ExternalDependency"
            recordId={dependencyId!}
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Dependency"
        description="Update dependency details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name?.trim() !== ""}
        size="lg"
      >
        <FormField
          type="text"
          name="name"
          label="Name"
          value={formData.name || ""}
          onChange={(v) => updateField("name", v)}
          required
        />
        <FormRow>
          <FormField
            type="select"
            name="dependencyType"
            label="Type"
            value={formData.dependencyType || ""}
            onChange={(v) => updateField("dependencyType", v)}
            options={[
              { value: "vendor", label: "Vendor" },
              { value: "supplier", label: "Supplier" },
              { value: "partner", label: "Partner" },
              { value: "service_provider", label: "Service Provider" },
              { value: "cloud_service", label: "Cloud Service" },
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
        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description || ""}
          onChange={(v) => updateField("description", v)}
          rows={2}
        />
        <FormField
          type="email"
          name="contactEmail"
          label="Contact Email"
          value={formData.contactEmail || ""}
          onChange={(v) => updateField("contactEmail", v)}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Dependency"
        description={`Are you sure you want to delete "${dependency.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
