import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Network,
  Shield,
  AlertCircle,
  ArrowRight,
  MapPin,
  Briefcase,
  FileText,
  Calendar,
  CheckSquare,
  Package,
  Server,
  MoreHorizontal,
  Globe,
  TrendingUp,
  Award,
  ChevronRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LocationMap } from "@/components/dashboard/LocationMap";
import { DetailHero } from "@/components/controls/detail-components/detail-hero";
import { cn } from "@/lib/utils";
import {
  getDashboardOverview,
  getDashboardInsights,
  getActionItemsSummary,
  getUpcomingMeetings,
  getDepartmentSummary,
  getLocations,
  getProfileDashboardSummary,
  getSecurityCommittees,
  getExecutivePositions,
  type DashboardOverview,
  type DashboardInsightsResponse,
  type CommitteeMeeting,
  type Location,
  type OrganisationProfile,
  type SecurityCommittee,
  type ExecutivePosition,
} from "@/lib/organisation-api";

export default function OrganisationDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(null);
  const [actionSummary, setActionSummary] = useState<{ total: number; open: number; overdue: number } | null>(null);
  const [departmentSummary, setDepartmentSummary] = useState<{ total: number; active: number; totalHeadcount: number; totalBudget: string } | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<CommitteeMeeting[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profile, setProfile] = useState<OrganisationProfile | null>(null);
  const [committees, setCommittees] = useState<SecurityCommittee[]>([]);
  const [executives, setExecutives] = useState<ExecutivePosition[]>([]);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, insightsData, actionData, meetingsData, deptData, locData, profileData, committeesData, execData] = await Promise.all([
        getDashboardOverview(),
        getDashboardInsights(),
        getActionItemsSummary(),
        getUpcomingMeetings(14),
        getDepartmentSummary(),
        getLocations({ take: 100 }), // Fetch all active locations for map
        getProfileDashboardSummary(),
        getSecurityCommittees({ take: 5, isActive: true }),
        getExecutivePositions({ take: 5, isActive: true }),
      ]);
      setOverview(overviewData);
      setInsights(insightsData);
      setActionSummary(actionData);
      setUpcomingMeetings(meetingsData);
      setDepartmentSummary(deptData);
      setLocations(locData.results);
      setProfile(profileData);
      setCommittees(committeesData.results);
      setExecutives(execData.results);

    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load organisation dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Determine overall status for the hero
  const getOverallStatus = () => {
    if (actionSummary?.overdue && actionSummary.overdue > 0) return "warning";
    return "success";
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Failed to Load Dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <DetailHero
        icon={<Building2 className="w-6 h-6 text-primary" />}
        iconBg="bg-primary/10"
        badge={
          <>
            {profile?.industrySector && (
              <Badge variant="outline">{profile.industrySector}</Badge>
            )}
          </>
        }
        title={profile?.name || overview?.companyName || "Organisation Dashboard"}
        description="Structure, governance, and compliance overview"
        metadata={[
          { label: "Departments", value: String(overview?.departments ?? 0), icon: <Building2 className="w-3 h-3" /> },
          { label: "Locations", value: String(overview?.locations ?? 0), icon: <MapPin className="w-3 h-3" /> },
          { label: "Employees", value: profile?.employeeCount?.toLocaleString() || String(departmentSummary?.totalHeadcount || 0), icon: <Users className="w-3 h-3" /> },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/organisation/profiles/${profile?.id}`}>
                <Briefcase className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </Button>
          </>
        }
        statusColor={getOverallStatus()}
      />

      {/* Alert Banners */}
      {actionSummary?.overdue && actionSummary.overdue > 0 && (
        <div className="space-y-3">
          <Card className="border-l-4 border-l-destructive bg-destructive/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-medium">{actionSummary.overdue} Overdue Action Items</p>
                    <p className="text-sm text-muted-foreground">
                      Review and address overdue governance actions
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/organisation/meeting-action-items?status=overdue">
                    View Items <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link to="/organisation/departments" className="block group">
          <Card className="glass-card h-full hover:bg-accent/50 transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Departments</p>
                  <p className="text-2xl font-bold">{overview?.departments ?? 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organisation/locations" className="block group">
          <Card className="glass-card h-full hover:bg-accent/50 transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Locations</p>
                  <p className="text-2xl font-bold">{overview?.locations ?? 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organisation/business-processes" className="block group">
          <Card className="glass-card h-full hover:bg-accent/50 transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Processes</p>
                  <p className="text-2xl font-bold">{overview?.processes ?? 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Network className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organisation/security-committees" className="block group">
          <Card className="glass-card h-full hover:bg-accent/50 transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Committees</p>
                  <p className="text-2xl font-bold">{overview?.committees ?? 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Shield className="w-5 h-5 text-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organisation/products-services" className="block group">
          <Card className="glass-card h-full hover:bg-accent/50 transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{overview?.products ?? 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organisation/technology-platforms" className="block group">
          <Card className="glass-card h-full hover:bg-accent/50 transition-all">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Platforms</p>
                  <p className="text-2xl font-bold">{overview?.platforms ?? 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Server className="w-5 h-5 text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Insights Banner */}
      {insights && insights.count > 0 && (
        <Card className="glass-card border-l-4 border-l-orange-500">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
              <h3 className="font-semibold">AI Organisation Insights</h3>
              <Badge variant="secondary">{insights.count} Updates</Badge>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {insights.insights.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/30">
                  <div className={cn(
                    "mt-0.5 p-1.5 rounded-full shrink-0",
                    insight.priority === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-500'
                  )}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>
                    {insight.link && (
                      <Link to={insight.link} className="text-xs text-primary mt-2 inline-flex items-center hover:underline">
                        Take Action <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Split */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left Col: Profile & Context */}
        <div className="space-y-6">
          {/* Organisation Profile Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Organisation Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {profile?.name?.[0] || overview?.companyName?.[0] || "O"}
                </div>
                <div>
                  <h3 className="font-bold">{profile?.name || overview?.companyName || "Organisation"}</h3>
                  <Badge variant="outline" className="mt-1">{profile?.industrySector || "Industry"}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="font-bold">{profile?.employeeCount?.toLocaleString() || departmentSummary?.totalHeadcount || "0"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Founded</p>
                  <p className="font-bold">{profile?.foundedYear || "—"}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.isoCertificationStatus === 'Certified' ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      <Award className="w-3 h-3 mr-1" />
                      ISO 27001
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No active certifications</span>
                  )}
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/organisation/profiles/${profile?.id}`}>
                  View Full Profile <ExternalLink className="w-3 h-3 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Upcoming Meetings
                </span>
                <Badge variant="secondary">{upcomingMeetings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.slice(0, 3).map((meeting) => (
                    <Link
                      key={meeting.id}
                      to={`/organisation/committee-meetings/${meeting.id}`}
                      className="flex gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center p-2 bg-primary/10 rounded-lg text-xs w-12 h-12 shrink-0">
                        <span className="font-bold text-primary">{new Date(meeting.meetingDate).getDate()}</span>
                        <span className="text-muted-foreground">{new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{meeting.committee.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Structure & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Global Operations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Global Operations
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/organisation/locations">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Map and Stats Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Card className="glass-card overflow-hidden">
                  <LocationMap locations={locations} />
                </Card>
              </div>
              <div className="space-y-4">
                <Card className="glass-card">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Action Items</p>
                        <p className="text-2xl font-bold">{actionSummary?.open ?? 0}</p>
                        {actionSummary?.overdue && actionSummary.overdue > 0 && (
                          <p className="text-xs text-destructive mt-1">
                            {actionSummary.overdue} overdue
                          </p>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Budget</p>
                        <p className="text-2xl font-bold">
                          {departmentSummary?.totalBudget
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(Number(departmentSummary.totalBudget))
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Allocated</p>
                      </div>
                      <div className="p-2 rounded-lg bg-success/10">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Governance & Key People Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Governance Committees
                  </CardTitle>
                  <Badge variant="secondary">{committees.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {committees.length > 0 ? (
                  <div className="space-y-2">
                    {committees.map(c => (
                      <Link
                        key={c.id}
                        to={`/organisation/security-committees/${c.id}`}
                        className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-sm font-medium">{c.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {c._count?.memberships || 0} Members
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No active committees</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Key People
                  </CardTitle>
                  <Badge variant="secondary">{executives.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {executives.length > 0 ? (
                  <div className="flex gap-3 flex-wrap">
                    {executives.map(exec => (
                      <Link
                        key={exec.id}
                        to={`/organisation/executive-positions/${exec.id}`}
                        className="text-center group"
                      >
                        <Avatar className="h-12 w-12 border-2 border-background group-hover:border-primary transition-colors">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {exec.person?.firstName?.[0] || exec.holder?.firstName?.[0] || "E"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-[10px] mt-1 text-muted-foreground truncate w-14 group-hover:text-foreground transition-colors">
                          {exec.title.split(' ')[0]}
                        </p>
                      </Link>
                    ))}
                    <Link
                      to="/organisation/executive-positions"
                      className="flex items-center justify-center"
                    >
                      <Button variant="ghost" size="icon" className="rounded-full border border-dashed h-12 w-12">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No executives defined</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
