import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, AlertTriangle, Eye, Edit3, Trash2 } from "lucide-react";
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
  CriticalityBadge,
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";
import { getExternalDependencies, getDependencyRiskAssessment, type ExternalDependency } from "@/lib/organisation-api";

const typeLabels: Record<string, string> = {
  cloud_service_provider: "Cloud Provider",
  saas_application: "SaaS",
  data_processor: "Data Processor",
  critical_supplier: "Critical Supplier",
  outsourced_function: "Outsourced",
  professional_service: "Professional Service",
  infrastructure_provider: "Infrastructure",
  business_partner: "Business Partner",
};

export default function ExternalDependenciesPage() {
  const [loading, setLoading] = useState(true);
  const [dependencies, setDependencies] = useState<ExternalDependency[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [riskData, setRiskData] = useState<{ total: number; singlePointOfFailure: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depsData, riskAssessment] = await Promise.all([
        getExternalDependencies(),
        getDependencyRiskAssessment(),
      ]);
      setDependencies(depsData.results);
      setRiskData(riskAssessment);
    } catch (err) {
      console.error("Error loading dependencies:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDependencies = typeFilter === "all"
    ? dependencies
    : dependencies.filter((d) => d.dependencyType === typeFilter);

  const columns: Column<ExternalDependency>[] = [
    {
      key: "name",
      header: "Dependency",
      render: (dep) => (
        <Link
          to={`/organisation/dependencies/${dep.id}`}
          className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
        >
          {dep.name}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (dep) => (
        <Badge variant="outline">{typeLabels[dep.dependencyType] || dep.dependencyType}</Badge>
      ),
    },
    {
      key: "criticality",
      header: "Criticality",
      className: "text-center",
      render: (dep) => <CriticalityBadge level={dep.criticalityLevel} />,
    },
    {
      key: "contractEnd",
      header: "Contract End",
      render: (dep) => new Date(dep.contractEnd).toLocaleDateString(),
    },
    {
      key: "annualCost",
      header: "Annual Cost",
      className: "text-right",
      render: (dep) => dep.annualCost ? `$${Number(dep.annualCost).toLocaleString()}` : "-",
    },
    {
      key: "spof",
      header: "SPOF",
      className: "text-center",
      render: (dep) => (
        <StatusBadge
          status={dep.singlePointOfFailure ? "Yes" : "No"}
          variant={dep.singlePointOfFailure ? "destructive" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<ExternalDependency>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (dep) => `/organisation/dependencies/${dep.id}`,
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
        title="External Dependencies"
        description="Manage vendors, suppliers, and third-party services"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary">
            <Plus className="h-4 w-4" />
            Add Dependency
          </Button>
        }
      />

      <StatCardGrid columns={3}>
        <StatCard
          title="Total Dependencies"
          value={riskData?.total ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="Single Point of Failure"
          value={riskData?.singlePointOfFailure ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
        <StatCard
          title="Critical"
          value={dependencies.filter((d) => d.criticalityLevel === "critical").length}
          icon={<FileText className="h-4 w-4" />}
          iconClassName="text-destructive"
        />
      </StatCardGrid>

      <DataTable
        title="Dependency Registry"
        data={filteredDependencies}
        columns={columns}
        keyExtractor={(dep) => dep.id}
        searchPlaceholder="Search dependencies..."
        searchFilter={(dep, query) =>
          dep.name.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No dependencies found"
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cloud_service_provider">Cloud Provider</SelectItem>
              <SelectItem value="saas_application">SaaS</SelectItem>
              <SelectItem value="data_processor">Data Processor</SelectItem>
              <SelectItem value="professional_service">Professional Service</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
