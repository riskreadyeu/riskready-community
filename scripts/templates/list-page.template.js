/**
 * List/Register Page Template
 * 
 * Generates a standardized list page with:
 * - DataTable with pagination
 * - Filters and search
 * - Stats cards
 * - Create button
 */

function generate({ name, modulePath }) {
  const entityLower = name.toLowerCase();
  const entityPlural = `${entityLower}s`; // Simple pluralization
  
  return `import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/common/data-table";
import { Plus, Filter } from "lucide-react";

// TODO: Import your API functions
// import { get${name}s, get${name}Stats, type ${name} } from "@/lib/${modulePath}-api";

export default function ${name}RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [${entityPlural}, set${name}s] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with your API calls
      // const [data, statsData] = await Promise.all([
      //   get${name}s({
      //     skip: (currentPage - 1) * pageSize,
      //     take: pageSize,
      //     ...(statusFilter !== "all" && { status: statusFilter }),
      //   }),
      //   get${name}Stats(),
      // ]);
      
      // Placeholder data
      const data = { results: [], count: 0 };
      const statsData = { total: 0 };
      
      set${name}s(data.results);
      setTotalCount(data.count);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading ${entityPlural}:", err);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Define your columns
  const columns = [
    {
      key: "id",
      header: "ID",
      render: (item: any) => (
        <div className="font-mono text-sm font-medium">{item.id}</div>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (item: any) => (
        <div className="font-medium">{item.name}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => (
        <Badge variant="secondary">{item.status}</Badge>
      ),
    },
    // TODO: Add more columns
  ];

  const rowActions = (item: any) => [
    {
      label: "View Details",
      onClick: () => navigate(\`/${modulePath}/${entityPlural}/\${item.id}\`),
    },
    {
      label: "Edit",
      onClick: () => navigate(\`/${modulePath}/${entityPlural}/\${item.id}/edit\`),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">${name} Register</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all ${entityPlural}
          </p>
        </div>
        <Button
          onClick={() => navigate("/${modulePath}/${entityPlural}/new")}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create ${name}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* TODO: Add more stat cards */}
        </div>
      )}

      {/* Data Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>${name} List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={${entityPlural}}
            keyExtractor={(item) => item.id}
            rowActions={rowActions}
            emptyMessage="No ${entityPlural} found"
            loading={loading}
            searchPlaceholder="Search ${entityPlural}..."
            searchFilter={(item, query) => {
              const q = query.toLowerCase();
              return (
                item.name?.toLowerCase().includes(q) ||
                item.id?.toLowerCase().includes(q) ||
                false
              );
            }}
            filterSlot={
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-48 bg-secondary/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {/* TODO: Add your status options */}
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            }
            pagination={{
              page: currentPage,
              pageSize: pageSize,
              total: totalCount,
              onPageChange: setCurrentPage,
              onPageSizeChange: setPageSize,
              pageSizeOptions: [10, 25, 50, 100],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

module.exports = { generate };
