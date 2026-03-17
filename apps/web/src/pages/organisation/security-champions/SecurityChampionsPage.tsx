import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Plus, Building2, Eye, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  StatCard,
  StatCardGrid,
  ConfirmDialog,
  type Column,
  type RowAction,
} from "@/components/common";
import {
  getSecurityChampions,
  deleteSecurityChampion,
  type SecurityChampion,
} from "@/lib/organisation-api";

const championRoleLabels: Record<string, string> = {
  primary: "Primary",
  backup: "Backup",
  specialist: "Specialist",
  coordinator: "Coordinator",
};

const certificationLevelLabels: Record<string, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const certificationLevelVariants: Record<string, "default" | "secondary"> = {
  basic: "secondary",
  intermediate: "secondary",
  advanced: "default",
  expert: "default",
};

export default function SecurityChampionsPage() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<SecurityChampion[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingChampion, setDeletingChampion] = useState<SecurityChampion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSecurityChampions();
      setChampions(data.results);
    } catch (err) {
      console.error("Error loading security champions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (champion: SecurityChampion) => {
    setDeletingChampion(champion);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingChampion) return;
    try {
      setIsDeleting(true);
      await deleteSecurityChampion(deletingChampion.id);
      toast.success("Security champion deleted successfully");
      setDeleteOpen(false);
      setDeletingChampion(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting security champion:", err);
      toast.error("Failed to delete security champion");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<SecurityChampion>[] = [
    {
      key: "user",
      header: "Champion",
      render: (champion) => {
        const initials = `${champion.user?.firstName?.[0] || ""}${champion.user?.lastName?.[0] || ""}` || "SC";
        const name = `${champion.user?.firstName || ""} ${champion.user?.lastName || ""}`.trim() || champion.user?.email || "Unknown Champion";
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              {initials}
            </div>
            <div className="flex flex-col">
              <Link
                to={`/organisation/security-champions/${champion.id}`}
                className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
              >
                {name}
              </Link>
              <span className="text-xs text-muted-foreground">{champion.user?.email || "-"}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "department",
      header: "Department",
      render: (champion) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{champion.department?.name || "-"}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (champion) => (
        <Badge variant="outline">
          {championRoleLabels[champion.championRole || ""] || champion.championRole || "-"}
        </Badge>
      ),
    },
    {
      key: "certification",
      header: "Certification",
      render: (champion) =>
        champion.certificationLevel ? (
          <Badge variant={certificationLevelVariants[champion.certificationLevel] || "secondary"}>
            {certificationLevelLabels[champion.certificationLevel] || champion.certificationLevel}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "specializations",
      header: "Specializations",
      render: (champion) =>
        champion.specializations && champion.specializations.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {champion.specializations.slice(0, 2).map((spec, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {champion.specializations.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{champion.specializations.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "appointmentDate",
      header: "Appointed",
      render: (champion) => champion.appointmentDate ? new Date(champion.appointmentDate).toLocaleDateString() : "-",
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (champion) => (
        <StatusBadge
          status={champion.isActive ? "Active" : "Inactive"}
          variant={champion.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<SecurityChampion>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (champion) => `/organisation/security-champions/${champion.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      href: (champion) => `/organisation/security-champions/${champion.id}`,
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (champion) => handleDeleteClick(champion),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const activeCount = champions.filter((c) => c.isActive).length;
  const primaryCount = champions.filter((c) => c.championRole === "primary").length;
  const certifiedCount = champions.filter((c) => c.certificationLevel).length;
  const deletingChampionName = deletingChampion?.user
    ? `${deletingChampion.user.firstName || ""} ${deletingChampion.user.lastName || ""}`.trim()
    : "";

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Security Champions"
        description="Manage departmental security champions and their certifications"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={() => toast.info("Add champion feature coming soon")}>
            <Plus className="h-4 w-4" />
            Add Champion
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Champions"
          value={champions.length}
          icon={<Shield className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Primary Champions"
          value={primaryCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="Certified"
          value={certifiedCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-amber-500"
        />
      </StatCardGrid>

      <DataTable
        title="Champion Directory"
        data={champions}
        columns={columns}
        keyExtractor={(champion) => champion.id}
        searchPlaceholder="Search champions..."
        searchFilter={(champion, query) =>
          (champion.user?.firstName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (champion.user?.lastName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (champion.user?.email?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (champion.department?.name?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No security champions found"
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Security Champion"
        description={
          deletingChampionName
            ? `Are you sure you want to remove "${deletingChampionName}" as a security champion? This action cannot be undone.`
            : "Are you sure you want to remove this security champion? This action cannot be undone."
        }
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
