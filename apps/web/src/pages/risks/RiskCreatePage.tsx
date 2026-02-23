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
import { createRisk, type RiskTier } from "@/lib/risks-api";
import { type ControlFramework } from "@/lib/controls-api";
import { PageHeader } from "@/components/common";

export default function RiskCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    riskId: "",
    title: "",
    description: "",
    tier: "CORE" as string,
    framework: "ISO" as string,
    riskOwner: "",
    applicable: true,
    justificationIfNa: "",
    orgSize: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.riskId.trim()) {
      setError("Risk ID is required");
      return;
    }
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      const risk = await createRisk({
        riskId: formData.riskId,
        title: formData.title,
        description: formData.description || undefined,
        tier: formData.tier as RiskTier,
        framework: formData.framework as ControlFramework,
        riskOwner: formData.riskOwner || undefined,
        applicable: formData.applicable,
        justificationIfNa: !formData.applicable ? formData.justificationIfNa || undefined : undefined,
        orgSize: formData.orgSize || undefined,
      });

      navigate(`/risks/${risk.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create risk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create New Risk"
        description="Add a new risk to the register"
        actions={
          <Button variant="outline" onClick={() => navigate("/risks/register")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Register
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
            <CardTitle>Risk Details</CardTitle>
            <CardDescription>
              Define the risk identifier, title, and classification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskId">Risk ID *</Label>
                <Input
                  id="riskId"
                  placeholder="e.g., R-01"
                  value={formData.riskId}
                  onChange={(e) => setFormData({ ...formData, riskId: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this risk
                </p>
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
                placeholder="e.g., Unauthorized Access to Customer Data"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the risk, its potential causes and impacts..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(v) => setFormData({ ...formData, tier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">Core</SelectItem>
                    <SelectItem value="EXTENDED">Extended</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskOwner">Risk Owner</Label>
                <Input
                  id="riskOwner"
                  placeholder="e.g., CISO, IT Director"
                  value={formData.riskOwner}
                  onChange={(e) => setFormData({ ...formData, riskOwner: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSize">Organisation Size</Label>
              <Input
                id="orgSize"
                placeholder="e.g., S,M,L"
                value={formData.orgSize}
                onChange={(e) => setFormData({ ...formData, orgSize: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated sizes this risk applies to
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Applicability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="applicable">Applicable</Label>
                <p className="text-xs text-muted-foreground">
                  Whether this risk is applicable to your organisation
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
                  placeholder="Explain why this risk is not applicable..."
                  value={formData.justificationIfNa}
                  onChange={(e) => setFormData({ ...formData, justificationIfNa: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/risks/register")}
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
                Create Risk
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
