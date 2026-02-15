import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getIncident,
  createIncident,
  updateIncident,
  getIncidentTypes,
  getAttackVectors,
  type Incident,
  type IncidentType,
  type AttackVector,
  type IncidentSeverity,
  type IncidentCategory,
  type IncidentSource,
  type IncidentStatus,
  type IncidentResolutionType,
  severityLabels,
  categoryLabels,
  sourceLabels,
  statusLabels,
} from "@/lib/incidents-api";

export default function IncidentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [attackVectors, setAttackVectors] = useState<AttackVector[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");
  const [category, setCategory] = useState<IncidentCategory>("OTHER");
  const [source, setSource] = useState<IncidentSource>("USER_REPORT");
  const [sourceRef, setSourceRef] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("DETECTED");
  const [detectedAt, setDetectedAt] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [incidentTypeId, setIncidentTypeId] = useState("");
  const [attackVectorId, setAttackVectorId] = useState("");
  const [confidentialityBreach, setConfidentialityBreach] = useState(false);
  const [integrityBreach, setIntegrityBreach] = useState(false);
  const [availabilityBreach, setAvailabilityBreach] = useState(false);

  // Compliance & Investigation
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [evidencePreserved, setEvidencePreserved] = useState(false);
  const [chainOfCustodyMaintained, setChainOfCustodyMaintained] = useState(false);
  const [rootCauseIdentified, setRootCauseIdentified] = useState(false);
  const [lessonsLearnedCompleted, setLessonsLearnedCompleted] = useState(false);
  const [correctiveActionsIdentified, setCorrectiveActionsIdentified] = useState(false);
  const [resolutionType, setResolutionType] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load reference data
      const [typesData, vectorsData] = await Promise.all([
        getIncidentTypes().catch(() => []),
        getAttackVectors().catch(() => []),
      ]);
      setIncidentTypes(typesData);
      setAttackVectors(vectorsData);

      // Load existing incident if editing
      if (id) {
        const incident = await getIncident(id);
        setTitle(incident.title);
        setDescription(incident.description);
        setSeverity(incident.severity);
        setCategory(incident.category);
        setSource(incident.source);
        setSourceRef(incident.sourceRef || "");
        setStatus(incident.status);
        setDetectedAt(incident.detectedAt.slice(0, 16)); // Format for datetime-local
        setOccurredAt(incident.occurredAt?.slice(0, 16) || "");
        setIncidentTypeId(incident.incidentTypeId || "");
        setAttackVectorId(incident.attackVectorId || "");
        setConfidentialityBreach(incident.confidentialityBreach);
        setIntegrityBreach(incident.integrityBreach);
        setAvailabilityBreach(incident.availabilityBreach);
        setIsConfirmed(incident.isConfirmed || false);
        setEvidencePreserved(incident.evidencePreserved || false);
        setChainOfCustodyMaintained(incident.chainOfCustodyMaintained || false);
        setRootCauseIdentified(incident.rootCauseIdentified || false);
        setLessonsLearnedCompleted(incident.lessonsLearnedCompleted || false);
        setCorrectiveActionsIdentified(incident.correctiveActionsIdentified || false);
        setResolutionType(incident.resolutionType || "");
      } else {
        // Set default detected time to now
        setDetectedAt(new Date().toISOString().slice(0, 16));
      }
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!detectedAt) {
      toast.error("Detection time is required");
      return;
    }

    try {
      setSaving(true);

      const baseData = {
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        source,
        sourceRef: sourceRef.trim() || undefined,
        detectedAt: new Date(detectedAt).toISOString(),
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        incidentTypeId: incidentTypeId || undefined,
        attackVectorId: attackVectorId || undefined,
        confidentialityBreach,
        integrityBreach,
        availabilityBreach,
      };

      if (isEditing) {
        await updateIncident(id!, {
          ...baseData,
          status,
          isConfirmed,
          evidencePreserved,
          chainOfCustodyMaintained,
          rootCauseIdentified,
          lessonsLearnedCompleted,
          correctiveActionsIdentified,
          resolutionType: (resolutionType || undefined) as IncidentResolutionType | undefined,
        });
        toast.success("Incident updated");
      } else {
        const created = await createIncident(baseData);
        toast.success("Incident reported");
        navigate(`/incidents/${created.id}`);
        return;
      }

      navigate(`/incidents/${id}`);
    } catch (err) {
      console.error("Error saving incident:", err);
      toast.error(isEditing ? "Failed to update incident" : "Failed to report incident");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? "Edit Incident" : "Report New Incident"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditing
              ? "Update incident details"
              : "Document a new security incident"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of the incident"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of what happened, initial observations, and any immediate actions taken"
                    rows={6}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity *</Label>
                    <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(severityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as IncidentCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as IncidentStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="incidentType">Incident Type</Label>
                    <Select value={incidentTypeId} onValueChange={setIncidentTypeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attackVector">Attack Vector</Label>
                    <Select value={attackVectorId} onValueChange={setAttackVectorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vector" />
                      </SelectTrigger>
                      <SelectContent>
                        {attackVectors.map((vector) => (
                          <SelectItem key={vector.id} value={vector.id}>
                            {vector.name}
                            {vector.mitreAttackId && ` (${vector.mitreAttackId})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">CIA Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confidentiality"
                      checked={confidentialityBreach}
                      onCheckedChange={(checked) => setConfidentialityBreach(checked as boolean)}
                    />
                    <Label htmlFor="confidentiality" className="cursor-pointer">
                      Confidentiality Breach
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="integrity"
                      checked={integrityBreach}
                      onCheckedChange={(checked) => setIntegrityBreach(checked as boolean)}
                    />
                    <Label htmlFor="integrity" className="cursor-pointer">
                      Integrity Breach
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="availability"
                      checked={availabilityBreach}
                      onCheckedChange={(checked) => setAvailabilityBreach(checked as boolean)}
                    />
                    <Label htmlFor="availability" className="cursor-pointer">
                      Availability Breach
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance & Investigation (shown when editing) */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compliance & Investigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="isConfirmed" className="font-normal">Confirmed</Label>
                      <Switch id="isConfirmed" checked={isConfirmed} onCheckedChange={setIsConfirmed} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="evidencePreserved" className="font-normal">Evidence Preserved</Label>
                      <Switch id="evidencePreserved" checked={evidencePreserved} onCheckedChange={setEvidencePreserved} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="chainOfCustody" className="font-normal">Chain of Custody</Label>
                      <Switch id="chainOfCustody" checked={chainOfCustodyMaintained} onCheckedChange={setChainOfCustodyMaintained} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="rootCause" className="font-normal">Root Cause Identified</Label>
                      <Switch id="rootCause" checked={rootCauseIdentified} onCheckedChange={setRootCauseIdentified} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="lessonsLearned" className="font-normal">Lessons Learned</Label>
                      <Switch id="lessonsLearned" checked={lessonsLearnedCompleted} onCheckedChange={setLessonsLearnedCompleted} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="correctiveActions" className="font-normal">Corrective Actions</Label>
                      <Switch id="correctiveActions" checked={correctiveActionsIdentified} onCheckedChange={setCorrectiveActionsIdentified} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolutionType">Resolution Type</Label>
                    <Select value={resolutionType || "__none__"} onValueChange={(v) => setResolutionType(v === "__none__" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not set</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="MITIGATED">Mitigated</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                        <SelectItem value="DUPLICATE">Duplicate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Detection Source *</Label>
                  <Select value={source} onValueChange={(v) => setSource(v as IncidentSource)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sourceLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceRef">Source Reference</Label>
                  <Input
                    id="sourceRef"
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    placeholder="e.g., SIEM alert ID, ticket number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detectedAt">Detected At *</Label>
                  <Input
                    id="detectedAt"
                    type="datetime-local"
                    value={detectedAt}
                    onChange={(e) => setDetectedAt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occurredAt">Occurred At</Label>
                  <Input
                    id="occurredAt"
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    When the incident actually happened (if different from detection)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : isEditing ? "Update" : "Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

