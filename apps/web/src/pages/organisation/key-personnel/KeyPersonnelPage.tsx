import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Shield, Eye, Edit3, Trash2, UserCheck, GraduationCap } from "lucide-react";
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

interface KeyPerson {
  id: string;
  personCode: string;
  name: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  ismsRole: string;
  securityResponsibilities?: string;
  authorityLevel?: string;
  backupPerson?: {
    id: string;
    personCode: string;
    name: string;
    jobTitle: string;
  };
  trainingCompleted: boolean;
  lastTrainingDate?: string;
  certifications?: string[];
  isActive: boolean;
  startDate?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ismsRoleLabels: Record<string, string> = {
  isms_owner: "ISMS Owner",
  isms_manager: "ISMS Manager",
  ciso: "CISO",
  dpo: "Data Protection Officer",
  risk_owner: "Risk Owner",
  asset_owner: "Asset Owner",
  control_owner: "Control Owner",
  internal_auditor: "Internal Auditor",
  security_officer: "Security Officer",
  compliance_officer: "Compliance Officer",
  it_manager: "IT Manager",
  hr_manager: "HR Manager",
  legal_counsel: "Legal Counsel",
  executive_sponsor: "Executive Sponsor",
};

const authorityLevelVariants: Record<string, "default" | "secondary" | "outline"> = {
  executive: "default",
  management: "secondary",
  operational: "outline",
};

async function getKeyPersonnel(): Promise<{ results: KeyPerson[]; count: number }> {
  const res = await fetch('/api/organisation/key-personnel', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch key personnel');
  return res.json();
}

export default function KeyPersonnelPage() {
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<KeyPerson[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getKeyPersonnel();
      setPersonnel(data.results);
    } catch (err) {
      console.error("Error loading key personnel:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<KeyPerson>[] = [
    {
      key: "personCode",
      header: "Code",
      render: (person) => (
        <span className="font-mono text-xs text-muted-foreground">{person.personCode}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (person) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex flex-col">
            <Link
              to={`/organisation/key-personnel/${person.id}`}
              className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
            >
              {person.name}
            </Link>
            <span className="text-xs text-muted-foreground">{person.jobTitle}</span>
          </div>
        </div>
      ),
    },
    {
      key: "ismsRole",
      header: "ISMS Role",
      render: (person) => (
        <Badge variant="outline" className="bg-primary/5">
          {ismsRoleLabels[person.ismsRole] || person.ismsRole}
        </Badge>
      ),
    },
    {
      key: "authorityLevel",
      header: "Authority",
      render: (person) =>
        person.authorityLevel ? (
          <Badge variant={authorityLevelVariants[person.authorityLevel] || "secondary"}>
            {person.authorityLevel.charAt(0).toUpperCase() + person.authorityLevel.slice(1)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "backupPerson",
      header: "Backup",
      render: (person) =>
        person.backupPerson ? (
          <div className="flex items-center gap-2">
            <UserCheck className="h-3 w-3 text-success" />
            <span className="text-sm">{person.backupPerson.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No backup</span>
        ),
    },
    {
      key: "training",
      header: "Training",
      render: (person) => (
        <div className="flex items-center gap-2">
          {person.trainingCompleted ? (
            <>
              <GraduationCap className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">
                {person.lastTrainingDate
                  ? new Date(person.lastTrainingDate).toLocaleDateString()
                  : "Completed"}
              </span>
            </>
          ) : (
            <span className="text-sm text-warning">Pending</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (person) => (
        <StatusBadge
          status={person.isActive ? "Active" : "Inactive"}
          variant={person.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<KeyPerson>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (person) => `/organisation/key-personnel/${person.id}`,
    },
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (person) => console.log("Edit", person.id),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (person) => console.log("Delete", person.id),
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

  const activeCount = personnel.filter((p) => p.isActive).length;
  const trainedCount = personnel.filter((p) => p.trainingCompleted).length;
  const withBackupCount = personnel.filter((p) => p.backupPerson).length;
  const uniqueRoles = new Set(personnel.map((p) => p.ismsRole)).size;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Key Personnel"
        description="ISMS roles and security responsibilities"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary">
            <Plus className="h-4 w-4" />
            Add Personnel
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Personnel"
          value={personnel.length}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Training Completed"
          value={trainedCount}
          icon={<GraduationCap className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="With Backup"
          value={withBackupCount}
          icon={<UserCheck className="h-4 w-4" />}
          iconClassName="text-amber-500"
        />
      </StatCardGrid>

      <DataTable
        title="Personnel Directory"
        data={personnel}
        columns={columns}
        keyExtractor={(person) => person.id}
        searchPlaceholder="Search personnel..."
        searchFilter={(person, query) =>
          person.name.toLowerCase().includes(query.toLowerCase()) ||
          person.jobTitle.toLowerCase().includes(query.toLowerCase()) ||
          person.ismsRole.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No key personnel found"
      />
    </div>
  );
}
