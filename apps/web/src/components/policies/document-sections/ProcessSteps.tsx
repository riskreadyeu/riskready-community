
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ListOrdered,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  ArrowRight,
  ArrowDown,
  FileInput,
  FileOutput,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessStepEntry } from "./types";

interface ProcessStepsProps {
  steps: ProcessStepEntry[];
  title?: string;
  className?: string;
  showRaci?: boolean;
}

export function ProcessSteps({
  steps,
  title = "Process Steps",
  className,
  showRaci = true,
}: ProcessStepsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepNumber: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(steps.map((s) => s.stepNumber)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  // Sort steps by stepNumber
  const sortedSteps = [...steps].sort((a, b) => {
    const aParts = a.stepNumber.split(".").map(Number);
    const bParts = b.stepNumber.split(".").map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) return aVal - bVal;
    }
    return 0;
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{steps.length} steps</Badge>
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedSteps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.stepNumber);
            const isMainStep = !step.stepNumber.includes(".");
            const indentLevel = step.stepNumber.split(".").length - 1;

            return (
              <div
                key={step.stepNumber}
                style={{ marginLeft: `${indentLevel * 24}px` }}
              >
                <Collapsible open={isExpanded} onOpenChange={() => toggleStep(step.stepNumber)}>
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        isExpanded
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-muted/50",
                        step.isDecisionPoint && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
                      )}
                    >
                      {/* Step Number */}
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full shrink-0 font-mono text-sm font-semibold",
                          isMainStep
                            ? "w-10 h-10 bg-primary text-primary-foreground"
                            : "w-8 h-8 bg-muted text-muted-foreground"
                        )}
                      >
                        {step.stepNumber}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{step.title}</h4>
                          {step.isDecisionPoint && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <GitBranch className="h-3 w-3 mr-1" />
                              Decision
                            </Badge>
                          )}
                        </div>
                        {!isExpanded && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Expand Icon */}
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 ml-14 space-y-4 pb-2">
                      {/* Description */}
                      <p className="text-sm whitespace-pre-wrap">{step.description}</p>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Responsible */}
                        {step.responsible && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Responsible</p>
                              <p className="text-sm">{step.responsible}</p>
                            </div>
                          </div>
                        )}

                        {/* Accountable */}
                        {step.accountable && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Accountable</p>
                              <p className="text-sm">{step.accountable}</p>
                            </div>
                          </div>
                        )}

                        {/* Duration */}
                        {step.estimatedDuration && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Duration</p>
                              <p className="text-sm">{step.estimatedDuration}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Inputs/Outputs */}
                      {((step.inputs && step.inputs.length > 0) ||
                        (step.outputs && step.outputs.length > 0)) && (
                        <div className="grid grid-cols-2 gap-4">
                          {step.inputs && step.inputs.length > 0 && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 mb-2">
                                <FileInput className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  Inputs
                                </span>
                              </div>
                              <ul className="text-sm space-y-1">
                                {step.inputs.map((input, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ArrowRight className="h-3 w-3 mt-1 text-muted-foreground" />
                                    {input}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {step.outputs && step.outputs.length > 0 && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 mb-2">
                                <FileOutput className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  Outputs
                                </span>
                              </div>
                              <ul className="text-sm space-y-1">
                                {step.outputs.map((output, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ArrowRight className="h-3 w-3 mt-1 text-muted-foreground" />
                                    {output}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Decision Options */}
                      {step.isDecisionPoint && step.decisionOptions && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                          <div className="flex items-center gap-2 mb-2">
                            <GitBranch className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase">
                              Decision Options
                            </span>
                          </div>
                          <div className="space-y-2">
                            {step.decisionOptions.map((option, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <ArrowDown className="h-3 w-3 text-amber-600" />
                                <span className="font-medium">{option.label}</span>
                                <span className="text-muted-foreground">→ Go to {option.nextStep}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Connector Line */}
                {index < sortedSteps.length - 1 && !isExpanded && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-4 bg-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
