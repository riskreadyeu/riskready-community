import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Network,
  Trash2,
  Shield,
  Clock,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Settings,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  DetailPageLayout,
  StatusBadge,
  CriticalityBadge,
  ConfirmDialog,
  HistoryTab,
  RecordActionsMenu,
  ArcherTabs,
  ArcherTabsContent,
  ArcherTabsList,
  ArcherTabsTrigger,
} from "@/components/common";
import {
  getBusinessProcess,
  type BusinessProcess,
} from "@/lib/organisation-api";

const processTypeLabels: Record<string, string> = {
  core: "Core Business",
  support: "Support",
  management: "Management",
  operational: "Operational",
};

const frequencyLabels: Record<string, string> = {
  continuous: "Continuous",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
  on_demand: "On Demand",
};

export default function BusinessProcessDetailPage() {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [process, setProcess] = useState<BusinessProcess | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (processId) {
      loadData();
    }
  }, [processId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getBusinessProcess(processId!);
      setProcess(data);
    } catch (err) {
      console.error("Error loading process:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Process not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/processes")}>
          Back to Processes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={process.name}
        description={process.description || "Business process details"}
        backLink="/organisation/processes"
        backLabel="Back to Processes"
        badges={
          <>
            <Badge variant="outline" className="font-mono text-xs">
              {process.processCode}
            </Badge>
            <CriticalityBadge level={process.criticalityLevel} />
            {process.bcpEnabled && (
              <Badge variant="default" className="bg-success">
                <Shield className="h-3 w-3 mr-1" />
                BCP Enabled
              </Badge>
            )}
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <RecordActionsMenu
              onHistory={() => {
                // History tab navigation handled by ArcherTabs
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'history');
                window.history.pushState({}, '', url);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{processTypeLabels[process.processType] || process.processType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium">{frequencyLabels[process.frequency || ""] || process.frequency || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{process.department?.name || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">
                  {process.processOwner
                    ? `${process.processOwner.firstName} ${process.processOwner.lastName}`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs defaultValue="overview" syncWithUrl className="space-y-4">
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="controls">Controls</ArcherTabsTrigger>
          <ArcherTabsTrigger value="risks">Risks</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Process Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Process Code</p>
                  <p className="font-mono">{process.processCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Automation Level</p>
                  <p className="capitalize">{process.automationLevel?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cycle Time</p>
                  <p>{process.cycleTimeHours ? `${process.cycleTimeHours} hours` : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge
                    status={process.isActive ? "Active" : "Inactive"}
                    variant={process.isActive ? "success" : "secondary"}
                  />
                </div>
              </div>
              {process.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{process.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Process Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Process Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Inputs</p>
                  {process.inputs && process.inputs.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {process.inputs.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">No inputs defined</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Outputs</p>
                  {process.outputs && process.outputs.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {process.outputs.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">No outputs defined</p>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Key Activities</p>
                {process.keyActivities && process.keyActivities.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {process.keyActivities.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No key activities defined</p>}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Stakeholders</p>
                {process.stakeholders && process.stakeholders.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {process.stakeholders.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No stakeholders defined</p>}
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance & Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Rating</p>
                  <p className="capitalize">{process.riskRating || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SOP Reference</p>
                  <p>{process.sopReference || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Review</p>
                  <p>{process.lastReviewDate ? new Date(process.lastReviewDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Review</p>
                  <p>{process.nextReviewDate ? new Date(process.nextReviewDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
              {process.complianceRequirements && process.complianceRequirements.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Compliance Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {process.complianceRequirements.map((c, i) => <Badge key={i} variant="secondary">{c}</Badge>)}
                  </div>
                </div>
              )}
              {process.improvementOpportunities && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Improvement Opportunities</p>
                  <p className="text-sm">{process.improvementOpportunities}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dependencies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">System Dependencies</p>
                  {process.systemDependencies && process.systemDependencies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {process.systemDependencies.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">None</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Supplier Dependencies</p>
                  {process.supplierDependencies && process.supplierDependencies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {process.supplierDependencies.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">None</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Critical Roles</p>
                  {process.criticalRoles && process.criticalRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {process.criticalRoles.map((r, i) => <Badge key={i} variant="secondary">{r}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">None</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Required Skills</p>
                  {process.requiredSkills && process.requiredSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {process.requiredSkills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">None</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Associated Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No controls linked to this process yet.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.info("This feature is coming soon")}>
                Link Controls
              </Button>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Associated Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No risks linked to this process yet.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.info("This feature is coming soon")}>
                Link Risks
              </Button>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={process.createdAt}
            updatedAt={process.updatedAt}
            entityType="Business Process"
          />
        </ArcherTabsContent>
      </ArcherTabs>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Process"
        description={`Are you sure you want to delete "${process.name}"? This action cannot be undone.`}
        onConfirm={() => {
          // TODO: Implement delete
          navigate("/organisation/processes");
        }}
        confirmLabel="Delete"
        variant="destructive"
      />

    </div>
  );
}
