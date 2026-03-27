import { Link, useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  Activity,
  Paperclip,
  Lightbulb,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentDetailHeader } from "@/components/incidents/detail/IncidentDetailHeader";
import { IncidentRegulatoryAlerts } from "@/components/incidents/detail/IncidentRegulatoryAlerts";
import { IncidentSidebarPanels } from "@/components/incidents/detail/IncidentSidebarPanels";
import { useIncidentDetail } from "@/hooks/incidents/useIncidentDetail";

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    loading,
    incident,
    timeline,
    evidence,
    communications,
    lessonsLearned,
    notifications,
  } = useIncidentDetail(id);

  if (loading) {
    return (
      <div className="space-y-8 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Incident Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The incident you're looking for doesn't exist.
        </p>
        <Button className="mt-4" onClick={() => navigate("/incidents/register")}>
          Back to Register
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <IncidentDetailHeader incident={incident} onBack={() => navigate(-1)} />

      <IncidentRegulatoryAlerts incident={incident} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline ({timeline.length})
              </TabsTrigger>
              <TabsTrigger value="evidence">
                Evidence ({evidence.length})
              </TabsTrigger>
              <TabsTrigger value="communications">
                Comms ({communications.length})
              </TabsTrigger>
              <TabsTrigger value="lessons">
                Lessons ({lessonsLearned.length})
              </TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications ({notifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{incident.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CIA Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className={`flex items-center gap-2 rounded-lg border p-3 ${incident.confidentialityBreach ? "border-red-500/20 bg-red-500/5" : ""}`}>
                      <div className={`h-3 w-3 rounded-full ${incident.confidentialityBreach ? "bg-red-500" : "bg-muted"}`} />
                      <span className="text-sm">Confidentiality</span>
                    </div>
                    <div className={`flex items-center gap-2 rounded-lg border p-3 ${incident.integrityBreach ? "border-red-500/20 bg-red-500/5" : ""}`}>
                      <div className={`h-3 w-3 rounded-full ${incident.integrityBreach ? "bg-red-500" : "bg-muted"}`} />
                      <span className="text-sm">Integrity</span>
                    </div>
                    <div className={`flex items-center gap-2 rounded-lg border p-3 ${incident.availabilityBreach ? "border-red-500/20 bg-red-500/5" : ""}`}>
                      <div className={`h-3 w-3 rounded-full ${incident.availabilityBreach ? "bg-red-500" : "bg-muted"}`} />
                      <span className="text-sm">Availability</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ISO 27001 Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Evidence Preserved", value: incident.evidencePreserved },
                      { label: "Chain of Custody", value: incident.chainOfCustodyMaintained },
                      { label: "Root Cause Identified", value: incident.rootCauseIdentified },
                      { label: "Lessons Learned", value: incident.lessonsLearnedCompleted },
                      { label: "Corrective Actions", value: incident.correctiveActionsIdentified },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        {item.value ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted" />
                        )}
                        <span className="text-sm">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              {timeline.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No timeline entries yet
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => toast.info("This action is available via Claude Code or Claude Desktop using MCP tools")}>
                      Add Entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative space-y-4 pl-6">
                  <div className="absolute left-2 top-0 h-full w-px bg-border" />
                  {timeline.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-4 top-2 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{entry.title}</p>
                              <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {entry.entryType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          {entry.description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {entry.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              {evidence.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-8">
                    <Paperclip className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No evidence collected yet
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => toast.info("This action is available via Claude Code or Claude Desktop using MCP tools")}>
                      Add Evidence
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                evidence.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{e.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.evidenceType.replace(/_/g, " ")} • Collected{" "}
                              {new Date(e.collectedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {e.isForensicallySound && (
                          <Badge variant="outline" className="text-[10px]">
                            Forensically Sound
                          </Badge>
                        )}
                      </div>
                      {e.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {e.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="communications" className="space-y-4">
              {communications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No communications logged yet
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => toast.info("This action is available via Claude Code or Claude Desktop using MCP tools")}>
                      Log Communication
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                communications.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{c.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.communicationType} • {c.direction} • {c.channel}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.occurredAt).toLocaleString()}
                        </span>
                      </div>
                      {c.summary && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {c.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              {lessonsLearned.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-8">
                    <Lightbulb className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No lessons learned documented yet
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => toast.info("This action is available via Claude Code or Claude Desktop using MCP tools")}>
                      Add Lesson
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                lessonsLearned.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          {l.category}
                        </Badge>
                        <Badge
                          variant={l.status === "VALIDATED" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {l.status}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-medium">Observation</p>
                      <p className="text-sm text-muted-foreground">{l.observation}</p>
                      <p className="mt-3 text-sm font-medium">Recommendation</p>
                      <p className="text-sm text-muted-foreground">{l.recommendation}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No regulatory notifications required
                    </p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((n) => (
                  <Card key={n.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{n.framework}</Badge>
                            <span className="font-medium">{n.notificationType}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {n.authority?.name || "Unknown Authority"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            n.status === "SUBMITTED" || n.status === "ACKNOWLEDGED"
                              ? "success"
                              : n.status === "OVERDUE"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {n.status}
                        </Badge>
                      </div>
                      {n.dueAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Due: {n.dueAt ? new Date(n.dueAt).toLocaleString() : null}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <IncidentSidebarPanels incident={incident} />
      </div>
    </div>
  );
}
