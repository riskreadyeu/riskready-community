"use client";

import { ControlEffectivenessGauge } from "./control-effectiveness-gauge";
import { ControlHeader } from "./control-header";
import { ControlInsights } from "./control-insights";
import { ControlLibrary } from "./control-library";
import { ControlMaturityRadar } from "./control-maturity-radar";
import { ControlMetrics } from "./control-metrics";
import { ControlTestResults } from "./control-test-results";
import { FrameworkCoverage } from "./framework-coverage";
import { ImplementationMatrix } from "./implementation-matrix";
import { IssuesExceptions } from "./issues-exceptions";

export function ControlManagementContent() {
  return (
    <div className="space-y-6 animate-slide-up">
      <ControlHeader />
      <ControlInsights />
      <ControlMetrics />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4">
          <ControlEffectivenessGauge />
        </div>
        <div className="xl:col-span-4">
          <ControlMaturityRadar />
        </div>
        <div className="xl:col-span-4">
          <FrameworkCoverage />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ImplementationMatrix />
        </div>
        <div>
          <ControlTestResults />
        </div>
      </div>

      <IssuesExceptions />
      <ControlLibrary />
    </div>
  );
}
