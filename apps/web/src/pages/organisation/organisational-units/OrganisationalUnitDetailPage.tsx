import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Network,
  Edit3,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  Building2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  ConfirmDialog,
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import {
  getOrganisationalUnit,
  deleteOrganisationalUnit,
  type OrganisationalUnit,
} from "@/lib/organisation-api";

const unitTypeLabels: Record<string, string> = {
  division: "Division",
  department: "Department",
  team: "Team",
  unit: "Unit",
  branch: "Branch",
  section: "Section",
};

export default function OrganisationalUnitDetailPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<OrganisationalUnit | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (unitId) {
      loadData();
    }
  }, [unitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrganisationalUnit(unitId!);
      setUnit(data);
    } catch (err) {
      console.error("Error loading organisational unit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteOrganisationalUnit(unitId!);
      toast.success("Organisational unit deleted successfully");
      navigate("/organisation/organisational-units");
    } catch (err) {
      console.error("Error deleting organisational unit:", err);
      toast.error("Failed to delete organisational unit");
    } finally {
      setIsDeleting(false);
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

  if (!unit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Organisational unit not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/organisational-units")}>
          Back to Units
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={unit.name}
        description={unit.description || "Organisational unit details"}
        backLink="/organisation/organisational-units"
        backLabel="Back to Units"
        badge={
          <div className="flex gap-2">
            <StatusBadge
              status={unit.isActive ? "Active" : "Inactive"}
              variant={unit.isActive ? "success" : "secondary"}
            />
            <Badge variant="outline">
              {unitTypeLabels[unit.unitType] || unit.unitType}
            </Badge>
          </div>
        }
        actions={
          <RecordActionsMenu
            onHistory={() => {
              // History will be shown in the History tab
              const historyTab = document.querySelector('[data-value="history"]') as HTMLElement;
              historyTab?.click();
            }}
            onDelete={() => setDeleteOpen(true)}
          />
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit Code</p>
                <p className="text-sm font-medium font-mono">{unit.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit Type</p>
                <p className="text-sm font-medium">
                  {unitTypeLabels[unit.unitType] || unit.unitType}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Head</p>
                <p className="text-sm font-medium">
                  {unit.head
                    ? `${unit.head.firstName || ""} ${unit.head.lastName || ""}`.trim() || unit.head.email
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost Center</p>
                <p className="text-sm font-medium">{unit.costCenter || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ArcherTabs defaultValue="overview" className="space-y-4" syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="hierarchy">Hierarchy</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Unit Code</p>
                    <p className="text-sm font-medium font-mono">{unit.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unit Type</p>
                    <p className="text-sm font-medium">
                      {unitTypeLabels[unit.unitType] || unit.unitType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <StatusBadge
                      status={unit.isActive ? "Active" : "Inactive"}
                      variant={unit.isActive ? "success" : "secondary"}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Established</p>
                    <p className="text-sm font-medium">
                      {unit.establishedDate
                        ? new Date(unit.establishedDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
                {unit.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{unit.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost Center</p>
                    <p className="text-sm font-medium">{unit.costCenter || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium">
                      {unit.budget
                        ? `${unit.budgetCurrency} ${parseFloat(unit.budget).toLocaleString()}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leadership */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leadership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-xs text-muted-foreground">Unit Head</p>
                  <p className="text-sm font-medium">
                    {unit.head
                      ? `${unit.head.firstName || ""} ${unit.head.lastName || ""}`.trim() || unit.head.email
                      : "Not assigned"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Established</p>
                    <p className="text-sm font-medium">
                      {unit.establishedDate
                        ? new Date(unit.establishedDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(unit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ArcherTabsContent>

        <ArcherTabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-4 w-4" />
                Organisational Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Parent Unit */}
              {unit.parent && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Parent Unit</p>
                  <Link
                    to={`/organisation/organisational-units/${unit.parent.id}`}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{unit.parent.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{unit.parent.code}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Link>
                </div>
              )}

              {/* Current Unit */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Current Unit</p>
                <div className="flex items-center gap-2 p-3 border-2 border-primary rounded-lg bg-primary/5">
                  <Network className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{unit.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{unit.code}</p>
                  </div>
                </div>
              </div>

              {/* Child Units */}
              {unit.children && unit.children.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Child Units ({unit.children.length})</p>
                  <div className="space-y-2">
                    {unit.children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/organisation/organisational-units/${child.id}`}
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{child.code}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!unit.parent && (!unit.children || unit.children.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This unit has no parent or child units
                </p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            recordId={unitId!}
            recordType="OrganisationalUnit"
            recordName={unit.name}
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Organisational Unit"
        description={`Are you sure you want to delete "${unit.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
