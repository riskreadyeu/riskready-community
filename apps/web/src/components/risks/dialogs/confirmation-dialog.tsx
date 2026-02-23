import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => Promise<void> | void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...",
  onConfirm,
}: ConfirmationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError("Reason is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(reason.trim() || undefined);
      onOpenChange(false);
      setReason("");
    } catch (err: unknown) {
      console.error("Error in confirmation action:", err);
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">{reasonLabel} *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
            />
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Convenience hook for common confirmation patterns
export function useConfirmation() {
  const [config, setConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    requireReason?: boolean;
    reasonLabel?: string;
    onConfirm?: (reason?: string) => Promise<void> | void;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const confirm = (options: {
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    requireReason?: boolean;
    reasonLabel?: string;
  }): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
      setConfig({
        ...options,
        open: true,
        onConfirm: async (reason) => {
          resolve(reason);
        },
      });
    });
  };

  const close = () => {
    setConfig((prev) => ({ ...prev, open: false }));
  };

  return {
    confirm,
    dialogProps: {
      open: config.open,
      onOpenChange: (open: boolean) => {
        if (!open) close();
        else setConfig((prev) => ({ ...prev, open }));
      },
      title: config.title,
      description: config.description,
      confirmLabel: config.confirmLabel,
      variant: config.variant,
      requireReason: config.requireReason,
      reasonLabel: config.reasonLabel,
      onConfirm: config.onConfirm || (() => {}),
    },
  };
}
