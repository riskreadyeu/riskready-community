"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Link2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, DataTable, Column, RowAction } from "@/components/common";
import { cn } from "@/lib/utils";
import { getControlCoverageReport } from "@/lib/policies-api";

// Coverage level indicators
const coverageBadges: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  FULL: { label: "Full", color: "bg-green-500/10 text-green-500 border-green-500/30", icon: CheckCircle2 },
  PARTIAL: { label: "Partial", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: AlertTriangle },
  MINIMAL: { label: "Minimal", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: AlertTriangle },
  NONE: { label: "None", color: "bg-red-500/10 text-red-500 border-red-500/30", icon: XCircle },
};

interface ControlCoverage {
  controlId: string;
  controlName: string;
  theme: string;
  category: string;
  coverage: "FULL" | "PARTIAL" | "MINIMAL" | "NONE";
  documentCount: number;
  documents: Array<{
    id: string;
    documentId: string;
    title: string;
    mappingType: string;
    coverage: string;
  }>;
}

export default function ControlMappingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<ControlCoverage[]>([]);
  const [filterTheme, setFilterTheme] = useState<string>("ALL");
  const [filterCoverage, setFilterCoverage] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getControlCoverageReport();
      if (data?.controls) {
        setControls(data.controls);
      } else if (Array.isArray(data)) {
        setControls(data);
      } else {
        setControls(generateSampleControls());
      }
    } catch (error) {
      console.error("Error loading control coverage:", error);
      setControls(generateSampleControls());
    } finally {
      setLoading(false);
    }
  };

  // Generate sample control data
  const generateSampleControls = (): ControlCoverage[] => {
    const themes = [
      "Organizational controls",
      "People controls",
      "Physical controls",
      "Technological controls",
    ];
    const sampleControls: ControlCoverage[] = [];

    const orgControls = [
      { id: "A.5.1", name: "Policies for information security" },
      { id: "A.5.2", name: "Information security roles and responsibilities" },
      { id: "A.5.3", name: "Segregation of duties" },
      { id: "A.5.7", name: "Threat intelligence" },
      { id: "A.5.8", name: "Information security in project management" },
      { id: "A.5.9", name: "Inventory of information and other assets" },
      { id: "A.5.10", name: "Acceptable use of information and other assets" },
      { id: "A.5.15", name: "Access control" },
      { id: "A.5.23", name: "Information security for use of cloud services" },
      { id: "A.5.24", name: "Information security incident management" },
    ];

    orgControls.forEach((ctrl, idx) => {
      const coverage = idx < 3 ? "FULL" : idx < 6 ? "PARTIAL" : idx < 8 ? "MINIMAL" : "NONE";
      sampleControls.push({
        controlId: ctrl.id,
        controlName: ctrl.name,
        theme: themes[0]!,
        category: "5",
        coverage,
        documentCount: coverage === "NONE" ? 0 : coverage === "MINIMAL" ? 1 : coverage === "PARTIAL" ? 2 : 3,
        documents: coverage !== "NONE" ? [
          { id: "1", documentId: "POL-001", title: "Information Security Policy", mappingType: "IMPLEMENTS", coverage: "FULL" },
        ] : [],
      });
    });

    return sampleControls;
  };

  // Get unique themes
  const themes = [...new Set(controls.map((c) => c.theme))];

  // Filter controls (search is handled by DataTable)
  const filteredControls = controls.filter((control) => {
    if (filterTheme !== "ALL" && control.theme !== filterTheme) return false;
    if (filterCoverage !== "ALL" && control.coverage !== filterCoverage) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: controls.length,
    full: controls.filter((c) => c.coverage === "FULL").length,
    partial: controls.filter((c) => c.coverage === "PARTIAL").length,
    minimal: controls.filter((c) => c.coverage === "MINIMAL").length,
    none: controls.filter((c) => c.coverage === "NONE").length,
  };

  const overallCoverage = stats.total > 0
    ? Math.round(((stats.full * 100 + stats.partial * 75 + stats.minimal * 25) / stats.total))
    : 0;

  // Column definitions
  const columns: Column<ControlCoverage>[] = [
    {
      key: "controlId",
      header: "Control",
      className: "w-[100px]",
      render: (control) => (
        <span className="font-mono text-xs text-muted-foreground">{control.controlId}</span>
      ),
    },
    {
      key: "controlName",
      header: "Name",
      sortable: true,
      render: (control) => (
        <div>
          <p className="font-medium text-sm">{control.controlName}</p>
          {control.documents.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {control.documents.slice(0, 2).map((doc) => (
                <Badge
                  key={doc.id}
                  variant="secondary"
                  className="text-[10px] cursor-pointer hover:bg-secondary/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/policies/documents/${doc.id}`);
                  }}
                >
                  <Link2 className="h-2.5 w-2.5 mr-1" />
                  {doc.documentId}
                </Badge>
              ))}
              {control.documents.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{control.documents.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "theme",
      header: "Theme",
      className: "w-[180px]",
      render: (control) => (
        <span className="text-xs text-muted-foreground">{control.theme}</span>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      headerClassName: "text-center",
      className: "w-[120px] text-center",
      render: (control) => {
        const badge = (coverageBadges[control.coverage] ?? coverageBadges['NONE'])!;
        const Icon = badge.icon;
        return (
          <Badge variant="outline" className={cn("gap-1", badge.color)}>
            <Icon className="h-3 w-3" />
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: "documentCount",
      header: "Documents",
      headerClassName: "text-center",
      className: "w-[100px] text-center",
      render: (control) => (
        <span className="font-medium">{control.documentCount}</span>
      ),
    },
  ];

  // Row actions
  const rowActions: RowAction<ControlCoverage>[] = [
    {
      label: "View Control",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        toast.info("This feature is not yet available");
      },
    },
    {
      label: "Add Document Mapping",
      icon: <Plus className="w-4 h-4" />,
      onClick: () => {
        toast.info("This feature is not yet available");
      },
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Control Mappings"
        description="Document coverage for ISO 27001:2022 Annex A controls"
        actions={
          <Button size="sm" onClick={() => toast.info("Create records via Claude Code or Claude Desktop using MCP tools")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        }
      />

      {/* Overall Coverage */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Overall Control Coverage</CardTitle>
              <CardDescription>Weighted coverage across all Annex A controls</CardDescription>
            </div>
            <div className="text-3xl font-bold text-primary">{overallCoverage}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallCoverage} className="h-3" />
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Full: {stats.full}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span>Partial: {stats.partial}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span>Minimal: {stats.minimal}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>None: {stats.none}</span>
              </div>
            </div>
            <span className="text-muted-foreground">{stats.total} controls total</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats by Coverage */}
      <div className="grid gap-4 md:grid-cols-4">
        {(["FULL", "PARTIAL", "MINIMAL", "NONE"] as const).map((coverage) => {
          const badge = coverageBadges[coverage]!;
          const Icon = badge.icon;
          const count = stats[coverage.toLowerCase() as keyof typeof stats];
          return (
            <Card
              key={coverage}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                filterCoverage === coverage && "ring-2 ring-primary"
              )}
              onClick={() => setFilterCoverage(filterCoverage === coverage ? "ALL" : coverage)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{badge.label} Coverage</CardTitle>
                <Icon className={cn("h-4 w-4", badge.color.split(" ")[1])} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}% of controls
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Control Coverage Table */}
      <DataTable
        title="Control Coverage Details"
        data={filteredControls}
        columns={columns}
        keyExtractor={(control) => control.controlId}
        rowActions={rowActions}
        loading={loading}
        emptyMessage="No controls found"
        searchPlaceholder="Search controls..."
        searchFilter={(control, query) => {
          const search = query.toLowerCase();
          return (
            control.controlId.toLowerCase().includes(search) ||
            control.controlName.toLowerCase().includes(search) ||
            control.theme.toLowerCase().includes(search)
          );
        }}
        pagination={{
          page,
          pageSize,
          total: filteredControls.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        filterSlot={
          <Select value={filterTheme} onValueChange={(v) => { setFilterTheme(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9 bg-secondary/50">
              <SelectValue placeholder="All Themes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Themes</SelectItem>
              {themes.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {theme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Mapping Type Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Mapping Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Implements</Badge>
              <span className="text-xs text-muted-foreground">Document directly implements this control</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Supports</Badge>
              <span className="text-xs text-muted-foreground">Document supports control implementation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">References</Badge>
              <span className="text-xs text-muted-foreground">Document references this control</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Evidences</Badge>
              <span className="text-xs text-muted-foreground">Document provides evidence for this control</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
