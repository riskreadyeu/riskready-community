import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Shield,
  Mail,
  Phone,
  Building2,
  UserCheck,
  GraduationCap,
  Calendar,
  Award,
  ArrowLeft,
  Edit3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArcherTabs, ArcherTabsList, ArcherTabsTrigger, ArcherTabsContent, HistoryTab, RecordActionsMenu } from "@/components/common";

interface KeyPerson {
  id: string;
  personCode: string;
  name: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  ismsRole: string;
  securityResponsibilities?: string;
  authorityLevel?: string;
  backupPerson?: {
    id: string;
    personCode: string;
    name: string;
    jobTitle: string;
    email?: string;
    phone?: string;
  };
  backupFor?: Array<{
    id: string;
    personCode: string;
    name: string;
    jobTitle: string;
  }>;
  trainingCompleted: boolean;
  lastTrainingDate?: string;
  certifications?: string[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
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

const ismsRoleLabels: Record<string, string> = {
  isms_owner: "ISMS Owner",
  isms_manager: "ISMS Manager",
  ciso: "CISO",
  dpo: "Data Protection Officer",
  risk_owner: "Risk Owner",
  asset_owner: "Asset Owner",
  control_owner: "Control Owner",
  internal_auditor: "Internal Auditor",
  security_officer: "Security Officer",
  compliance_officer: "Compliance Officer",
  it_manager: "IT Manager",
  hr_manager: "HR Manager",
  legal_counsel: "Legal Counsel",
  executive_sponsor: "Executive Sponsor",
};

async function getKeyPerson(id: string): Promise<KeyPerson> {
  const res = await fetch(`/api/organisation/key-personnel/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch key person');
  return res.json();
}

export default function KeyPersonnelDetailPage() {
  const { personnelId } = useParams<{ personnelId: string }>();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<KeyPerson | null>(null);

  useEffect(() => {
    if (personnelId) {
      loadData(personnelId);
    }
  }, [personnelId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const data = await getKeyPerson(id);
      setPerson(data);
    } catch (err) {
      console.error("Error loading key person:", err);
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

  if (!person) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/organisation/key-personnel">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Key personnel not found
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
            <Link to="/organisation/key-personnel">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
              <Badge variant={person.isActive ? "default" : "secondary"}>
                {person.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {person.personCode} • {person.jobTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
          <RecordActionsMenu />
        </div>
      </div>

      <ArcherTabs syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{person.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Job Title</p>
                <p className="text-sm font-medium">{person.jobTitle}</p>
              </div>
            </div>
            {person.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${person.email}`} className="text-sm text-primary hover:underline">
                  {person.email}
                </a>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{person.phone}</span>
              </div>
            )}
            {person.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Started: {new Date(person.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ISMS Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge variant="outline" className="mt-1 bg-primary/5">
                {ismsRoleLabels[person.ismsRole] || person.ismsRole}
              </Badge>
            </div>
            {person.authorityLevel && (
              <div>
                <p className="text-xs text-muted-foreground">Authority Level</p>
                <p className="text-sm font-medium capitalize">{person.authorityLevel}</p>
              </div>
            )}
            {person.securityResponsibilities && (
              <div>
                <p className="text-xs text-muted-foreground">Security Responsibilities</p>
                <p className="text-sm mt-1">{person.securityResponsibilities}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Backup & Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {person.backupPerson ? (
              <div>
                <p className="text-xs text-muted-foreground">Backup Person</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-xs font-medium text-success">
                    {person.backupPerson.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <Link
                      to={`/organisation/key-personnel/${person.backupPerson.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {person.backupPerson.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{person.backupPerson.jobTitle}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-warning">No backup person assigned</p>
            )}

            {person.backupFor && person.backupFor.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Backup For</p>
                  <div className="space-y-2">
                    {person.backupFor.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-muted-foreground" />
                        <Link
                          to={`/organisation/key-personnel/${p.id}`}
                          className="text-sm hover:underline"
                        >
                          {p.name}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Training & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {person.trainingCompleted ? (
                <>
                  <Badge variant="default" className="bg-success">Training Completed</Badge>
                  {person.lastTrainingDate && (
                    <span className="text-xs text-muted-foreground">
                      Last: {new Date(person.lastTrainingDate).toLocaleDateString()}
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  Training Pending
                </Badge>
              )}
            </div>

            {person.certifications && person.certifications.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {person.certifications.map((cert, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      <Award className="h-3 w-3" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p>{new Date(person.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p>{person.createdBy?.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p>{new Date(person.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated By</p>
                  <p>{person.updatedBy?.email || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            createdAt={person.createdAt}
            updatedAt={person.updatedAt}
            entityType="Key Personnel"
          />
        </ArcherTabsContent>
      </ArcherTabs>
    </div>
  );
}
