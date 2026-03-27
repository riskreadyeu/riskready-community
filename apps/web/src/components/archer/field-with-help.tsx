import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { FieldWithHelpProps } from "@/lib/archer/types";

/**
 * FieldWithHelp - Field wrapper with label and tooltip helper.
 *
 * Provides a consistent layout for form fields with labels
 * and optional help text displayed in a tooltip.
 */
export function FieldWithHelp({
  label,
  help,
  required,
  children,
  className,
  htmlFor,
}: FieldWithHelpProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help for {label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>{help}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {children}
    </div>
  );
}
