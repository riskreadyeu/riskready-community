import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Users,
  Shield,
  Calendar,
  Award,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";
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
import { getOrganisationProfiles, type OrganisationProfile } from "@/lib/organisation-api";

const certificationStatusLabels: Record<string, string> = {
  certified: "Certified",
  in_progress: "In Progress",
  planned: "Planned",
  not_started: "Not Started",
  expired: "Expired",
};

const certificationStatusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  certified: "success",
  in_progress: "warning",
  planned: "default",
  not_started: "secondary",
  expired: "destructive",
};

const sizeLabels: Record<string, string> = {
  micro: "Micro (<10)",
  small: "Small (10-49)",
  medium: "Medium (50-249)",
  large: "Large (250+)",
  enterprise: "Enterprise (1000+)",
};

export default function OrganisationProfilesPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<OrganisationProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrganisationProfiles();
      setProfiles(data.results);
    } catch (err) {
      console.error("Error loading profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<OrganisationProfile>[] = [
    {
      key: "name",
      header: "Organisation",
      render: (profile) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/profiles/${profile.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {profile.name}
          </Link>
          <span className="text-xs text-muted-foreground">{profile.legalName}</span>
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industry",
      render: (profile) => profile.industrySector || "-",
    },
    {
      key: "size",
      header: "Size",
      render: (profile) => (
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {profile.employeeCount.toLocaleString()}
            {profile.size && (
              <span className="text-muted-foreground ml-1">
                ({sizeLabels[profile.size] || profile.size})
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "certification",
      header: "ISO Certification",
      render: (profile) => (
        <StatusBadge
          status={certificationStatusLabels[profile.isoCertificationStatus] || profile.isoCertificationStatus}
          variant={certificationStatusVariants[profile.isoCertificationStatus] || "secondary"}
        />
      ),
    },
    {
      key: "certExpiry",
      header: "Cert. Expiry",
      render: (profile) =>
        profile.certificationExpiry ? (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {new Date(profile.certificationExpiry).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "nextAudit",
      header: "Next Audit",
      render: (profile) =>
        profile.nextAuditDate ? (
          <div className="flex items-center gap-1 text-sm">
            <Shield className="h-3 w-3 text-muted-foreground" />
            {new Date(profile.nextAuditDate).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  const rowActions: RowAction<OrganisationProfile>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (profile) => `/organisation/profiles/${profile.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (profile) => console.log("Edit", profile.id),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (profile) => console.log("Delete", profile.id),
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

  const certifiedCount = profiles.filter((p) => p.isoCertificationStatus === "certified").length;
  const totalEmployees = profiles.reduce((sum, p) => sum + p.employeeCount, 0);
  const upcomingAudits = profiles.filter((p) => {
    if (!p.nextAuditDate) return false;
    const auditDate = new Date(p.nextAuditDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return auditDate <= thirtyDaysFromNow;
  }).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Organisation Profiles"
        description="Manage organisation profiles and ISMS certification status"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary">
            <Plus className="h-4 w-4" />
            Add Profile
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Profiles"
          value={profiles.length}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="ISO Certified"
          value={certifiedCount}
          icon={<Award className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Total Employees"
          value={totalEmployees.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="Upcoming Audits"
          value={upcomingAudits}
          subtitle="within 30 days"
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-warning"
        />
      </StatCardGrid>

      <DataTable
        title="Organisation Profiles"
        data={profiles}
        columns={columns}
        keyExtractor={(profile) => profile.id}
        searchPlaceholder="Search profiles..."
        searchFilter={(profile, query) =>
          profile.name.toLowerCase().includes(query.toLowerCase()) ||
          profile.legalName.toLowerCase().includes(query.toLowerCase()) ||
          (profile.industrySector?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No organisation profiles found"
      />
    </div>
  );
}
