
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, TestTube, XCircle } from "lucide-react";
import { getAllEffectivenessTests, type CapabilityEffectivenessTest } from "@/lib/controls-api";
import { formatDistanceToNow } from "date-fns";

function getResultIcon(result: string) {
  switch (result) {
    case "PASS":
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case "FAIL":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "PARTIAL":
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function getResultBadge(result: string) {
  switch (result) {
    case "PASS":
      return "bg-success/10 text-success border-success/20";
    case "FAIL":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "PARTIAL":
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

function getTesterInitials(tester?: string): string {
  if (!tester) return "??";
  const parts = tester.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return (first + last).toUpperCase();
  }
  return tester.slice(0, 2).toUpperCase();
}

export function ControlTestResults() {
  const [tests, setTests] = useState<CapabilityEffectivenessTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { results } = await getAllEffectivenessTests({ take: 5 });
        setTests(results);
      } catch (err) {
        console.error("Failed to load test results:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Test Results</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Latest control assessments</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-8">
            <TestTube className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No test results yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run effectiveness tests to see results here
            </p>
          </div>
        ) : (
          <>
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
              >
                <div className="flex-shrink-0">{getResultIcon(test.testResult)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{test.testType}</span>
                    <Badge variant="outline" className={`text-[9px] capitalize ${getResultBadge(test.testResult)}`}>
                      {test.testResult.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate mt-0.5">
                    {test.capability?.control?.name || test.capability?.name || "Effectiveness Test"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {test.tester && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium">
                      {getTesterInitials(test.tester)}
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeTime(test.testDate || test.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            <Button variant="ghost" size="sm" className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/10">
              View All Tests
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
