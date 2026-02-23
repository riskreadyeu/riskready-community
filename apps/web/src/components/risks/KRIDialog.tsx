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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  createKRI, 
  updateKRI,
  type KeyRiskIndicator, 
  type RiskTier, 
  type ControlFramework,
  type CollectionFrequency,
} from "@/lib/risks-api";
import { Activity, Loader2 } from "lucide-react";

interface KRIDialogProps {
  kri?: KeyRiskIndicator | null;
  riskId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function KRIDialog({ 
  kri, 
  riskId, 
  open, 
  onOpenChange, 
  onSuccess 
}: KRIDialogProps) {
  const isEditing = !!kri;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    kriId: "",
    name: "",
    description: "",
    tier: "CORE" as RiskTier,
    framework: "ISO" as ControlFramework,
    frequency: "MONTHLY" as CollectionFrequency,
    unit: "",
    formula: "",
    dataSource: "",
    automated: false,
    thresholdGreen: "",
    thresholdAmber: "",
    thresholdRed: "",
    soc2Criteria: "",
  });

  useEffect(() => {
    if (kri) {
      setForm({
        kriId: kri.kriId || "",
        name: kri.name || "",
        description: kri.description || "",
        tier: kri.tier,
        framework: kri.framework,
        frequency: kri.frequency,
        unit: kri.unit || "",
        formula: kri.formula || "",
        dataSource: kri.dataSource || "",
        automated: kri.automated || false,
        thresholdGreen: kri.thresholdGreen || "",
        thresholdAmber: kri.thresholdAmber || "",
        thresholdRed: kri.thresholdRed || "",
        soc2Criteria: kri.soc2Criteria || "",
      });
    } else {
      resetForm();
    }
  }, [kri]);

  const resetForm = () => {
    setForm({
      kriId: "",
      name: "",
      description: "",
      tier: "CORE",
      framework: "ISO",
      frequency: "MONTHLY",
      unit: "",
      formula: "",
      dataSource: "",
      automated: false,
      thresholdGreen: "",
      thresholdAmber: "",
      thresholdRed: "",
      soc2Criteria: "",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.kriId || !form.name) {
      setError("KRI ID and Name are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        riskId: riskId || kri?.riskId,
      };

      if (isEditing && kri) {
        await updateKRI(kri.id, payload);
      } else {
        await createKRI(payload);
      }
      
      onSuccess?.();
      onOpenChange(false);
      if (!isEditing) resetForm();
    } catch (err: unknown) {
      console.error("Error saving KRI:", err);
      setError(err instanceof Error ? err.message : "Failed to save KRI");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!isEditing) resetForm();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {isEditing ? `Edit KRI - ${kri.kriId}` : "Create New KRI"}
          </DialogTitle>
          <DialogDescription>
            Define a key risk indicator to monitor risk levels.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kriId">KRI ID *</Label>
                <Input
                  id="kriId"
                  value={form.kriId}
                  onChange={(e) => setForm({ ...form, kriId: e.target.value })}
                  placeholder="e.g., KRI-001"
                  disabled={isEditing}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Brief KRI name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this KRI measure and why is it important?"
                rows={3}
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm({ ...form, tier: v as RiskTier })}
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
                <Label htmlFor="frequency">Collection Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: v as CollectionFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REAL_TIME">Real-time</SelectItem>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                    <SelectItem value="AD_HOC">Ad-hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measure</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g., %, hours, count"
                />
              </div>
            </div>

            {/* Formula & Data Source */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">Measurement Details</h4>
              
              <div className="space-y-2">
                <Label htmlFor="formula">Formula</Label>
                <Textarea
                  id="formula"
                  value={form.formula}
                  onChange={(e) => setForm({ ...form, formula: e.target.value })}
                  placeholder="How is this KRI calculated? e.g., (Failed logins / Total logins) × 100"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Input
                    id="dataSource"
                    value={form.dataSource}
                    onChange={(e) => setForm({ ...form, dataSource: e.target.value })}
                    placeholder="e.g., SIEM, ServiceNow, Manual"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 pt-6">
                  <Label htmlFor="automated" className="text-sm">Automated Collection</Label>
                  <Switch
                    id="automated"
                    checked={form.automated}
                    onCheckedChange={(checked) => setForm({ ...form, automated: checked })}
                  />
                </div>
              </div>

              {form.framework === "SOC2" && (
                <div className="space-y-2">
                  <Label htmlFor="soc2Criteria">SOC 2 Criteria</Label>
                  <Input
                    id="soc2Criteria"
                    value={form.soc2Criteria}
                    onChange={(e) => setForm({ ...form, soc2Criteria: e.target.value })}
                    placeholder="e.g., CC6.1"
                  />
                </div>
              )}
            </div>

            {/* Thresholds */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border">
              <h4 className="font-medium text-sm">RAG Thresholds</h4>
              <p className="text-xs text-muted-foreground">Define thresholds for status classification (e.g., "&lt;5" or "5-10" or "&gt;10")</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thresholdGreen" className="text-green-600">Green</Label>
                  <Input
                    id="thresholdGreen"
                    value={form.thresholdGreen}
                    onChange={(e) => setForm({ ...form, thresholdGreen: e.target.value })}
                    placeholder="e.g., <5%"
                    className="border-green-500/50 focus-visible:ring-green-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Acceptable</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thresholdAmber" className="text-amber-600">Amber</Label>
                  <Input
                    id="thresholdAmber"
                    value={form.thresholdAmber}
                    onChange={(e) => setForm({ ...form, thresholdAmber: e.target.value })}
                    placeholder="e.g., 5-10%"
                    className="border-amber-500/50 focus-visible:ring-amber-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Warning</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thresholdRed" className="text-red-600">Red</Label>
                  <Input
                    id="thresholdRed"
                    value={form.thresholdRed}
                    onChange={(e) => setForm({ ...form, thresholdRed: e.target.value })}
                    placeholder="e.g., >10%"
                    className="border-red-500/50 focus-visible:ring-red-500"
                  />
                  <p className="text-[10px] text-muted-foreground">Critical</p>
                </div>
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
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Create KRI"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
