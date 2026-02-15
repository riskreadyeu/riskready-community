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
  type Column,
  type RowAction,
} from "@/components/common";

interface SecurityChampion {
  id: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  department: {
    id: string;
    name: string;
    departmentCode: string;
  };
  championRole: string;
  certificationLevel?: string;
  specializations?: string[];
  isActive: boolean;
  appointmentDate: string;
  createdAt: string;
  updatedAt: string;
}

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

async function getSecurityChampions(): Promise<{ results: SecurityChampion[]; count: number }> {
  const res = await fetch('/api/organisation/security-champions', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch security champions');
  return res.json();
}

export default function SecurityChampionsPage() {
  const [loading, setLoading] = useState(true);
  const [champions, setChampions] = useState<SecurityChampion[]>([]);

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

  const columns: Column<SecurityChampion>[] = [
    {
      key: "user",
      header: "Champion",
      render: (champion) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {champion.user.firstName?.[0]}{champion.user.lastName?.[0]}
          </div>
          <div className="flex flex-col">
            <Link
              to={`/organisation/security-champions/${champion.id}`}
              className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
            >
              {champion.user.firstName} {champion.user.lastName}
            </Link>
            <span className="text-xs text-muted-foreground">{champion.user.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (champion) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{champion.department.name}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (champion) => (
        <Badge variant="outline">
          {championRoleLabels[champion.championRole] || champion.championRole}
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
      render: (champion) => new Date(champion.appointmentDate).toLocaleDateString(),
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
      onClick: (champion) => console.log("Edit", champion.id),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (champion) => console.log("Delete", champion.id),
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
          (champion.user.firstName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (champion.user.lastName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          champion.department.name.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No security champions found"
      />
    </div>
  );
}
