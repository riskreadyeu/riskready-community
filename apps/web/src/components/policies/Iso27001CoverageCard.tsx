import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIso27001Status,
  useGenerateIso27001,
  type Iso27001DocumentStatus,
} from "@/hooks/queries/use-iso27001-queries";

// ---------------------------------------------------------------------------
// Wave metadata
// ---------------------------------------------------------------------------

const waveLabels: Record<number, string> = {
  1: "Wave 1: Mandatory ISMS Clauses",
  2: "Wave 2: Annex A Policies",
  3: "Wave 3: Operational Procedures",
};

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

type StatusConfig = {
  icon: React.ReactNode;
  variant: "default" | "secondary" | "destructive" | "outline" | "warning" | "success";
  label: string;
};

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "PUBLISHED":
    case "APPROVED":
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
        variant: "success",
        label: status,
      };
    case "DRAFT":
    case "PENDING_REVIEW":
      return {
        icon: <FileText className="h-3.5 w-3.5 text-yellow-500" />,
        variant: "secondary",
        label: status.replace(/_/g, " "),
      };
    case "PENDING_APPROVAL":
      return {
        icon: <Clock className="h-3.5 w-3.5 text-orange-500" />,
        variant: "outline",
        label: "PENDING APPROVAL",
      };
    case "MISSING":
    default:
      return {
        icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
        variant: "destructive",
        label: "MISSING",
      };
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DocumentRow({ doc }: { doc: Iso27001DocumentStatus }) {
  const cfg = getStatusConfig(doc.status);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-all">
      {cfg.icon}
      <span className="font-mono text-xs text-muted-foreground shrink-0">
        {doc.documentId}
      </span>
      <span className="text-sm truncate flex-1">{doc.title}</span>
      <Badge variant={cfg.variant} className="shrink-0 text-[10px]">
        {cfg.label}
      </Badge>
    </div>
  );
}

function WaveSection({
  wave,
  documents,
  isAdmin,
  onGenerate,
  isGenerating,
}: {
  wave: number;
  documents: Iso27001DocumentStatus[];
  isAdmin: boolean;
  onGenerate: (wave: number) => void;
  isGenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(wave === 1);
  const missing = documents.filter((d) => d.status === "MISSING").length;
  const completed = documents.filter(
    (d) => d.status === "PUBLISHED" || d.status === "APPROVED"
  ).length;

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex items-center justify-between w-full p-3 text-left hover:bg-secondary/20 transition-all rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {waveLabels[wave] ?? `Wave ${wave}`}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {completed}/{documents.length}
          </Badge>
        </div>
        {isAdmin && missing > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={isGenerating}
            onClick={(e) => {
              e.stopPropagation();
              onGenerate(wave);
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate {missing} doc{missing !== 1 ? "s" : ""}</>
            )}
          </Button>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-0.5">
          {documents.map((doc) => (
            <DocumentRow key={doc.documentId} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Iso27001CoverageCard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";

  const { data: status, isLoading } = useIso27001Status();
  const generateMutation = useGenerateIso27001();

  const [confirmWave, setConfirmWave] = useState<number | null>(null);
  const [generatingWave, setGeneratingWave] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ wave: number; summary: string } | null>(null);

  const handleGenerate = (wave: number) => {
    setConfirmWave(wave);
  };

  const handleConfirm = () => {
    if (confirmWave === null) return;
    const wave = confirmWave;
    setConfirmWave(null);
    setGeneratingWave(wave);

    generateMutation.mutate(
      { wave },
      {
        onSuccess: (result) => {
          setLastResult({ wave: result.wave, summary: result.summary });
          setGeneratingWave(null);
        },
        onError: () => {
          setGeneratingWave(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-40 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  // Group documents by wave
  const byWave = new Map<number, Iso27001DocumentStatus[]>();
  for (const doc of status.documents) {
    const list = byWave.get(doc.wave) ?? [];
    list.push(doc);
    byWave.set(doc.wave, list);
  }

  const missingInWave = (wave: number) =>
    (byWave.get(wave) ?? []).filter((d) => d.status === "MISSING").length;

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            ISO 27001:2022 Documentation
          </CardTitle>
          <CardDescription>
            {status.completed} of {status.total} documents &mdash;{" "}
            {status.completionPercentage}% complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={status.completionPercentage} className="h-2" />

          {[1, 2, 3].map((wave) => {
            const docs = byWave.get(wave) ?? [];
            if (docs.length === 0) return null;
            return (
              <WaveSection
                key={wave}
                wave={wave}
                documents={docs}
                isAdmin={isAdmin}
                onGenerate={handleGenerate}
                isGenerating={generatingWave === wave}
              />
            );
          })}

          {lastResult && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Generation Complete
              </div>
              <p className="text-muted-foreground">{lastResult.summary}</p>
              <Link
                to="/settings/mcp-approvals"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Review pending approvals
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmWave !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmWave(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate ISO 27001 Documents</DialogTitle>
            <DialogDescription>
              This will generate {confirmWave !== null ? missingInWave(confirmWave) : 0} missing
              document{confirmWave !== null && missingInWave(confirmWave) !== 1 ? "s" : ""} for{" "}
              {confirmWave !== null ? waveLabels[confirmWave] ?? `Wave ${confirmWave}` : ""}.
              Each document will be created as a pending action requiring admin approval.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmWave(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Generate Documents</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
