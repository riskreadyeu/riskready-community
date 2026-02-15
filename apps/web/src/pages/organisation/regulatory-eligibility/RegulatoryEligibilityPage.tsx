import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Scale,
  Plus,
  FileCheck,
  Clock,
  CheckCircle2,
  Eye,
  Trash2,
  Play,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  StatCard,
  StatCardGrid,
  type Column,
  type RowAction,
} from "@/components/common";

interface RegulatoryEligibilitySurvey {
  id: string;
  surveyType: string;
  surveyVersion: string;
  status: string;
  completedAt?: string;
  isApplicable?: boolean;
  applicabilityReason?: string;
  entityClassification?: string;
  regulatoryRegime?: string;
  notes?: string;
  createdBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  _count?: { responses: number };
  createdAt: string;
  updatedAt: string;
}

const surveyTypeLabels: Record<string, string> = {
  dora: "DORA",
  nis2: "NIS2",
};

const surveyTypeDescriptions: Record<string, string> = {
  dora: "Digital Operational Resilience Act - EU regulation for financial entities",
  nis2: "Network and Information Security Directive 2 - EU cybersecurity directive",
};

const statusVariants: Record<string, "success" | "warning" | "default" | "secondary"> = {
  in_progress: "warning",
  completed: "success",
};

async function getSurveys(): Promise<{ results: RegulatoryEligibilitySurvey[]; count: number }> {
  const res = await fetch('/api/organisation/regulatory-eligibility/surveys', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch surveys');
  return res.json();
}

async function createSurvey(surveyType: string): Promise<RegulatoryEligibilitySurvey> {
  const res = await fetch('/api/organisation/regulatory-eligibility/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ surveyType }),
  });
  if (!res.ok) throw new Error('Failed to create survey');
  return res.json();
}

async function deleteSurvey(id: string): Promise<void> {
  const res = await fetch(`/api/organisation/regulatory-eligibility/surveys/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete survey');
}

export default function RegulatoryEligibilityPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<RegulatoryEligibilitySurvey[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [newSurveyDialogOpen, setNewSurveyDialogOpen] = useState(false);
  const [selectedSurveyType, setSelectedSurveyType] = useState<string>("dora");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSurveys();
      setSurveys(data.results);
    } catch (err) {
      console.error("Error loading surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    try {
      const survey = await createSurvey(selectedSurveyType);
      setNewSurveyDialogOpen(false);
      navigate(`/organisation/regulatory-eligibility/${survey.id}`);
    } catch (err) {
      console.error("Error creating survey:", err);
    }
  };

  const handleDeleteSurvey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey?")) return;
    try {
      await deleteSurvey(id);
      loadData();
    } catch (err) {
      console.error("Error deleting survey:", err);
    }
  };

  const filteredSurveys = typeFilter === "all"
    ? surveys
    : surveys.filter((s) => s.surveyType === typeFilter);

  const columns: Column<RegulatoryEligibilitySurvey>[] = [
    {
      key: "surveyType",
      header: "Regulation",
      render: (survey) => (
        <div className="flex flex-col">
          <span className="font-medium">{surveyTypeLabels[survey.surveyType] || survey.surveyType}</span>
          <span className="text-xs text-muted-foreground">v{survey.surveyVersion}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (survey) => (
        <StatusBadge
          status={survey.status === "in_progress" ? "In Progress" : "Completed"}
          variant={statusVariants[survey.status] || "secondary"}
        />
      ),
    },
    {
      key: "result",
      header: "Result",
      render: (survey) => {
        if (survey.status !== "completed") {
          return <span className="text-muted-foreground">-</span>;
        }
        if (survey.isApplicable === false) {
          return <Badge variant="secondary">Not Applicable</Badge>;
        }
        if (survey.surveyType === "nis2" && survey.entityClassification) {
          return (
            <Badge variant={survey.entityClassification === "essential" ? "default" : "secondary"}>
              {survey.entityClassification === "essential" ? "Essential Entity" : 
               survey.entityClassification === "important" ? "Important Entity" : "Not Applicable"}
            </Badge>
          );
        }
        if (survey.surveyType === "dora" && survey.regulatoryRegime) {
          return (
            <Badge variant={survey.regulatoryRegime === "full" ? "default" : "secondary"}>
              {survey.regulatoryRegime === "full" ? "Full Regime" : 
               survey.regulatoryRegime === "simplified" ? "Simplified Regime" : "Not Applicable"}
            </Badge>
          );
        }
        return <Badge variant="default">Applicable</Badge>;
      },
    },
    {
      key: "responses",
      header: "Progress",
      render: (survey) => (
        <span className="text-sm">{survey._count?.responses ?? 0} responses</span>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (survey) =>
        survey.createdBy ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {survey.createdBy.firstName?.[0]}{survey.createdBy.lastName?.[0]}
            </div>
            <span className="text-sm">{survey.createdBy.firstName} {survey.createdBy.lastName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "createdAt",
      header: "Started",
      render: (survey) => new Date(survey.createdAt).toLocaleDateString(),
    },
    {
      key: "completedAt",
      header: "Completed",
      render: (survey) =>
        survey.completedAt ? (
          new Date(survey.completedAt).toLocaleDateString()
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  const rowActions: RowAction<RegulatoryEligibilitySurvey>[] = [
    {
      label: "Continue Survey",
      icon: <Play className="w-4 h-4" />,
      href: (survey) => `/organisation/regulatory-eligibility/${survey.id}`,
      hidden: (survey) => survey.status === "completed",
    },
    {
      label: "View Results",
      icon: <Eye className="w-4 h-4" />,
      href: (survey) => `/organisation/regulatory-eligibility/${survey.id}`,
      hidden: (survey) => survey.status !== "completed",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (survey) => handleDeleteSurvey(survey.id),
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

  const doraSurveys = surveys.filter((s) => s.surveyType === "dora");
  const nis2Surveys = surveys.filter((s) => s.surveyType === "nis2");
  const completedCount = surveys.filter((s) => s.status === "completed").length;
  const inProgressCount = surveys.filter((s) => s.status === "in_progress").length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Regulatory Eligibility"
        description="Assess your organization's applicability to DORA and NIS2 regulations"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Dialog open={newSurveyDialogOpen} onOpenChange={setNewSurveyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-lg glow-primary">
                <Plus className="h-4 w-4" />
                New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Eligibility Assessment</DialogTitle>
                <DialogDescription>
                  Select the regulation you want to assess your organization against.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Regulation</label>
                  <Select value={selectedSurveyType} onValueChange={setSelectedSurveyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dora">
                        <div className="flex flex-col">
                          <span className="font-medium">DORA</span>
                          <span className="text-xs text-muted-foreground">Digital Operational Resilience Act</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="nis2">
                        <div className="flex flex-col">
                          <span className="font-medium">NIS2</span>
                          <span className="text-xs text-muted-foreground">Network and Information Security Directive 2</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">
                    {surveyTypeDescriptions[selectedSurveyType]}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewSurveyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSurvey}>
                  Start Assessment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Assessments"
          value={surveys.length}
          icon={<Scale className="h-4 w-4" />}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={<Clock className="h-4 w-4" />}
          iconClassName="text-warning"
        />
        <StatCard
          title="DORA / NIS2"
          value={`${doraSurveys.length} / ${nis2Surveys.length}`}
          icon={<FileCheck className="h-4 w-4" />}
          iconClassName="text-primary"
        />
      </StatCardGrid>

      <DataTable
        title="Eligibility Assessments"
        data={filteredSurveys}
        columns={columns}
        keyExtractor={(survey) => survey.id}
        searchPlaceholder="Search assessments..."
        searchFilter={(survey, query) =>
          surveyTypeLabels[survey.surveyType]?.toLowerCase().includes(query.toLowerCase()) ||
          survey.surveyType.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No assessments found. Start a new assessment to determine your regulatory obligations."
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-transparent">
              <SelectValue placeholder="Regulation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="dora">DORA</SelectItem>
              <SelectItem value="nis2">NIS2</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
