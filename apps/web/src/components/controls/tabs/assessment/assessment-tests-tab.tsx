import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type Column,
} from "@/components/common";
import {
  fetchAssessmentTests,
  type AssessmentTest,
  type AssessmentTestStatus,
  type TestResult,
} from "@/lib/controls-api";
import { AlertCircle, Clock, Play, CheckCircle, SkipForward, CircleDot } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface AssessmentTestsTabProps {
  assessmentId: string;
}

// =============================================================================
// Configuration
// =============================================================================

const testStatusConfig: Record<AssessmentTestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  IN_PROGRESS: { label: "In Progress", variant: "outline", icon: <Play className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  SKIPPED: { label: "Skipped", variant: "secondary", icon: <SkipForward className="h-3 w-3" /> },
};

const testResultConfig: Record<TestResult, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PASS: { label: "Pass", variant: "default" },
  PARTIAL: { label: "Partial", variant: "outline" },
  FAIL: { label: "Fail", variant: "destructive" },
  NOT_TESTED: { label: "Not Tested", variant: "secondary" },
  NOT_APPLICABLE: { label: "N/A", variant: "secondary" },
};

// =============================================================================
// Component
// =============================================================================

export function AssessmentTestsTab({ assessmentId }: AssessmentTestsTabProps) {
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");

  useEffect(() => {
    async function loadTests() {
      try {
        setLoading(true);
        const status = statusFilter !== "all" ? statusFilter : undefined;
        const data = await fetchAssessmentTests(assessmentId, status);
        setTests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tests");
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, [assessmentId, statusFilter]);

  const filteredTests = resultFilter !== "all"
    ? tests.filter(t => t.result === resultFilter)
    : tests;

  const columns: Column<AssessmentTest>[] = [
    {
      key: "testCode",
      header: "Test Code",
      render: (test) => (
        <span className="font-mono text-sm font-medium">
          {test.layerTest?.testCode || "\u2014"}
        </span>
      ),
    },
    {
      key: "testName",
      header: "Test Name",
      render: (test) => (
        <span className="text-sm truncate max-w-[300px] block">
          {test.layerTest?.name || "\u2014"}
        </span>
      ),
    },
    {
      key: "scopeItem",
      header: "Scope Item",
      render: (test) => (
        <span className="text-sm text-muted-foreground">
          {test.scopeItem?.name || "\u2014"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (test) => {
        const config = testStatusConfig[test.status];
        return (
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "result",
      header: "Result",
      render: (test) => {
        if (!test.result) return <span className="text-muted-foreground">\u2014</span>;
        const config = testResultConfig[test.result];
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "tester",
      header: "Assigned Tester",
      render: (test) => {
        if (!test.assignedTester) return <span className="text-muted-foreground">\u2014</span>;
        const user = test.assignedTester;
        return (
          <span className="text-sm">
            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
          </span>
        );
      },
    },
    {
      key: "executions",
      header: "Executions",
      render: (test) => (
        <div className="flex items-center gap-1">
          <CircleDot className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{test._count?.executions || test.executions?.length || 0}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
          </SelectContent>
        </Select>

        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="PASS">Pass</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="FAIL">Fail</SelectItem>
            <SelectItem value="NOT_TESTED">Not Tested</SelectItem>
            <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredTests}
        keyExtractor={(test) => test.id}
        emptyMessage="No tests found for this assessment. Add controls to scope to generate tests."
        loading={loading}
      />
    </div>
  );
}
