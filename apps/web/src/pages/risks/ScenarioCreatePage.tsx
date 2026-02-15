import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { createRiskScenario, getRisks, type Risk } from "@/lib/risks-api";
import { PageHeader } from "@/components/common";

export default function ScenarioCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRiskId = searchParams.get("riskId");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);

  const [formData, setFormData] = useState({
    scenarioId: "",
    title: "",
    cause: "",
    event: "",
    consequence: "",
    likelihood: "" as string,
    impact: "" as string,
    riskId: preselectedRiskId || "",
  });

  useEffect(() => {
    getRisks().then(({ results }) => setRisks(results)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.scenarioId.trim()) {
      setError("Scenario ID is required");
      return;
    }
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.riskId) {
      setError("Risk is required");
      return;
    }

    try {
      setLoading(true);
      const scenario = await createRiskScenario({
        scenarioId: formData.scenarioId,
        title: formData.title,
        cause: formData.cause || undefined,
        event: formData.event || undefined,
        consequence: formData.consequence || undefined,
        likelihood: formData.likelihood ? formData.likelihood as any : undefined,
        impact: formData.impact ? formData.impact as any : undefined,
        riskId: formData.riskId,
      });

      navigate(`/risks/scenarios/${scenario.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scenario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create Risk Scenario"
        description="Define a new risk scenario with cause, event, and consequence"
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
            <CardTitle>Scenario Details</CardTitle>
            <CardDescription>
              Describe the risk scenario using cause-event-consequence structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioId">Scenario ID *</Label>
                <Input
                  id="scenarioId"
                  placeholder="e.g., R-01-S01"
                  value={formData.scenarioId}
                  onChange={(e) => setFormData({ ...formData, scenarioId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskId">Risk *</Label>
                <Select
                  value={formData.riskId}
                  onValueChange={(v) => setFormData({ ...formData, riskId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a risk" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks.map((risk) => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.riskId} - {risk.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Phishing attack leading to credential compromise"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cause">Cause</Label>
              <Textarea
                id="cause"
                placeholder="What could cause this scenario to occur..."
                value={formData.cause}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Event</Label>
              <Textarea
                id="event"
                placeholder="What happens when the scenario materialises..."
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consequence">Consequence</Label>
              <Textarea
                id="consequence"
                placeholder="What are the impacts if this scenario occurs..."
                value={formData.consequence}
                onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="likelihood">Inherent Likelihood</Label>
                <Select
                  value={formData.likelihood}
                  onValueChange={(v) => setFormData({ ...formData, likelihood: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select likelihood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RARE">Rare</SelectItem>
                    <SelectItem value="UNLIKELY">Unlikely</SelectItem>
                    <SelectItem value="POSSIBLE">Possible</SelectItem>
                    <SelectItem value="LIKELY">Likely</SelectItem>
                    <SelectItem value="ALMOST_CERTAIN">Almost Certain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Inherent Impact</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(v) => setFormData({ ...formData, impact: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEGLIGIBLE">Negligible</SelectItem>
                    <SelectItem value="MINOR">Minor</SelectItem>
                    <SelectItem value="MODERATE">Moderate</SelectItem>
                    <SelectItem value="MAJOR">Major</SelectItem>
                    <SelectItem value="SEVERE">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
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
                Create Scenario
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
