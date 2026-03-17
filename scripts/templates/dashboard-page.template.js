/**
 * Dashboard Page Template
 * 
 * Generates a standardized dashboard page with:
 * - Stats grid
 * - Main content area with tabs
 * - Sidebar summary
 */

function generate({ name, modulePath }) {
  return `import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// TODO: Import your API functions
// import { get${name}Stats, get${name}Summary } from "@/lib/${modulePath}-api";

export default function ${name}DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with your API calls
      // const statsData = await get${name}Stats();
      const statsData = {
        total: 0,
        active: 0,
        pending: 0,
        completed: 0,
      };
      
      setStats(statsData);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ${name} Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-primary">
                  {stats?.active || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {stats?.pending || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">
                  {stats?.completed || 0}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="glass-card lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Activity</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Last 30 days</Badge>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="overview" className="rounded-lg">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="details" className="rounded-lg">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-lg">
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Overview content goes here
                  </p>
                  {/* TODO: Add your overview content */}
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Details content goes here
                  </p>
                  {/* TODO: Add your details content */}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Analytics content goes here
                  </p>
                  {/* TODO: Add your analytics content */}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-4">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* TODO: Add summary items */}
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Metric 1</span>
                <span className="text-sm font-semibold text-foreground">100%</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Metric 2</span>
                <span className="text-sm font-semibold text-foreground">85%</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Metric 3</span>
                <span className="text-sm font-semibold text-foreground">42</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;
}

module.exports = { generate };
