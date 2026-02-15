import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  updateRiskScenario,
  type RiskScenario,
  type ControlFramework,
} from "@/lib/risks-api";
import { GitBranch, Loader2 } from "lucide-react";

interface ScenarioEditDialogProps {
  scenario: RiskScenario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScenarioEditDialog({
  scenario,
  open,
  onOpenChange,
  onSuccess,
}: ScenarioEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    cause: "",
    event: "",
    consequence: "",
    framework: "ISO" as ControlFramework,
  });

  useEffect(() => {
    if (scenario) {
      setForm({
        title: scenario.title || "",
        cause: scenario.cause || "",
        event: scenario.event || "",
        consequence: scenario.consequence || "",
        framework: scenario.framework,
      });
    }
  }, [scenario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scenario) return;
    if (!form.title) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateRiskScenario(scenario.id, form);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving scenario:", err);
      setError(err.message || "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!scenario) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Edit Scenario - {scenario.scenarioId}
          </DialogTitle>
          <DialogDescription>
            Update the scenario narrative and details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief scenario title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={form.framework}
                onValueChange={(v) => setForm({ ...form, framework: v as ControlFramework })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISO">ISO 27001</SelectItem>
                  <SelectItem value="SOC2">SOC 2</SelectItem>
                  <SelectItem value="NIS2">NIS2</SelectItem>
                  <SelectItem value="DORA">DORA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Scenario Narrative (Cause-Event-Consequence)</h4>

              <div className="space-y-2">
                <Label htmlFor="cause">Cause</Label>
                <Textarea
                  id="cause"
                  value={form.cause}
                  onChange={(e) => setForm({ ...form, cause: e.target.value })}
                  placeholder="What conditions or factors could lead to this event occurring?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  The underlying conditions, vulnerabilities, or threat sources that could trigger the event.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event">Event</Label>
                <Textarea
                  id="event"
                  value={form.event}
                  onChange={(e) => setForm({ ...form, event: e.target.value })}
                  placeholder="What is the risk event that could occur?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  The specific incident or occurrence that represents the risk materializing.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consequence">Consequence</Label>
                <Textarea
                  id="consequence"
                  value={form.consequence}
                  onChange={(e) => setForm({ ...form, consequence: e.target.value })}
                  placeholder="What are the potential impacts if this event occurs?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  The outcomes and impacts on the organization if the event materializes.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
