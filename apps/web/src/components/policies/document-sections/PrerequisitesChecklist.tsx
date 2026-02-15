"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrerequisiteEntry } from "./types";

interface PrerequisitesChecklistProps {
  prerequisites: PrerequisiteEntry[];
  title?: string;
  className?: string;
  interactive?: boolean;
  checkedItems?: Set<string>;
  onToggle?: (id: string) => void;
}

export function PrerequisitesChecklist({
  prerequisites,
  title = "Prerequisites",
  className,
  interactive = false,
  checkedItems = new Set(),
  onToggle,
}: PrerequisitesChecklistProps) {
  // Group by category
  const grouped = prerequisites.reduce((acc, prereq) => {
    const category = prereq.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(prereq);
    return acc;
  }, {} as Record<string, PrerequisiteEntry[]>);

  const mandatoryCount = prerequisites.filter((p) => p.isMandatory).length;
  const optionalCount = prerequisites.length - mandatoryCount;
  const checkedCount = checkedItems.size;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {mandatoryCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {mandatoryCount} mandatory
              </Badge>
            )}
            {optionalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {optionalCount} optional
              </Badge>
            )}
            {interactive && (
              <Badge variant="outline" className="text-xs">
                {checkedCount}/{prerequisites.length} complete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              {/* Category Header */}
              {Object.keys(grouped).length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                {items.map((prereq, index) => {
                  const itemId = prereq.id || `${category}-${index}`;
                  const isChecked = checkedItems.has(itemId);

                  return (
                    <div
                      key={itemId}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        interactive && "cursor-pointer hover:bg-muted/50",
                        isChecked && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                      )}
                      onClick={() => interactive && onToggle?.(itemId)}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0 mt-0.5">
                        {interactive ? (
                          isChecked ? (
                            <CheckSquare className="h-5 w-5 text-green-600" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )
                        ) : (
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center",
                              prereq.isMandatory
                                ? "border-destructive"
                                : "border-muted-foreground/50"
                            )}
                          >
                            {prereq.isMandatory && (
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            isChecked && "line-through text-muted-foreground"
                          )}
                        >
                          {prereq.item}
                        </p>
                      </div>

                      {/* Mandatory Indicator */}
                      {prereq.isMandatory && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Required
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Completion Warning */}
        {interactive && mandatoryCount > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Prerequisites Check
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  All mandatory prerequisites must be completed before proceeding with
                  this procedure.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
