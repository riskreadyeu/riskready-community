import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle, XCircle, Ban } from 'lucide-react';

interface ActiveStatusBadgeProps {
  applicable: boolean;
  enabled: boolean;
  justificationIfNa?: string;
  disabledReason?: string;
  disabledAt?: string;
  disabledBy?: { firstName?: string; lastName?: string; email: string };
  size?: 'sm' | 'default';
}

/**
 * Badge showing the effective status of a control or risk
 * Active = applicable AND enabled
 * Shows tooltip with reason when disabled or not applicable
 */
export function ActiveStatusBadge({
  applicable,
  enabled,
  justificationIfNa,
  disabledReason,
  disabledAt,
  disabledBy,
  size = 'default',
}: ActiveStatusBadgeProps) {
  const isActive = applicable && enabled;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  // Not Applicable (regulatory scope)
  if (!applicable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              <Ban className={iconSize} />
              Not Applicable
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Out of Regulatory Scope</p>
            {justificationIfNa && (
              <p className="text-muted-foreground mt-1">{justificationIfNa}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Disabled (manual)
  if (!enabled) {
    const disabledByName = disabledBy
      ? disabledBy.firstName && disabledBy.lastName
        ? `${disabledBy.firstName} ${disabledBy.lastName}`
        : disabledBy.email
      : undefined;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1">
              <XCircle className={iconSize} />
              Disabled
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Manually Disabled</p>
            {disabledReason && (
              <p className="text-muted-foreground mt-1">{disabledReason}</p>
            )}
            {disabledByName && disabledAt && (
              <p className="text-xs text-muted-foreground mt-2">
                By {disabledByName} on {new Date(disabledAt).toLocaleDateString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Active
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle className={iconSize} />
      Active
    </Badge>
  );
}
