import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRTS, type ToleranceLevel, type AppetiteLevel } from "@/lib/risks-api";
import { type ControlFramework } from "@/lib/controls-api";
import { PageHeader } from "@/components/common";

export default function RTSCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    rtsId: "",
    title: "",
    objective: "",
    domain: "",
    proposedToleranceLevel: "MEDIUM" as string,
    proposedRTS: "",
    anticipatedOperationalImpact: "",
    rationale: "",
    framework: "ISO" as string,
    appetiteLevel: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.rtsId.trim()) {
      setError("RTS ID is required");
      return;
    }
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.objective.trim()) {
      setError("Objective is required");
      return;
    }
    if (!formData.proposedRTS.trim()) {
      setError("Proposed RTS text is required");
      return;
    }

    try {
      setLoading(true);
      const rts = await createRTS({
        rtsId: formData.rtsId,
        title: formData.title,
        objective: formData.objective,
        domain: formData.domain || undefined,
        proposedToleranceLevel: formData.proposedToleranceLevel as ToleranceLevel,
        proposedRTS: formData.proposedRTS,
        anticipatedOperationalImpact: formData.anticipatedOperationalImpact || undefined,
        rationale: formData.rationale || undefined,
        framework: formData.framework as ControlFramework,
        appetiteLevel: (formData.appetiteLevel || undefined) as AppetiteLevel | undefined,
      });

      navigate(`/risks/tolerance/${rts.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create RTS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create Risk Tolerance Statement"
        description="Define acceptable risk levels for a specific domain"
        actions={
          <Button variant="outline" onClick={() => navigate("/risks/tolerance")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tolerance Statements
          </Button>
        }
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Statement Details</CardTitle>
            <CardDescription>
              Define the tolerance statement identifier and core content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rtsId">RTS ID *</Label>
                <Input
                  id="rtsId"
                  placeholder="e.g., RTS-001"
                  value={formData.rtsId}
                  onChange={(e) => setFormData({ ...formData, rtsId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework">Framework</Label>
                <Select
                  value={formData.framework}
                  onValueChange={(v) => setFormData({ ...formData, framework: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO">ISO 27001</SelectItem>
                    <SelectItem value="SOC2">SOC2</SelectItem>
                    <SelectItem value="NIS2">NIS2</SelectItem>
                    <SelectItem value="DORA">DORA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Vulnerability Management Tolerance"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective *</Label>
              <Textarea
                id="objective"
                placeholder="What this tolerance statement aims to achieve..."
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="e.g., Vulnerability Management"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedToleranceLevel">Tolerance Level</Label>
                <Select
                  value={formData.proposedToleranceLevel}
                  onValueChange={(v) => setFormData({ ...formData, proposedToleranceLevel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedRTS">Proposed Tolerance Statement *</Label>
              <Textarea
                id="proposedRTS"
                placeholder="Full text of the tolerance statement..."
                value={formData.proposedRTS}
                onChange={(e) => setFormData({ ...formData, proposedRTS: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rationale">Rationale</Label>
              <Textarea
                id="rationale"
                placeholder="Why this tolerance level is appropriate..."
                value={formData.rationale}
                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anticipatedOperationalImpact">Anticipated Operational Impact</Label>
              <Textarea
                id="anticipatedOperationalImpact"
                placeholder="Expected impact on operations..."
                value={formData.anticipatedOperationalImpact}
                onChange={(e) => setFormData({ ...formData, anticipatedOperationalImpact: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/risks/tolerance")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create RTS
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
