import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Scale, Plus, Globe, Calendar, Eye, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";
import { getRegulators, getComplianceDashboard, type Regulator } from "@/lib/organisation-api";

const regulatorTypeLabels: Record<string, string> = {
  financial: "Financial",
  data_protection: "Data Protection",
  industry_specific: "Industry Specific",
  government: "Government",
  standards_body: "Standards Body",
  certification_body: "Certification Body",
};

const registrationStatusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  registered: "success",
  pending: "warning",
  exempt: "secondary",
  not_applicable: "secondary",
  suspended: "destructive",
};

export default function RegulatorsPage() {
  const [loading, setLoading] = useState(true);
  const [regulators, setRegulators] = useState<Regulator[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [complianceData, setComplianceData] = useState<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    upcomingInspections: Array<{ id: string; name: string; acronym?: string; nextInspectionDate: string }>;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regulatorsData, complianceDataRes] = await Promise.all([
        getRegulators(),
        getComplianceDashboard(),
      ]);
      setRegulators(regulatorsData.results);
      setComplianceData(complianceDataRes);
    } catch (err) {
      console.error("Error loading regulators:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRegulators = typeFilter === "all"
    ? regulators
    : regulators.filter((r) => r.regulatorType === typeFilter);

  const columns: Column<Regulator>[] = [
    {
      key: "name",
      header: "Regulator",
      render: (regulator) => (
        <div className="flex flex-col">
          <Link
            to={`/organisation/regulators/${regulator.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {regulator.name}
          </Link>
          {regulator.acronym && (
            <span className="text-xs text-muted-foreground">{regulator.acronym}</span>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (regulator) => (
        <Badge variant="outline">
          {regulatorTypeLabels[regulator.regulatorType] || regulator.regulatorType}
        </Badge>
      ),
    },
    {
      key: "jurisdiction",
      header: "Jurisdiction",
      render: (regulator) => (
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{regulator.jurisdiction}</span>
        </div>
      ),
    },
    {
      key: "registrationStatus",
      header: "Registration",
      className: "text-center",
      render: (regulator) => (
        <StatusBadge
          status={regulator.registrationStatus?.replace("_", " ") || "unknown"}
          variant={registrationStatusVariants[regulator.registrationStatus] || "secondary"}
        />
      ),
    },
    {
      key: "reportingFrequency",
      header: "Reporting",
      className: "capitalize",
      render: (regulator) => regulator.reportingFrequency?.replace("_", " ") || "-",
    },
    {
      key: "nextInspection",
      header: "Next Inspection",
      render: (regulator) =>
        regulator.nextInspectionDate ? (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {new Date(regulator.nextInspectionDate).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (regulator) => (
        <StatusBadge
          status={regulator.isActive ? "Active" : "Inactive"}
          variant={regulator.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<Regulator>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (regulator) => `/organisation/regulators/${regulator.id}`,
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

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Regulators"
        description="Manage regulatory bodies and compliance obligations"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary">
            <Plus className="h-4 w-4" />
            Add Regulator
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Regulators"
          value={complianceData?.total ?? 0}
          icon={<Scale className="h-4 w-4" />}
        />
        <StatCard
          title="Registered"
          value={complianceData?.byStatus?.['registered'] ?? 0}
          icon={<Scale className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Pending"
          value={complianceData?.byStatus?.['pending'] ?? 0}
          icon={<Scale className="h-4 w-4" />}
          iconClassName="text-warning"
        />
        <StatCard
          title="Upcoming Inspections"
          value={complianceData?.upcomingInspections?.length ?? 0}
          icon={<Calendar className="h-4 w-4" />}
          iconClassName="text-primary"
        />
      </StatCardGrid>

      <DataTable
        title="Regulator Registry"
        data={filteredRegulators}
        columns={columns}
        keyExtractor={(regulator) => regulator.id}
        searchPlaceholder="Search regulators..."
        searchFilter={(regulator, query) =>
          regulator.name.toLowerCase().includes(query.toLowerCase()) ||
          (regulator.acronym?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No regulators found"
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="data_protection">Data Protection</SelectItem>
              <SelectItem value="industry_specific">Industry Specific</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="standards_body">Standards Body</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
