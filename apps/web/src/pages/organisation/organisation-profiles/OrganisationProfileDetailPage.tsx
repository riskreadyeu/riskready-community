
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Edit3,
  Trash2,
  Users,
  Calendar,
  Award,
  Shield,
  Globe,
  Mail,
  Target,
  TrendingUp,
  DollarSign,
  Phone,
  MapPin,
  FileText,
  Leaf,
  LayoutDashboard,
  Banknote,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ConfirmDialog,
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import { getOrganisationProfile, type OrganisationProfile } from "@/lib/organisation-api";
import { DetailHero } from "@/components/controls/detail-components/detail-hero";
import { cn } from "@/lib/utils";

// Certification status configuration with consistent GRC color semantics
const CERTIFICATION_STATUS_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  label: string;
  icon: typeof CheckCircle2;
}> = {
  Certified: {
    color: "text-success",
    bgColor: "bg-success/10",
    label: "ISO 27001 Certified",
    icon: CheckCircle2
  },
  Pending: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Certification Pending",
    icon: Clock
  },
  Expired: {
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Certification Expired",
    icon: AlertCircle
  },
  None: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Not Certified",
    icon: Shield
  },
};

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 ml-2 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

export default function OrganisationProfileDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [profile, setProfile] = useState<OrganisationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const data = await getOrganisationProfile(profileId);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  const handleDelete = async () => {
    if (!profileId) return;
    setIsDeleting(true);
    try {
      // TODO: Implement delete API call when available
      // await deleteOrganisationProfile(id);
      toast.success("Organisation profile deleted");
      navigate("/organisation/profiles");
    } catch (err) {
      toast.error("Failed to delete profile");
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  // Helper to calculate days until certification expires
  const getDaysUntilExpiry = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to get certification status color for stats card
  const getCertificationColor = (status: string | null | undefined) => {
    const config = CERTIFICATION_STATUS_CONFIG[status || "None"]!;
    return { color: config.color, bgColor: config.bgColor };
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Profile Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The organisation profile could not be loaded.
          </p>
          <Button onClick={() => navigate("/organisation/profiles")} className="mt-4">
            Back to Profiles
          </Button>
        </div>
      </div>
    );
  }

  const certStatus = profile.isoCertificationStatus || "None";
  const certConfig = (CERTIFICATION_STATUS_CONFIG[certStatus] ?? CERTIFICATION_STATUS_CONFIG["None"])!;
  const CertIcon = certConfig.icon;
  const daysUntilExpiry = getDaysUntilExpiry(profile.certificationExpiry);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <DetailHero
        backLink="/organisation/profiles"
        backLabel="Back to Organisation Profiles"
        icon={<Building2 className="w-6 h-6 text-primary" />}
        iconBg="bg-primary/10"
        badge={
          <>
            {profile.parentOrganization && (
              <Badge variant="outline" className="text-muted-foreground">
                Subsidiary
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn("border-transparent", certConfig.bgColor, certConfig.color)}
            >
              <CertIcon className="w-3 h-3 mr-1" />
              {certConfig.label}
            </Badge>
            {profile.industrySector && (
              <Badge variant="outline">{profile.industrySector}</Badge>
            )}
          </>
        }
        title={profile.name}
        subtitle={profile.legalName !== profile.name ? profile.legalName : undefined}
        description={profile.description || undefined}
        metadata={[
          ...(profile.employeeCount ? [{ label: "Employees", value: profile.employeeCount.toLocaleString(), icon: <Users className="w-3 h-3" /> }] : []),
          ...(profile.operatingCountries?.[0] ? [{ label: "HQ", value: profile.operatingCountries[0], icon: <MapPin className="w-3 h-3" /> }] : []),
          ...(profile.foundedYear ? [{ label: "Founded", value: String(profile.foundedYear), icon: <Calendar className="w-3 h-3" /> }] : []),
        ]}
        actions={
          <>
            <RecordActionsMenu
              onEdit={() => toast.info("Edit functionality coming soon")}
              onDelete={() => setDeleteOpen(true)}
            />
            <Button variant="outline" size="sm" onClick={() => toast.info("Edit functionality coming soon")}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </>
        }
        statusColor={
          profile.isoCertificationStatus === "Certified" ? "success" :
          profile.isoCertificationStatus === "Pending" ? "warning" :
          profile.isoCertificationStatus === "Expired" ? "destructive" : "muted"
        }
      />

      {/* Certification Alert Banner */}
      {(profile.isoCertificationStatus === "Expired" || (daysUntilExpiry !== null && daysUntilExpiry <= 90 && daysUntilExpiry > 0)) && (
        <Card className={cn(
          "border-l-4",
          profile.isoCertificationStatus === "Expired"
            ? "border-l-destructive bg-destructive/5"
            : "border-l-warning bg-warning/5"
        )}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className={cn(
                "w-5 h-5",
                profile.isoCertificationStatus === "Expired" ? "text-destructive" : "text-warning"
              )} />
              <div>
                <p className="font-medium">
                  {profile.isoCertificationStatus === "Expired"
                    ? "ISO 27001 Certification has expired"
                    : `ISO 27001 Certification expires in ${daysUntilExpiry} days`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.isoCertificationStatus === "Expired"
                    ? "Renew certification to maintain compliance status"
                    : "Schedule recertification audit to maintain compliance"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Headquarters</p>
                <p className="text-2xl font-bold truncate" title={profile.operatingCountries?.[0]}>
                  {profile.operatingCountries?.[0] || "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.registeredAddress?.split(',')[0] || ""}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-2xl font-bold truncate" title={profile.industrySector}>
                  {profile.industrySector || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.marketPosition || ""}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Certification</p>
                <p className={cn("text-2xl font-bold", certConfig.color)}>
                  {profile.isoCertificationStatus || "None"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.certificationExpiry
                    ? `Expires: ${new Date(profile.certificationExpiry).toLocaleDateString()}`
                    : "No expiry date"}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", certConfig.bgColor)}>
                <Award className={cn("w-5 h-5", certConfig.color)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">
                  {profile.employeeCount?.toLocaleString() || "—"}
                </p>
                <p className={cn(
                  "text-xs",
                  (profile.employeeGrowthRate || 0) >= 0 ? "text-success" : "text-destructive"
                )}>
                  {profile.employeeGrowthRate
                    ? `${profile.employeeGrowthRate > 0 ? "+" : ""}${profile.employeeGrowthRate}% growth`
                    : "FTE count"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <div className="space-y-6">
        <ArcherTabs defaultValue="overview" className="w-full" syncWithUrl>
          <ArcherTabsList className="grid w-full grid-cols-6">
            <ArcherTabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </ArcherTabsTrigger>
            <ArcherTabsTrigger value="financial" className="gap-2">
              <Banknote className="w-4 h-4" />
              Financial
            </ArcherTabsTrigger>
            <ArcherTabsTrigger value="isms" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              ISMS
            </ArcherTabsTrigger>
            <ArcherTabsTrigger value="strategy" className="gap-2">
              <Target className="w-4 h-4" />
              Strategy
            </ArcherTabsTrigger>
            <ArcherTabsTrigger value="sustainability" className="gap-2">
              <Leaf className="w-4 h-4" />
              ESG
            </ArcherTabsTrigger>
            <ArcherTabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              History
            </ArcherTabsTrigger>
          </ArcherTabsList>

          {/* Overview Tab */}
          <ArcherTabsContent value="overview" className="space-y-6 mt-6">
            {/* Two-column layout for Organisation Details and Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Organisation Details */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Organisation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Legal Name</p>
                      <p className="font-medium">{profile.legalName || profile.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Founded</p>
                      <p className="font-medium">{profile.foundedYear || "Not specified"}</p>
                    </div>
                  </div>
                  {profile.parentOrganization && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Parent Company</p>
                        <p className="font-medium">{profile.parentOrganization}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Headquarters</p>
                      <p className="font-medium">{profile.operatingCountries?.[0] || profile.headquartersAddress || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Globe className="w-5 h-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Website</p>
                      {profile.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:underline truncate block"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        <p className="font-medium text-muted-foreground">Not specified</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Primary Contact</p>
                      {profile.contactEmail ? (
                        <a href={`mailto:${profile.contactEmail}`} className="font-medium truncate block">
                          {profile.contactEmail}
                        </a>
                      ) : (
                        <p className="font-medium text-muted-foreground">Not specified</p>
                      )}
                    </div>
                  </div>
                  {profile.contactPhone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.contactPhone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Registered Address</p>
                      <p className="font-medium">{profile.registeredAddress || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Legal Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Legal & Regulatory Identifiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Registration Number</p>
                    <div className="flex items-center">
                      <p className="font-mono font-medium">{profile.registrationNumber || "—"}</p>
                      {profile.registrationNumber && (
                        <CopyButton value={profile.registrationNumber} label="Registration Number" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Tax ID</p>
                    <div className="flex items-center">
                      <p className="font-mono font-medium">{profile.taxIdentification || "—"}</p>
                      {profile.taxIdentification && (
                        <CopyButton value={profile.taxIdentification} label="Tax ID" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">DUNS Number</p>
                    <div className="flex items-center">
                      <p className="font-mono font-medium">{profile.dunsNumber || "—"}</p>
                      {profile.dunsNumber && (
                        <CopyButton value={profile.dunsNumber} label="DUNS Number" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">LEI Code</p>
                    <div className="flex items-center">
                      <p className="font-mono font-medium">{profile.leiCode || "—"}</p>
                      {profile.leiCode && (
                        <CopyButton value={profile.leiCode} label="LEI Code" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Stock Symbol</p>
                    <p className="font-mono font-medium">{profile.stockSymbol || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">NACE Code</p>
                    <p className="font-mono font-medium">{profile.naceCode || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">SIC Code</p>
                    <p className="font-mono font-medium">{profile.sicCode || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArcherTabsContent>

          {/* Financial Tab */}
          <ArcherTabsContent value="financial" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Annual Revenue</p>
                    <p className="text-lg font-bold">
                      {profile.annualRevenue
                        ? `${profile.revenueCurrency || 'USD'} ${Number(profile.annualRevenue).toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Revenue Trend</p>
                    <p className={cn(
                      "font-medium capitalize",
                      profile.revenueTrend === "growing" ? "text-success" :
                      profile.revenueTrend === "declining" ? "text-destructive" : ""
                    )}>
                      {profile.revenueTrend || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Fiscal Year</p>
                    <p className="font-medium">
                      {profile.fiscalYearStart && profile.fiscalYearEnd
                        ? `${profile.fiscalYearStart} - ${profile.fiscalYearEnd}`
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Reporting Currency</p>
                    <p className="font-medium">{profile.reportingCurrency || "—"}</p>
                  </div>
                </div>
                {profile.revenueStreams && profile.revenueStreams.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-3">Revenue Streams</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.revenueStreams.map((stream, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1">
                          {stream}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ArcherTabsContent>

          {/* ISMS Tab */}
          <ArcherTabsContent value="isms" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ISMS Details */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    ISMS Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">ISMS Scope</p>
                    <p className="text-sm font-medium">
                      {profile.ismsScope || "Not defined"}
                    </p>
                  </div>
                  {profile.scopeExclusions && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs text-muted-foreground mb-1">Scope Exclusions</p>
                      <p className="text-sm font-medium">{profile.scopeExclusions}</p>
                    </div>
                  )}
                  {profile.exclusionJustification && (
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Exclusion Justification</p>
                      <p className="text-sm">{profile.exclusionJustification}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Risk Appetite</p>
                    <p className={cn(
                      "text-lg font-bold capitalize",
                      profile.riskAppetite === "low" ? "text-success" :
                      profile.riskAppetite === "medium" ? "text-warning" :
                      profile.riskAppetite === "high" ? "text-destructive" : ""
                    )}>
                      {profile.riskAppetite || "Not defined"}
                    </p>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Risk tolerance details are configured at the organisation level
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ArcherTabsContent>

          {/* Strategy Tab */}
          <ArcherTabsContent value="strategy" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mission & Vision */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Mission & Vision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Mission Statement</p>
                    <p className="text-sm font-medium">
                      {profile.missionStatement || "Not defined"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Vision Statement</p>
                    <p className="text-sm font-medium">
                      {profile.visionStatement || "Not defined"}
                    </p>
                  </div>
                  {profile.coreValues && profile.coreValues.length > 0 && (
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-2">Core Values</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.coreValues.map((v, i) => (
                          <Badge key={i} variant="outline" className="bg-primary/10">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Model */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Business Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Business Model</p>
                    <p className="text-sm font-medium">
                      {profile.businessModel || "Not defined"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Value Proposition</p>
                    <p className="text-sm font-medium">
                      {profile.valueProposition || "Not defined"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strategic Objectives */}
            {profile.strategicObjectives && profile.strategicObjectives.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Strategic Objectives
                    </CardTitle>
                    <Badge variant="secondary">{profile.strategicObjectives.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.strategicObjectives.map((objective, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/30 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <p className="text-sm">{objective}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </ArcherTabsContent>

          {/* Sustainability Tab */}
          <ArcherTabsContent value="sustainability" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-success" />
                  Sustainability & ESG
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ESG Rating */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold",
                    profile.esgRating ? "bg-success/20 text-success" : "bg-muted"
                  )}>
                    {profile.esgRating || "—"}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ESG Rating</p>
                    <p className="font-medium">
                      {profile.esgRating
                        ? `Current ESG rating: ${profile.esgRating}`
                        : "No ESG rating available"}
                    </p>
                  </div>
                </div>

                {/* Sustainability Goals */}
                {profile.sustainabilityGoals && profile.sustainabilityGoals.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Sustainability Goals</p>
                      <Badge variant="secondary">{profile.sustainabilityGoals.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {profile.sustainabilityGoals.map((goal, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/30 transition-colors">
                          <Leaf className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <p className="text-sm">{goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No sustainability goals defined yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ArcherTabsContent>

          {/* History Tab */}
          <ArcherTabsContent value="history" className="space-y-6 mt-6">
            <HistoryTab
              entityType="organisation_profile"
              entityId={profileId || ""}
            />
          </ArcherTabsContent>
        </ArcherTabs>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Organisation Profile"
        description={`Are you sure you want to delete "${profile.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div >
  );
}
