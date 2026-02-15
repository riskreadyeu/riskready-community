"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Loader2 } from "lucide-react";
import { getControls, type Control, type ControlTheme, type ImplementationStatus } from "@/lib/controls-api";

// Implementation status: 0 = No controls, 1 = Not started, 2 = Partial, 3 = Implemented
function getStatusFromControls(controls: Control[]): number {
  if (controls.length === 0) return 0;
  const implemented = controls.filter(c => c.implementationStatus === "IMPLEMENTED").length;
  const partial = controls.filter(c => c.implementationStatus === "PARTIAL").length;
  if (implemented === controls.length) return 3;
  if (implemented > 0 || partial > 0) return 2;
  return 1;
}

function getCellStyle(status: number) {
  switch (status) {
    case 3:
      return "bg-success/80 text-success-foreground";
    case 2:
      return "bg-warning/70 text-warning-foreground";
    case 1:
      return "bg-destructive/60 text-destructive-foreground";
    default:
      return "bg-muted/30 text-muted-foreground";
  }
}

function getStatusLabel(status: number) {
  switch (status) {
    case 3:
      return "Implemented";
    case 2:
      return "In Progress";
    case 1:
      return "Not Started";
    default:
      return "N/A";
  }
}

const themeLabels: Record<string, string> = {
  ORGANISATIONAL: "Organisational",
  PEOPLE: "People",
  PHYSICAL: "Physical",
  TECHNOLOGICAL: "Technological",
};

const frameworkLabels: Record<string, string> = {
  ISO: "ISO 27001",
  SOC2: "SOC 2",
  NIS2: "NIS2",
  DORA: "DORA",
};

export function ImplementationMatrix() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [themes, setThemes] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { results: controls } = await getControls({ take: 1000 });

        // Group controls by theme × framework
        const grouped: Record<string, Record<string, Control[]>> = {};
        const themeSet = new Set<string>();
        const fwSet = new Set<string>();

        for (const control of controls) {
          const theme = control.theme;
          const fw = control.framework || "ISO";
          themeSet.add(theme);
          fwSet.add(fw);
          if (!grouped[theme]) grouped[theme] = {};
          if (!grouped[theme]![fw]) grouped[theme]![fw] = [];
          grouped[theme]![fw]!.push(control);
        }

        // Build status matrix
        const statusMatrix: Record<string, Record<string, number>> = {};
        for (const theme of themeSet) {
          statusMatrix[theme] = {};
          for (const fw of fwSet) {
            statusMatrix[theme]![fw] = getStatusFromControls(grouped[theme]?.[fw] ?? []);
          }
        }

        setThemes(Array.from(themeSet).sort());
        setFrameworks(Array.from(fwSet).sort());
        setMatrix(statusMatrix);
      } catch (err) {
        console.error("Failed to load implementation matrix:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Implementation Matrix</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">
                    Cross-reference of control themes against framework requirements showing implementation status.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success/80" />
              <span className="text-muted-foreground">Implemented</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-warning/70" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-destructive/60" />
              <span className="text-muted-foreground">Not Started</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : themes.length === 0 || frameworks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No controls available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add controls to see the implementation matrix
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className={`grid gap-1 mb-1`} style={{ gridTemplateColumns: `1fr repeat(${frameworks.length}, 1fr)` }}>
                <div className="h-10" />
                {frameworks.map((fw) => (
                  <div key={fw} className="h-10 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                    {frameworkLabels[fw] || fw}
                  </div>
                ))}
              </div>

              {themes.map((theme) => (
                <div key={theme} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `1fr repeat(${frameworks.length}, 1fr)` }}>
                  <div className="h-12 flex items-center pr-2">
                    <span className="text-xs font-medium text-foreground truncate">
                      {themeLabels[theme] || theme}
                    </span>
                  </div>
                  {frameworks.map((fw) => {
                    const status = matrix[theme]?.[fw] ?? 0;
                    return (
                      <TooltipProvider key={fw}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={`h-12 rounded-lg ${getCellStyle(status)} flex items-center justify-center text-xs font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer`}
                            >
                              {status === 3 ? "✓" : status === 2 ? "◐" : status === 1 ? "○" : "—"}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {themeLabels[theme] || theme} × {frameworkLabels[fw] || fw}: {getStatusLabel(status)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
