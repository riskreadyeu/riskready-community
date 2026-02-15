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
import { Switch } from "@/components/ui/switch";
import { createControl, type ControlTheme, type ControlFramework } from "@/lib/controls-api";
import { PageHeader } from "@/components/common";

export default function ControlCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    controlId: "",
    name: "",
    description: "",
    theme: "ORGANISATIONAL" as ControlTheme,
    framework: "ISO" as ControlFramework,
    sourceStandard: "",
    implementationStatus: "NOT_STARTED" as string,
    implementationDesc: "",
    applicable: true,
    justificationIfNa: "",
    soc2Criteria: "",
    tscCategory: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.controlId.trim()) {
      setError("Control ID is required");
      return;
    }
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setLoading(true);
      const orgId = "cmj7b9wys0000eocjc9zm0j9m";

      const control = await createControl({
        controlId: formData.controlId,
        name: formData.name,
        description: formData.description || undefined,
        theme: formData.theme,
        framework: formData.framework,
        sourceStandard: formData.sourceStandard || undefined,
        soc2Criteria: formData.soc2Criteria || undefined,
        tscCategory: formData.tscCategory || undefined,
        applicable: formData.applicable,
        justificationIfNa: !formData.applicable ? formData.justificationIfNa || undefined : undefined,
        implementationStatus: formData.implementationStatus as any,
        implementationDesc: formData.implementationDesc || undefined,
        organisationId: orgId,
      });

      navigate(`/controls/${control.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create control");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create New Control"
        description="Add a custom control to the library"
        actions={
          <Button variant="outline" onClick={() => navigate("/controls/library")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
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
            <CardTitle>Control Details</CardTitle>
            <CardDescription>
              Define the control identifier, name, and classification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="controlId">Control ID *</Label>
                <Input
                  id="controlId"
                  placeholder="e.g., CUSTOM-001 or 14.1"
                  value={formData.controlId}
                  onChange={(e) => setFormData({ ...formData, controlId: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this control
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework">Framework</Label>
                <Select
                  value={formData.framework}
                  onValueChange={(v) => setFormData({ ...formData, framework: v as ControlFramework })}
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Multi-Factor Authentication"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the control objective and requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme *</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(v) => setFormData({ ...formData, theme: v as ControlTheme })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORGANISATIONAL">Organisational</SelectItem>
                    <SelectItem value="PEOPLE">People</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                    <SelectItem value="TECHNOLOGICAL">Technological</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementationStatus">Implementation Status</Label>
                <Select
                  value={formData.implementationStatus}
                  onValueChange={(v) => setFormData({ ...formData, implementationStatus: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceStandard">Source Standard</Label>
              <Input
                id="sourceStandard"
                placeholder="e.g., ISO 27001:2022 Annex A, NIST SP 800-53"
                value={formData.sourceStandard}
                onChange={(e) => setFormData({ ...formData, sourceStandard: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementationDesc">Implementation Notes</Label>
              <Textarea
                id="implementationDesc"
                placeholder="Describe current implementation details..."
                value={formData.implementationDesc}
                onChange={(e) => setFormData({ ...formData, implementationDesc: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Applicability & Framework Details</CardTitle>
            <CardDescription>
              Set applicability status and framework-specific fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="applicable">Applicable</Label>
                <p className="text-xs text-muted-foreground">
                  Whether this control is applicable to your organisation
                </p>
              </div>
              <Switch
                id="applicable"
                checked={formData.applicable}
                onCheckedChange={(checked) => setFormData({ ...formData, applicable: checked })}
              />
            </div>

            {!formData.applicable && (
              <div className="space-y-2">
                <Label htmlFor="justificationIfNa">Justification for N/A</Label>
                <Textarea
                  id="justificationIfNa"
                  placeholder="Explain why this control is not applicable..."
                  value={formData.justificationIfNa}
                  onChange={(e) => setFormData({ ...formData, justificationIfNa: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            {formData.framework === "SOC2" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soc2Criteria">SOC2 Criteria</Label>
                  <Input
                    id="soc2Criteria"
                    placeholder="e.g., CC6.1"
                    value={formData.soc2Criteria}
                    onChange={(e) => setFormData({ ...formData, soc2Criteria: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tscCategory">TSC Category</Label>
                  <Input
                    id="tscCategory"
                    placeholder="e.g., Security"
                    value={formData.tscCategory}
                    onChange={(e) => setFormData({ ...formData, tscCategory: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/controls/library")}
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
                Create Control
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
