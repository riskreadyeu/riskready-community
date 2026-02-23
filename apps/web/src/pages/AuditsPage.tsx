import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Download, Plus, AlertCircle, ExternalLink, Clock, CheckCircle2, XCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import { getNonconformities, getNonconformityStats, type Nonconformity, type NonconformityStats, type NCStatus, type NCSeverity } from "@/lib/audits-api";
import { format } from "date-fns";

export default function AuditsPage() {
  const navigate = useNavigate();
  const [loadingNCs, setLoadingNCs] = useState(true);
  const [nonconformities, setNonconformities] = useState<Nonconformity[]>([]);
  const [ncStats, setNcStats] = useState<NonconformityStats | null>(null);

  useEffect(() => {
    loadNonconformities();
  }, []);

  const loadNonconformities = async () => {
    try {
      setLoadingNCs(true);
      const [ncsData, statsData] = await Promise.all([
        getNonconformities({ take: 10, status: "OPEN" as NCStatus }),
        getNonconformityStats(),
      ]);
      setNonconformities(ncsData.results);
      setNcStats(statsData);
    } catch (err) {
      console.error("Error loading nonconformities:", err);
    } finally {
      setLoadingNCs(false);
    }
  };

  const timeline = [
    { name: "SOC 2 Type II", date: "Jan 20", status: "In progress", owner: "GRC" },
    { name: "ISO 27001 Internal", date: "Feb 12", status: "Planned", owner: "Security" },
    { name: "Vendor Due Diligence", date: "Mar 03", status: "Planned", owner: "Procurement" },
  ] as const;

  const evidence = [
    { name: "Access review results", due: "Tomorrow", status: "Requested" },
    { name: "Change management samples", due: "Next week", status: "Requested" },
    { name: "Incident tickets", due: "2 weeks", status: "Draft" },
  ] as const;

  const severityVariant = (sev: string) => {
    if (sev === "Critical" || sev === "High") return "destructive" as const;
    return "secondary" as const;
  };

  const getSeverityBadge = (severity: NCSeverity) => {
    const variants = {
      MAJOR: { variant: "destructive" as const, icon: XCircle },
      MINOR: { variant: "secondary" as const, icon: AlertCircle },
      OBSERVATION: { variant: "outline" as const, icon: AlertTriangle },
    };
    const config = variants[severity];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1 text-[10px]">
        <Icon className="w-3 h-3" />
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: NCStatus) => {
    const variants: Record<NCStatus, { variant: "default" | "secondary" | "destructive" | "outline", icon: LucideIcon }> = {
      DRAFT: { variant: "secondary", icon: AlertCircle },
      OPEN: { variant: "destructive", icon: AlertCircle },
      IN_PROGRESS: { variant: "default", icon: Clock },
      AWAITING_VERIFICATION: { variant: "secondary", icon: Clock },
      VERIFIED_EFFECTIVE: { variant: "outline", icon: CheckCircle2 },
      VERIFIED_INEFFECTIVE: { variant: "destructive", icon: XCircle },
      CLOSED: { variant: "outline", icon: CheckCircle2 },
      REJECTED: { variant: "secondary", icon: XCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1 text-[10px]">
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const isOverdue = (nc: Nonconformity) => {
    if (!nc.targetClosureDate) return false;
    if (nc.status === "CLOSED") return false;
    return new Date(nc.targetClosureDate) < new Date();
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan audits, track readiness, and manage findings (placeholder)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-lg bg-transparent">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-lg bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2 rounded-lg" onClick={() => navigate("/audits/nonconformities/new")}>
            <Plus className="h-4 w-4" />
            Raise NC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="glass-card lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Audit workspace</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Next 90 days</Badge>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="timeline" className="rounded-lg">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="findings" className="rounded-lg">
                    Findings
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="rounded-lg">
                    Evidence requests
                  </TabsTrigger>
                </TabsList>
                <div className="text-xs text-muted-foreground">All data is placeholder</div>
              </div>

              <TabsContent value="timeline">
                <div className="rounded-xl border border-border/60 bg-background/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Audit</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Target date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeline.map((a) => (
                        <TableRow key={a.name}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-muted-foreground">{a.owner}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === "In progress" ? "secondary" : "outline"} className="text-[10px]">
                              {a.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{a.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="findings">
                <div className="rounded-xl border border-border/60 bg-background/40">
                  {loadingNCs ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : nonconformities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
                      <p className="text-sm font-medium">No open nonconformities</p>
                      <p className="text-xs text-muted-foreground mt-1">All nonconformities have been closed</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-2"
                        onClick={() => navigate("/audits/nonconformities")}
                      >
                        View All
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>NC ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Target Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {nonconformities.slice(0, 5).map((nc) => (
                            <TableRow key={nc.id}>
                              <TableCell className="font-mono font-medium text-xs">{nc.ncId}</TableCell>
                              <TableCell className="font-medium max-w-xs truncate">{nc.title}</TableCell>
                              <TableCell>{getSeverityBadge(nc.severity)}</TableCell>
                              <TableCell>{getStatusBadge(nc.status)}</TableCell>
                              <TableCell>
                                {nc.targetClosureDate ? (
                                  <span className={isOverdue(nc) ? "text-destructive font-medium" : "text-muted-foreground"}>
                                    {format(new Date(nc.targetClosureDate), "dd MMM")}
                                    {isOverdue(nc) && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg bg-transparent"
                                  onClick={() => navigate(`/audits/nonconformities/${nc.id}`)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="border-t border-border/60 bg-secondary/20 px-4 py-3 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Showing {Math.min(5, nonconformities.length)} of {nonconformities.length} open NCs
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2"
                          onClick={() => navigate("/audits/nonconformities")}
                        >
                          View All
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="evidence">
                <div className="rounded-xl border border-border/60 bg-background/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidence.map((r) => (
                        <TableRow key={r.name}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "Requested" ? "outline" : "secondary"} className="text-[10px]">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.due}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="h-8 rounded-lg bg-transparent">
                              Request
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-4">
          <CardHeader>
            <CardTitle>Nonconformity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingNCs ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : ncStats ? (
              <>
                {/* Pending Review - NEW */}
                {ncStats.pendingReview > 0 && (
                  <div 
                    className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 cursor-pointer hover:bg-amber-500/20 transition-colors"
                    onClick={() => navigate("/audits/nonconformities?status=DRAFT")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">⚠️ Pending Review</span>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{ncStats.pendingReview}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-500">
                      Auto-created NCs
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total NCs</span>
                    <span className="text-sm font-semibold text-foreground">{ncStats.total}</span>
                  </div>
                </div>
                <div 
                  className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 cursor-pointer hover:bg-destructive/20 transition-colors"
                  onClick={() => navigate("/audits/nonconformities?status=OPEN,IN_PROGRESS")}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Open/In Progress</span>
                    <span className="text-sm font-semibold text-destructive">
                      {(ncStats.byStatus['OPEN'] || 0) + (ncStats.byStatus['IN_PROGRESS'] || 0)}
                    </span>
                  </div>
                </div>
                <div 
                  className="rounded-lg border border-destructive/60 bg-destructive/10 px-3 py-2 cursor-pointer hover:bg-destructive/20 transition-colors"
                  onClick={() => navigate("/audits/nonconformities?overdue=true")}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Overdue</span>
                    <span className="text-sm font-semibold text-destructive">{ncStats.overdue}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Major NCs</span>
                    <span className="text-sm font-semibold text-foreground">{ncStats.bySeverity['MAJOR'] || 0}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 mt-2"
                  onClick={() => navigate("/audits/nonconformities")}
                >
                  Full NC Register
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Open Nonconformities</CardTitle>
            {ncStats && (ncStats.bySeverity['MAJOR'] ?? 0) > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {ncStats.bySeverity['MAJOR']} major
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingNCs ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : nonconformities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-600 mb-2" />
                <p className="text-sm text-muted-foreground">No open nonconformities</p>
              </div>
            ) : (
              nonconformities.slice(0, 3).map((nc) => (
                <div
                  key={nc.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate(`/audits/nonconformities/${nc.id}`)}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{nc.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {nc.ncId} • {nc.responsibleUser ? `${nc.responsibleUser.firstName} ${nc.responsibleUser.lastName}` : "Unassigned"}
                    </div>
                  </div>
                  {getSeverityBadge(nc.severity)}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Evidence requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Access review results", due: "Tomorrow" },
              { name: "Change management samples", due: "Next week" },
              { name: "Incident tickets", due: "2 weeks" },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">Due: {r.due}</div>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-lg bg-transparent">
                  Request
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
