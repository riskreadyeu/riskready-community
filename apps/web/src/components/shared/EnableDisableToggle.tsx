import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { ActiveStatusBadge } from './ActiveStatusBadge';

interface EnableDisableToggleProps {
  /** Current applicability state (from regulatory scope) */
  applicable: boolean;
  /** Current enabled state */
  enabled: boolean;
  /** Justification if not applicable */
  justificationIfNa?: string;
  /** Reason for being disabled */
  disabledReason?: string;
  /** When it was disabled */
  disabledAt?: string;
  /** Who disabled it */
  disabledBy?: { firstName?: string; lastName?: string; email: string };
  /** Called when user wants to disable */
  onDisable: (reason: string) => Promise<void>;
  /** Called when user wants to enable */
  onEnable: () => Promise<void>;
  /** Entity type for display text */
  entityType: 'control' | 'risk';
  /** Entity name for display */
  entityName: string;
}

/**
 * Toggle component for enabling/disabling a control or risk
 * Shows current status badge and provides enable/disable actions
 */
export function EnableDisableToggle({
  applicable,
  enabled,
  justificationIfNa,
  disabledReason,
  disabledAt,
  disabledBy,
  onDisable,
  onEnable,
  entityType,
  entityName,
}: EnableDisableToggleProps) {
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = applicable && enabled;

  const handleDisable = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for disabling');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onDisable(reason.trim());
      setIsDisableDialogOpen(false);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onEnable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <ActiveStatusBadge
        applicable={applicable}
        enabled={enabled}
        justificationIfNa={justificationIfNa}
        disabledReason={disabledReason}
        disabledAt={disabledAt}
        disabledBy={disabledBy}
      />

      {/* Action Button */}
      {applicable ? (
        enabled ? (
          // Can disable
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDisableDialogOpen(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <PowerOff className="h-4 w-4 mr-1" />
            )}
            Disable
          </Button>
        ) : (
          // Can enable
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnable}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Power className="h-4 w-4 mr-1" />
            )}
            Enable
          </Button>
        )
      ) : (
        // Cannot enable - out of scope
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled>
                <Power className="h-4 w-4 mr-1" />
                Enable
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cannot enable - {entityType} is out of regulatory scope</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Error display */}
      {error && !isDisableDialogOpen && (
        <span className="text-sm text-destructive">{error}</span>
      )}

      {/* Disable Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable {entityType}</DialogTitle>
            <DialogDescription>
              You are about to disable <strong>{entityName}</strong>. This will
              exclude it from active monitoring and assessments. Please provide
              a reason for audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for disabling *</Label>
              <Textarea
                id="reason"
                placeholder={`e.g., "Phasing in next quarter", "Not relevant to current operations", "Superseded by another ${entityType}"`}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(null);
                }}
                rows={3}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDisableDialogOpen(false);
                setReason('');
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Disable {entityType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
