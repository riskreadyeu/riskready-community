
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TestResult } from "./types";
import { TEST_RESULT_COLORS } from "./types";

interface EffectivenessIndicatorProps {
  design?: TestResult;
  implementation?: TestResult;
  operating?: TestResult;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const TestIcon = ({ result, size }: { result?: TestResult; size: number }) => {
  const iconProps = { className: cn("shrink-0", TEST_RESULT_COLORS[result || 'NOT_TESTED']), size };
  
  switch (result) {
    case 'PASS':
      return <CheckCircle2 {...iconProps} />;
    case 'PARTIAL':
      return <AlertTriangle {...iconProps} />;
    case 'FAIL':
      return <XCircle {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
};

export function EffectivenessIndicator({
  design = 'NOT_TESTED',
  implementation = 'NOT_TESTED',
  operating = 'NOT_TESTED',
  size = 'md',
  showLabels = false,
  className,
}: EffectivenessIndicatorProps) {
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const gap = size === 'sm' ? 'gap-0.5' : size === 'lg' ? 'gap-2' : 'gap-1';
  
  const tests = [
    { key: 'design', label: 'Design', result: design },
    { key: 'implementation', label: 'Implementation', result: implementation },
    { key: 'operating', label: 'Operating', result: operating },
  ];

  return (
    <TooltipProvider>
      <div className={cn("flex items-center", gap, className)}>
        {tests.map(({ key, label, result }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center",
                showLabels && "gap-1"
              )}>
                <TestIcon result={result} size={iconSize} />
                {showLabels && (
                  <span className={cn(
                    "text-xs",
                    TEST_RESULT_COLORS[result || 'NOT_TESTED']
                  )}>
                    {label[0]}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{label} Effectiveness</p>
              <p className={TEST_RESULT_COLORS[result || 'NOT_TESTED']}>
                {result === 'PASS' && '✓ Pass'}
                {result === 'PARTIAL' && '⚠ Partial'}
                {result === 'FAIL' && '✗ Fail'}
                {result === 'NOT_TESTED' && '○ Not Tested'}
                {result === 'NOT_APPLICABLE' && '- N/A'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

interface EffectivenessBarProps {
  design?: TestResult;
  implementation?: TestResult;
  operating?: TestResult;
  className?: string;
}

export function EffectivenessBar({
  design = 'NOT_TESTED',
  implementation = 'NOT_TESTED',
  operating = 'NOT_TESTED',
  className,
}: EffectivenessBarProps) {
  const getBarColor = (result?: TestResult) => {
    switch (result) {
      case 'PASS': return 'bg-success';
      case 'PARTIAL': return 'bg-warning';
      case 'FAIL': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("flex h-2 w-full rounded-full overflow-hidden gap-0.5", className)}>
        {[
          { key: 'design', label: 'Design', result: design },
          { key: 'implementation', label: 'Implementation', result: implementation },
          { key: 'operating', label: 'Operating', result: operating },
        ].map(({ key, label, result }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <div className={cn("flex-1 transition-colors", getBarColor(result))} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{label}: {result || 'Not Tested'}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
