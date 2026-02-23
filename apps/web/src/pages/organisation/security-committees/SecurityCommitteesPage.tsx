import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Plus, Users, Calendar, Eye, Edit3, Trash2 } from "lucide-react";
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
import { getSecurityCommittees, type SecurityCommittee } from "@/lib/organisation-api";

const committeeTypeLabels: Record<string, string> = {
  steering: "Steering",
  governance: "Governance",
  incident_response: "Incident Response",
  risk_management: "Risk Management",
  compliance: "Compliance",
  working_group: "Working Group",
  advisory: "Advisory",
};

export default function SecurityCommitteesPage() {
  const [loading, setLoading] = useState(true);
  const [committees, setCommittees] = useState<SecurityCommittee[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSecurityCommittees();
      setCommittees(data.results);
    } catch (err) {
      console.error("Error loading committees:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<SecurityCommittee>[] = [
    {
      key: "name",
      header: "Committee",
      render: (committee) => (
        <Link
          to={`/organisation/security-committees/${committee.id}`}
          className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
        >
          {committee.name}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (committee) => (
        <Badge variant="outline">
          {committeeTypeLabels[committee.committeeType] || committee.committeeType}
        </Badge>
      ),
    },
    {
      key: "chair",
      header: "Chair",
      render: (committee) =>
        committee.chair ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {committee.chair.firstName?.[0]}{committee.chair.lastName?.[0]}
            </div>
            <span className="text-sm">{committee.chair.firstName} {committee.chair.lastName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "members",
      header: "Members",
      className: "text-center",
      render: (committee) => committee._count?.memberships ?? 0,
    },
    {
      key: "frequency",
      header: "Frequency",
      className: "capitalize",
      render: (committee) => committee.meetingFrequency?.replace("_", " ") || "-",
    },
    {
      key: "nextMeeting",
      header: "Next Meeting",
      render: (committee) =>
        committee.nextMeetingDate ? (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {new Date(committee.nextMeetingDate).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (committee) => (
        <StatusBadge
          status={committee.isActive ? "Active" : "Inactive"}
          variant={committee.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<SecurityCommittee>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (committee) => `/organisation/security-committees/${committee.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => toast.info("Edit functionality not yet available"),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => toast.info("Delete functionality not yet available"),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Security Committees"
        description="Manage governance committees and memberships"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary">
            <Plus className="h-4 w-4" />
            Add Committee
          </Button>
        }
      />

      <StatCardGrid columns={3}>
        <StatCard
          title="Total Committees"
          value={committees.length}
          icon={<Shield className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={committees.filter((c) => c.isActive).length}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Total Members"
          value={committees.reduce((sum, c) => sum + (c._count?.memberships ?? 0), 0)}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-primary"
        />
      </StatCardGrid>

      <DataTable
        title="Committee Directory"
        data={committees}
        columns={columns}
        keyExtractor={(committee) => committee.id}
        searchPlaceholder="Search committees..."
        searchFilter={(committee, query) =>
          committee.name.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No committees found"
      />
    </div>
  );
}
