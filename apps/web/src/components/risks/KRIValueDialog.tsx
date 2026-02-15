import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { updateKRIValue, type KeyRiskIndicator } from "@/lib/risks-api";
import { Activity, Loader2, TrendingUp, Minus, TrendingDown, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KRIValueDialogProps {
  kri: KeyRiskIndicator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function KRIValueDialog({ 
  kri, 
  open, 
  onOpenChange, 
  onSuccess 
}: KRIValueDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value) {
      setError("Value is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateKRIValue(kri.id, value, undefined, notes || undefined);
      onSuccess?.();
      onOpenChange(false);
      setValue("");
      setNotes("");
    } catch (err: any) {
      console.error("Error recording value:", err);
      setError(err.message || "Failed to record value");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setValue("");
    setNotes("");
    setError(null);
    onOpenChange(false);
  };

  // Estimate what status the new value might result in
  const estimateStatus = () => {
    if (!value || !kri.thresholdGreen) return null;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    // Simple threshold comparison (this is a rough estimate)
    // Real logic would need to parse threshold strings properly
    const greenMatch = kri.thresholdGreen?.match(/[<>]?\s*(\d+\.?\d*)/);
    const amberMatch = kri.thresholdAmber?.match(/[<>]?\s*(\d+\.?\d*)/);
    const redMatch = kri.thresholdRed?.match(/[<>]?\s*(\d+\.?\d*)/);

    if (greenMatch) {
      const greenVal = parseFloat(greenMatch[1]!);
      if (kri.thresholdGreen?.includes('<') && numValue < greenVal) return 'GREEN';
      if (kri.thresholdGreen?.includes('>') && numValue > greenVal) return 'GREEN';
    }
    if (redMatch) {
      const redVal = parseFloat(redMatch[1]!);
      if (kri.thresholdRed?.includes('>') && numValue > redVal) return 'RED';
      if (kri.thresholdRed?.includes('<') && numValue < redVal) return 'RED';
    }
    
    return 'AMBER';
  };

  const estimatedStatus = estimateStatus();

  const StatusIcon = {
    GREEN: CheckCircle2,
    AMBER: AlertCircle,
    RED: AlertTriangle,
  }[estimatedStatus || 'GREEN'] || Minus;

  const statusColors: Record<string, string> = {
    GREEN: "bg-green-500/10 text-green-600 border-green-500/20",
    AMBER: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    RED: "bg-red-500/10 text-red-600 border-red-500/20",
    NOT_MEASURED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Record KRI Value
          </DialogTitle>
          <DialogDescription>
            Record a new measurement for <span className="font-medium">{kri.name}</span> ({kri.kriId})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Current Status */}
            {kri.currentValue && (
              <div className="p-3 rounded-lg bg-secondary/30 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="text-lg font-bold">{kri.currentValue} {kri.unit}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    statusColors[kri.status || 'GREEN'] || ""
                  )}>
                    {kri.status || "NOT MEASURED"}
                  </Badge>
                </div>
              </div>
            )}

            {/* New Value Input */}
            <div className="space-y-2">
              <Label htmlFor="value">New Value ({kri.unit}) *</Label>
              <Input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter value in ${kri.unit || 'units'}`}
                required
                autoFocus
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any context or notes about this measurement..."
                rows={3}
              />
            </div>

            {/* Threshold Reference */}
            <div className="rounded-lg bg-secondary/30 p-4 space-y-3">
              <p className="font-medium text-sm">Threshold Reference</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded border border-green-500/30 bg-green-500/5">
                  <p className="text-[10px] text-muted-foreground">Green</p>
                  <p className="text-sm font-mono text-green-600">
                    {kri.thresholdGreen || "—"}
                  </p>
                </div>
                <div className="p-2 rounded border border-amber-500/30 bg-amber-500/5">
                  <p className="text-[10px] text-muted-foreground">Amber</p>
                  <p className="text-sm font-mono text-amber-600">
                    {kri.thresholdAmber || "—"}
                  </p>
                </div>
                <div className="p-2 rounded border border-red-500/30 bg-red-500/5">
                  <p className="text-[10px] text-muted-foreground">Red</p>
                  <p className="text-sm font-mono text-red-600">
                    {kri.thresholdRed || "—"}
                  </p>
                </div>
              </div>

              {/* Estimated Status */}
              {value && estimatedStatus && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Estimated Status:</span>
                  <Badge variant="outline" className={cn("text-xs", statusColors[estimatedStatus])}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {estimatedStatus}
                  </Badge>
                </div>
              )}
            </div>

            {/* Formula Info */}
            {kri.formula && (
              <div className="text-xs text-muted-foreground p-3 rounded bg-muted/50">
                <span className="font-medium">Formula:</span> {kri.formula}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !value}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Value"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
