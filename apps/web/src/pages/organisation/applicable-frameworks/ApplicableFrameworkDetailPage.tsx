import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileCheck,
  Shield,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowLeft,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";

interface ApplicableFramework {
  id: string;
  frameworkCode: string;
  name: string;
  frameworkType: string;
  description?: string;
  version?: string;
  isApplicable: boolean;
  applicabilityReason?: string;
  applicabilityDate?: string;
  assessedById?: string;
  complianceStatus: string;
  compliancePercentage?: number;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  supervisoryAuthority?: string;
  authorityContact?: string;
  registrationNumber?: string;
  registrationDate?: string;
  isCertifiable: boolean;
  certificationStatus?: string;
  certificationBody?: string;
  certificateNumber?: string;
  certificationDate?: string;
  certificationExpiry?: string;
  keyRequirements?: string[];
  applicableControls?: string[];
  notes?: string;
  createdBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  updatedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const complianceStatusLabels: Record<string, string> = {
  not_assessed: "Not Assessed",
  non_compliant: "Non-Compliant",
  partially_compliant: "Partially Compliant",
  compliant: "Compliant",
  certified: "Certified",
};

const frameworkTypeLabels: Record<string, string> = {
  regulation: "Regulation",
  standard: "Standard",
  framework: "Framework",
  law: "Law",
  directive: "Directive",
  guideline: "Guideline",
};

async function getFramework(id: string): Promise<ApplicableFramework> {
  const res = await fetch(`/api/organisation/applicable-frameworks/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch framework');
  return res.json();
}

export default function ApplicableFrameworkDetailPage() {
  const { frameworkId } = useParams<{ frameworkId: string }>();
  const [loading, setLoading] = useState(true);
  const [framework, setFramework] = useState<ApplicableFramework | null>(null);

  useEffect(() => {
    if (frameworkId) {
      loadData(frameworkId);
    }
  }, [frameworkId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const data = await getFramework(id);
      setFramework(data);
    } catch (err) {
      console.error("Error loading framework:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!framework) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/organisation/applicable-frameworks">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Framework not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/organisation/applicable-frameworks">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{framework.name}</h1>
              {framework.isApplicable ? (
                <Badge variant="default" className="bg-success">Applicable</Badge>
              ) : (
                <Badge variant="secondary">Not Applicable</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {framework.frameworkCode} • {frameworkTypeLabels[framework.frameworkType] || framework.frameworkType}
              {framework.version && ` • v${framework.version}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
          <RecordActionsMenu
            recordType="applicable-framework"
            recordId={framework.id}
            recordName={framework.name}
          />
        </div>
      </div>

      {framework.description && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{framework.description}</p>
          </CardContent>
        </Card>
      )}

      <ArcherTabs defaultValue="overview" syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="compliance">Compliance</ArcherTabsTrigger>
          <ArcherTabsTrigger value="certification">Certification</ArcherTabsTrigger>
          <ArcherTabsTrigger value="requirements">Requirements</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Applicability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {framework.isApplicable ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {framework.isApplicable ? "This framework applies to your organization" : "This framework does not apply"}
                    </p>
                    {framework.applicabilityDate && (
                      <p className="text-xs text-muted-foreground">
                        Assessed on {new Date(framework.applicabilityDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {framework.applicabilityReason && (
                  <div>
                    <p className="text-xs text-muted-foreground">Reason</p>
                    <p className="text-sm mt-1">{framework.applicabilityReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Supervisory Authority
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {framework.supervisoryAuthority ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Authority</p>
                      <p className="text-sm font-medium">{framework.supervisoryAuthority}</p>
                    </div>
                    {framework.authorityContact && (
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="text-sm">{framework.authorityContact}</p>
                      </div>
                    )}
                    {framework.registrationNumber && (
                      <div>
                        <p className="text-xs text-muted-foreground">Registration Number</p>
                        <p className="text-sm font-mono">{framework.registrationNumber}</p>
                      </div>
                    )}
                    {framework.registrationDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Registration Date</p>
                        <p className="text-sm">{new Date(framework.registrationDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No supervisory authority specified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {framework.notes && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{framework.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p>{new Date(framework.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p>{framework.createdBy?.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p>{new Date(framework.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated By</p>
                  <p>{framework.updatedBy?.email || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm">
                  {complianceStatusLabels[framework.complianceStatus] || framework.complianceStatus}
                </Badge>
                {framework.compliancePercentage !== undefined && (
                  <span className="text-2xl font-bold">{framework.compliancePercentage}%</span>
                )}
              </div>
              {framework.compliancePercentage !== undefined && (
                <Progress value={framework.compliancePercentage} className="h-3" />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Last Assessment</p>
                  <p>{framework.lastAssessmentDate ? new Date(framework.lastAssessmentDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Assessment</p>
                  <p>{framework.nextAssessmentDate ? new Date(framework.nextAssessmentDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {framework.applicableControls && framework.applicableControls.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Applicable Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {framework.applicableControls.map((control, i) => (
                    <Badge key={i} variant="outline">
                      {control}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </ArcherTabsContent>

        <ArcherTabsContent value="certification">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {framework.isCertifiable ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant={framework.certificationStatus === "certified" ? "default" : "secondary"}>
                      {framework.certificationStatus || "Not Certified"}
                    </Badge>
                  </div>
                  {framework.certificationBody && (
                    <div>
                      <p className="text-xs text-muted-foreground">Certification Body</p>
                      <p className="text-sm">{framework.certificationBody}</p>
                    </div>
                  )}
                  {framework.certificateNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Certificate Number</p>
                      <p className="text-sm font-mono">{framework.certificateNumber}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Certification Date</p>
                      <p>{framework.certificationDate ? new Date(framework.certificationDate).toLocaleDateString() : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry Date</p>
                      <p>{framework.certificationExpiry ? new Date(framework.certificationExpiry).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">This framework is not certifiable</p>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="requirements">
          {framework.keyRequirements && framework.keyRequirements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {framework.keyRequirements.map((req, i) => (
                    <Badge key={i} variant="outline">
                      {req}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No key requirements defined
              </CardContent>
            </Card>
          )}
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            recordType="applicable-framework"
            recordId={framework.id}
          />
        </ArcherTabsContent>
      </ArcherTabs>
    </div>
  );
}
