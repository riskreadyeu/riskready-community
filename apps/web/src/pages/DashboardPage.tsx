import { Calendar, Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { RiskScoreGauge } from "@/components/dashboard/risk-score-gauge";
import { ExecutiveInsights } from "@/components/dashboard/executive-insights";
import { RiskChart } from "@/components/dashboard/risk-chart";
import { ComplianceChart } from "@/components/dashboard/compliance-chart";
import { ModuleCards } from "@/components/dashboard/module-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-8 animate-slide-up">
      <PageHeader
        title="Security Overview"
        description="Organization risk posture and compliance status"
        badge={
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            Live
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Calendar className="h-4 w-4" />
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <RiskScoreGauge />
        </div>
        <div className="lg:col-span-8">
          <MetricsOverview />
        </div>
      </div>

      <ExecutiveInsights />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskChart />
        <ComplianceChart />
      </div>

      <ModuleCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity />
        <UpcomingTasks />
      </div>
    </div>
  );
}
