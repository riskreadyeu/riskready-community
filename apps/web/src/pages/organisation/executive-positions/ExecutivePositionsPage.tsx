import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Plus, Users, Eye, Edit3, Trash2 } from "lucide-react";
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
import { getExecutivePositions, type ExecutivePosition } from "@/lib/organisation-api";

const executiveLevelLabels: Record<string, string> = {
  c_level: "C-Level",
  vp: "Vice President",
  director: "Director",
  senior_manager: "Senior Manager",
  board: "Board Member",
};

const executiveLevelVariants: Record<string, "default" | "secondary"> = {
  c_level: "default",
  board: "default",
  vp: "secondary",
  director: "secondary",
  senior_manager: "secondary",
};

export default function ExecutivePositionsPage() {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<ExecutivePosition[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getExecutivePositions();
      setPositions(data.results);
    } catch (err) {
      console.error("Error loading executive positions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = levelFilter === "all"
    ? positions
    : positions.filter((p) => p.executiveLevel === levelFilter);

  const columns: Column<ExecutivePosition>[] = [
    {
      key: "title",
      header: "Position",
      render: (position) => (
        <div className="flex items-center gap-2">
          {position.isCeo && <Crown className="h-4 w-4 text-amber-500" />}
          <Link
            to={`/organisation/executive-positions/${position.id}`}
            className="font-medium text-foreground group-hover:text-primary transition-colors hover:underline"
          >
            {position.title}
          </Link>
        </div>
      ),
    },
    {
      key: "level",
      header: "Level",
      render: (position) => (
        <Badge variant={executiveLevelVariants[position.executiveLevel] || "secondary"}>
          {executiveLevelLabels[position.executiveLevel] || position.executiveLevel}
        </Badge>
      ),
    },
    {
      key: "person",
      header: "Incumbent",
      render: (position) =>
        position.person ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              {position.person.firstName?.[0]}{position.person.lastName?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {position.person.firstName} {position.person.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{position.person.email}</span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">Vacant</span>
        ),
    },
    {
      key: "authority",
      header: "Authority Level",
      render: (position) => position.authorityLevel || "-",
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (position) => new Date(position.startDate).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (position) => (
        <StatusBadge
          status={position.isActive ? "Active" : "Inactive"}
          variant={position.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<ExecutivePosition>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      href: (position) => `/organisation/executive-positions/${position.id}`,
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

  const cLevelCount = positions.filter((p) => p.executiveLevel === "c_level").length;
  const vacantCount = positions.filter((p) => !p.person).length;
  const activeCount = positions.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Executive Positions"
        description="Manage executive leadership and organizational hierarchy"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={() => toast.info("Create records via Claude Code or Claude Desktop using MCP tools")}>
            <Plus className="h-4 w-4" />
            Add Position
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Positions"
          value={positions.length}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="C-Level"
          value={cLevelCount}
          icon={<Crown className="h-4 w-4" />}
          iconClassName="text-amber-500"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Vacant"
          value={vacantCount}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-warning"
        />
      </StatCardGrid>

      <DataTable
        title="Executive Directory"
        data={filteredPositions}
        columns={columns}
        keyExtractor={(position) => position.id}
        searchPlaceholder="Search positions..."
        searchFilter={(position, query) =>
          position.title.toLowerCase().includes(query.toLowerCase()) ||
          (position.person?.firstName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (position.person?.lastName?.toLowerCase().includes(query.toLowerCase()) ?? false)
        }
        rowActions={rowActions}
        emptyMessage="No executive positions found"
        filterSlot={
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-transparent">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="c_level">C-Level</SelectItem>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="vp">Vice President</SelectItem>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="senior_manager">Senior Manager</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
