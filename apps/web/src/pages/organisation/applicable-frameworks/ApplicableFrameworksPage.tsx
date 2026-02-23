import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck, Plus, Shield, Eye, Edit3, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";

interface ApplicableFramework {
  id: string;
  frameworkCode: string;
  name: string;
  frameworkType: string;
  description?: string;
  version?: string;
  isApplicable: boolean;
  applicabilityReason?: string;
  applicabilityDate?: string;
  complianceStatus: string;
  compliancePercentage?: number;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  supervisoryAuthority?: string;
  isCertifiable: boolean;
  certificationStatus?: string;
  certificationBody?: string;
  certificateNumber?: string;
  certificationDate?: string;
  certificationExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

const frameworkTypeLabels: Record<string, string> = {
  regulation: "Regulation",
  standard: "Standard",
  framework: "Framework",
  law: "Law",
  directive: "Directive",
  guideline: "Guideline",
};

const complianceStatusLabels: Record<string, string> = {
  not_assessed: "Not Assessed",
  non_compliant: "Non-Compliant",
  partially_compliant: "Partially Compliant",
  compliant: "Compliant",
  certified: "Certified",
};

const complianceStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  not_assessed: "secondary",
  non_compliant: "destructive",
  partially_compliant: "outline",
  compliant: "default",
  certified: "default",
};

async function getApplicableFrameworks(): Promise<{ results: ApplicableFramework[]; count: number }> {
  const res = await fetch('/api/organisation/applicable-frameworks', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch applicable frameworks');
  return res.json();
}

export default function ApplicableFrameworksPage() {
  const [loading, setLoading] = useState(true);
  const [frameworks, setFrameworks] = useState<ApplicableFramework[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getApplicableFrameworks();
      setFrameworks(data.results);
    } catch (err) {
      console.error("Error loading applicable frameworks:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<ApplicableFramework>[] = [
    {
      key: "frameworkCode",
      header: "Code",
      render: (fw) => (
        <span className="font-mono text-xs text-muted-foreground">{fw.frameworkCode}</span>
      ),
    },
    {
      key: "name",
      header: "Framework",
      render: (fw) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/applicable-frameworks/${fw.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {fw.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {frameworkTypeLabels[fw.frameworkType] || fw.frameworkType}
            {fw.version && ` v${fw.version}`}
          </span>
        </div>
      ),
    },
    {
      key: "isApplicable",
      header: "Applicable",
      className: "text-center",
      render: (fw) => (
        <div className="flex justify-center">
          {fw.isApplicable ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "complianceStatus",
      header: "Compliance",
      render: (fw) => (
        <Badge variant={complianceStatusVariants[fw.complianceStatus] || "secondary"}>
          {complianceStatusLabels[fw.complianceStatus] || fw.complianceStatus}
        </Badge>
      ),
    },
    {
      key: "compliancePercentage",
      header: "Progress",
      render: (fw) =>
        fw.compliancePercentage !== undefined ? (
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={fw.compliancePercentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-8">{fw.compliancePercentage}%</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "supervisoryAuthority",
      header: "Authority",
      render: (fw) =>
        fw.supervisoryAuthority ? (
          <span className="text-sm">{fw.supervisoryAuthority}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "nextAssessment",
      header: "Next Assessment",
      render: (fw) =>
        fw.nextAssessmentDate ? (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{new Date(fw.nextAssessmentDate).toLocaleDateString()}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
  ];

  const rowActions: RowAction<ApplicableFramework>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (fw) => `/organisation/applicable-frameworks/${fw.id}`,
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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const applicableCount = frameworks.filter((f) => f.isApplicable).length;
  const compliantCount = frameworks.filter((f) => f.complianceStatus === "compliant" || f.complianceStatus === "certified").length;
  const certifiedCount = frameworks.filter((f) => f.certificationStatus === "certified").length;
  const avgCompliance = frameworks.length > 0
    ? Math.round(frameworks.reduce((sum, f) => sum + (f.compliancePercentage || 0), 0) / frameworks.length)
    : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Applicable Frameworks"
        description="Regulatory profile and compliance frameworks"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary">
            <Plus className="h-4 w-4" />
            Add Framework
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Frameworks"
          value={frameworks.length}
          icon={<FileCheck className="h-4 w-4" />}
        />
        <StatCard
          title="Applicable"
          value={applicableCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Compliant"
          value={compliantCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="Avg. Compliance"
          value={`${avgCompliance}%`}
          icon={<FileCheck className="h-4 w-4" />}
          iconClassName="text-amber-500"
        />
      </StatCardGrid>

      <DataTable
        title="Framework Registry"
        data={frameworks}
        columns={columns}
        keyExtractor={(fw) => fw.id}
        searchPlaceholder="Search frameworks..."
        searchFilter={(fw, query) =>
          fw.name.toLowerCase().includes(query.toLowerCase()) ||
          fw.frameworkCode.toLowerCase().includes(query.toLowerCase()) ||
          fw.frameworkType.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No applicable frameworks found"
      />
    </div>
  );
}
