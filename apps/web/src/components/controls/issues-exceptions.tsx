"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUpRight, Clock, FileX, Loader2, Users } from "lucide-react";
import {
  getNonconformities,
  getNonconformityStats,
  type Nonconformity,
  type NonconformityStats,
} from "@/lib/audits-api";
import {
  getExceptions,
  getExceptionStats,
  type DocumentException,
} from "@/lib/policies-api";
import { formatDistanceToNow } from "date-fns";

function getSeverityBadge(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "major":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "medium":
    case "minor":
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "active":
      return "bg-success/10 text-success border-success/20";
    case "pending":
    case "requested":
    case "under_review":
      return "bg-warning/10 text-warning border-warning/20";
    case "expired":
    case "revoked":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getAge(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: false });
  } catch {
    return "Unknown";
  }
}

export function IssuesExceptions() {
  const [ncs, setNcs] = useState<Nonconformity[]>([]);
  const [ncStats, setNcStats] = useState<NonconformityStats | null>(null);
  const [exceptions, setExceptions] = useState<DocumentException[]>([]);
  const [exceptionStats, setExceptionStats] = useState<{ active: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ncData, ncStatsData, excData, excStatsData] = await Promise.all([
          getNonconformities({ take: 5 }).catch(() => ({ results: [], count: 0 })),
          getNonconformityStats().catch(() => null),
          getExceptions({ take: 5 }).catch(() => ({ results: [], count: 0 })),
          getExceptionStats().catch(() => null),
        ]);
        setNcs(ncData.results);
        setNcStats(ncStatsData);
        setExceptions(excData.results);
        setExceptionStats(excStatsData as any);
      } catch (err) {
        console.error("Failed to load issues & exceptions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const openNCCount = ncStats
    ? (ncStats.byStatus?.['OPEN'] ?? 0) +
      (ncStats.byStatus?.['IN_PROGRESS'] ?? 0) +
      (ncStats.byStatus?.['DRAFT'] ?? 0) +
      (ncStats.byStatus?.['AWAITING_VERIFICATION'] ?? 0)
    : 0;
  const activeExceptions = (exceptionStats as any)?.active ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Issues & Exceptions</CardTitle>
          <div className="flex items-center gap-2">
            {openNCCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                {openNCCount} Open Issue{openNCCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {activeExceptions > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px]">
                {activeExceptions} Active Exception{activeExceptions !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="deficiencies" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 mb-4">
              <TabsTrigger
                value="deficiencies"
                className="gap-2 text-xs data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Nonconformities
              </TabsTrigger>
              <TabsTrigger
                value="exceptions"
                className="gap-2 text-xs data-[state=active]:bg-warning/10 data-[state=active]:text-warning"
              >
                <FileX className="w-3.5 h-3.5" />
                Exceptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deficiencies" className="mt-0">
              {ncs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No nonconformities</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Issues from audits and tests will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ncs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{item.ncId}</span>
                            <Badge variant="outline" className={cn("text-[9px] capitalize", getSeverityBadge(item.severity))}>
                              {item.severity.toLowerCase()}
                            </Badge>
                            {item.control && (
                              <span className="text-[10px] text-muted-foreground">
                                Control: {item.control.controlId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground mt-0.5 truncate max-w-md">{item.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {getAge(item.dateRaised)}
                          </div>
                          {item.responsibleUser && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.responsibleUser.firstName} {item.responsibleUser.lastName}
                            </span>
                          )}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="exceptions" className="mt-0">
              {exceptions.length === 0 ? (
                <div className="text-center py-8">
                  <FileX className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No exceptions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Policy exceptions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exceptions.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <FileX className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{item.exceptionId}</span>
                            <Badge variant="outline" className={cn("text-[9px] capitalize", getStatusBadge(item.status))}>
                              {item.status.toLowerCase().replace("_", " ")}
                            </Badge>
                            {item.document && (
                              <span className="text-[10px] text-muted-foreground">
                                Policy: {item.document.documentId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground mt-0.5 truncate max-w-md">{item.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {item.expiryDate && (
                            <div className="text-xs text-muted-foreground">
                              Expires {getAge(item.expiryDate)}
                            </div>
                          )}
                          {item.approvedBy && (
                            <span className="text-[10px] text-muted-foreground">
                              By: {item.approvedBy.firstName} {item.approvedBy.lastName}
                            </span>
                          )}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
