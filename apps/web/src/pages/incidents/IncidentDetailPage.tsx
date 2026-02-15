import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  MessageSquare,
  Shield,
  FileWarning,
  User,
  Activity,
  Paperclip,
  Lightbulb,
  Bell,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getIncident,
  getIncidentTimeline,
  getIncidentEvidence,
  getIncidentCommunications,
  getIncidentLessonsLearned,
  getIncidentNotifications,
  type Incident,
  type IncidentTimelineEntry,
  type IncidentEvidence,
  type IncidentCommunication,
  type IncidentLessonsLearned,
  type IncidentNotification,
  severityLabels,
  statusLabels,
  categoryLabels,
  sourceLabels,
} from "@/lib/incidents-api";

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, "destructive" | "warning" | "secondary" | "outline"> = {
    CRITICAL: "destructive",
    HIGH: "warning",
    MEDIUM: "secondary",
    LOW: "outline",
  };
  return (
    <Badge variant={variants[severity] || "secondary"}>
      {severityLabels[severity as keyof typeof severityLabels] || severity}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "destructive" | "warning" | "secondary" | "success" | "outline"> = {
    DETECTED: "destructive",
    TRIAGED: "warning",
    INVESTIGATING: "warning",
    CONTAINING: "warning",
    ERADICATING: "secondary",
    RECOVERING: "secondary",
    POST_INCIDENT: "outline",
    CLOSED: "success",
  };
  return (
    <Badge variant={variants[status] || "secondary"}>
      {statusLabels[status as keyof typeof statusLabels] || status}
    </Badge>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<IncidentTimelineEntry[]>([]);
  const [evidence, setEvidence] = useState<IncidentEvidence[]>([]);
  const [communications, setCommunications] = useState<IncidentCommunication[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState<IncidentLessonsLearned[]>([]);
  const [notifications, setNotifications] = useState<IncidentNotification[]>([]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const incidentData = await getIncident(id!);
      setIncident(incidentData);

      // Load related data in parallel
      const [timelineData, evidenceData, commsData, lessonsData, notifData] = await Promise.all([
        getIncidentTimeline(id!).catch(() => []),
        getIncidentEvidence(id!).catch(() => []),
        getIncidentCommunications(id!).catch(() => []),
        getIncidentLessonsLearned(id!).catch(() => []),
        getIncidentNotifications(id!).catch(() => []),
      ]);

      setTimeline(timelineData);
      setEvidence(evidenceData);
      setCommunications(commsData);
      setLessonsLearned(lessonsData);
      setNotifications(notifData);
    } catch (err) {
      console.error("Error loading incident:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleString();
  };

  const getUserName = (user?: { firstName?: string; lastName?: string; email: string }) => {
    if (!user) return null;
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return name || user.email;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/incidents" className="hover:text-foreground">
            Incidents
          </Link>
          <span>/</span>
          <Link to="/incidents/register" className="hover:text-foreground">
            Register
          </Link>
          <span>/</span>
          <span className="text-foreground">{incident.referenceNumber}</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {incident.referenceNumber}
                </h1>
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
              <p className="mt-1 text-lg text-muted-foreground">{incident.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/incidents/${incident.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Regulatory Alerts */}
      {(incident.nis2Assessment?.isSignificantIncident || incident.doraAssessment?.isMajorIncident) && (
        <div className="flex flex-wrap gap-4">
          {incident.nis2Assessment?.isSignificantIncident && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">NIS2 Significant Incident</p>
                  <p className="text-xs text-muted-foreground">
                    Regulatory reporting required
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {incident.doraAssessment?.isMajorIncident && (
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <FileWarning className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">DORA Major ICT Incident</p>
                  <p className="text-xs text-muted-foreground">
                    Score: {incident.doraAssessment.majorClassificationScore}/7 criteria
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                    <Button size="sm" className="mt-4">
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
                                {formatDate(entry.timestamp)}
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
                    <Button size="sm" className="mt-4">
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
                              {formatDate(e.collectedAt)}
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
                    <Button size="sm" className="mt-4">
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
                          {formatDate(c.occurredAt)}
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
                    <Button size="sm" className="mt-4">
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
                          Due: {formatDate(n.dueAt)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                label="Category"
                value={categoryLabels[incident.category]}
                icon={AlertTriangle}
              />
              <InfoRow
                label="Source"
                value={sourceLabels[incident.source]}
                icon={Activity}
              />
              {incident.sourceRef && (
                <InfoRow label="Source Reference" value={incident.sourceRef} />
              )}
              <Separator className="my-3" />
              <InfoRow
                label="Incident Type"
                value={incident.incidentType?.name}
              />
              <InfoRow
                label="Attack Vector"
                value={incident.attackVector?.name}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                label="Detected"
                value={formatDate(incident.detectedAt)}
                icon={Clock}
              />
              <InfoRow
                label="Occurred"
                value={formatDate(incident.occurredAt)}
                icon={Calendar}
              />
              <InfoRow
                label="Reported"
                value={formatDate(incident.reportedAt)}
              />
              <InfoRow
                label="Classified"
                value={formatDate(incident.classifiedAt)}
              />
              <Separator className="my-3" />
              <InfoRow
                label="Contained"
                value={formatDate(incident.containedAt)}
              />
              <InfoRow
                label="Eradicated"
                value={formatDate(incident.eradicatedAt)}
              />
              <InfoRow
                label="Recovered"
                value={formatDate(incident.recoveredAt)}
              />
              <InfoRow
                label="Closed"
                value={formatDate(incident.closedAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                label="Reporter"
                value={getUserName(incident.reporter)}
                icon={User}
              />
              <InfoRow
                label="Handler"
                value={getUserName(incident.handler)}
                icon={User}
              />
              <InfoRow
                label="Incident Manager"
                value={getUserName(incident.incidentManager)}
                icon={User}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Affected Assets</span>
                </div>
                <Badge variant="secondary">
                  {incident._count?.affectedAssets || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Evidence</span>
                </div>
                <Badge variant="secondary">
                  {incident._count?.evidence || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Notifications</span>
                </div>
                <Badge variant="secondary">
                  {incident._count?.notifications || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

