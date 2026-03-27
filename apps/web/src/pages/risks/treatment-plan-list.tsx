// =============================================================================
// Treatment Plan List Page
// =============================================================================
// List page for risk treatment plans with filtering and progress tracking

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Target,
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Archer Components
import { EmptyState, ListPageLayout } from "@/components/archer";

// API
import {
  getTreatmentPlans,
  type TreatmentPlan,
} from "@/lib/risks-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


// Shared Constants
import {
  treatmentStatusColors,
  treatmentStatusLabels,
  treatmentTypeColors,
  treatmentTypeLabels,
} from "./_shared";

export function TreatmentPlanListV2Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTreatmentPlans({ take: 200 });
      setPlans(data.results);
    } catch (err) {
      console.error("Error loading treatment plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.treatmentType !== typeFilter) return false;
      return true;
    });
  }, [plans, statusFilter, typeFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const total = plans.length;
    const inProgress = plans.filter((p) => p.status === "IN_PROGRESS").length;
    const completed = plans.filter((p) => p.status === "COMPLETED").length;
    const overdue = plans.filter((p) => {
      if (!p.targetEndDate || p.status === "COMPLETED" || p.status === "CANCELLED") return false;
      return new Date(p.targetEndDate) < new Date();
    }).length;
    return { total, inProgress, completed, overdue };
  }, [plans]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Treatment Plans"
      description="Manage risk treatment plans and track their progress"
      breadcrumbs={[
        { label: "Risks", href: "/risks" },
        { label: "Treatment Plans" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate("/risks/treatments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      }
      filters={
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PROPOSED">Proposed</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MITIGATE">Mitigate</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
              <SelectItem value="ACCEPT">Accept</SelectItem>
              <SelectItem value="AVOID">Avoid</SelectItem>
              <SelectItem value="SHARE">Share</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(stats.overdue > 0 && "border-red-500")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title="No Treatment Plans Found"
          description={
            statusFilter !== "all" || typeFilter !== "all"
              ? "No plans match your current filters."
              : "Get started by creating your first treatment plan."
          }
          action={{
            label: "New Plan",
            onClick: () => navigate("/risks/treatments/new"),
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isOverdue =
              plan.targetEndDate &&
              plan.status !== "COMPLETED" &&
              plan.status !== "CANCELLED" &&
              new Date(plan.targetEndDate) < new Date();

            return (
              <Card
                key={plan.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  isOverdue && "border-red-500"
                )}
                onClick={() => navigate(`/risks/treatments/${plan.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-mono text-muted-foreground">
                          {plan.treatmentId}
                        </p>
                        <Badge
                          variant="outline"
                          className={treatmentTypeColors[plan.treatmentType]}
                        >
                          {treatmentTypeLabels[plan.treatmentType]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={treatmentStatusColors[plan.status]}
                        >
                          {treatmentStatusLabels[plan.status]}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      <h3 className="font-medium truncate">{plan.title}</h3>
                      {plan.risk && (
                        <p className="text-sm text-muted-foreground truncate">
                          Risk: {plan.risk.title}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {plan.targetEndDate && (
                        <p className="text-sm">
                          Due: {new Date(plan.targetEndDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {plan._count?.actions || 0} actions
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{plan.progressPercentage}%</span>
                    </div>
                    <Progress value={plan.progressPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </ListPageLayout>
  );
}
