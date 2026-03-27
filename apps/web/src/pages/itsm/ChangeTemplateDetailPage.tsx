import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileText,
  Play,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getChangeTemplate,
  updateChangeTemplate,
  deleteChangeTemplate,
  createChangeFromTemplate,
  type ChangeTemplate,
} from '@/lib/itsm-api';

const securityImpactVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'destructive',
  MEDIUM: 'secondary',
  LOW: 'outline',
  NONE: 'outline',
};

export default function ChangeTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ChangeTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadTemplate();
  }, [id]);

  async function loadTemplate() {
    setLoading(true);
    try {
      const data = await getChangeTemplate(id!);
      setTemplate(data);
    } catch (err) {
      console.error('Failed to load change template:', err);
      toast.error('Failed to load change template');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!template) return;
    try {
      await updateChangeTemplate(template.id, { isActive: !template.isActive });
      toast.success(`Template ${template.isActive ? 'deactivated' : 'activated'}`);
      loadTemplate();
    } catch (err) {
      toast.error('Failed to update template');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;
    try {
      await deleteChangeTemplate(id!);
      toast.success('Template deleted');
      navigate('/itsm/change-templates');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  }

  async function handleCreateFromTemplate() {
    if (!template) return;
    try {
      const change = await createChangeFromTemplate(template.id, {});
      toast.success('Change created from template');
      navigate(`/itsm/changes/${change.id}`);
    } catch (err) {
      toast.error('Failed to create change from template');
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading change template...</div>;
  }

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">Change template not found</div>
        <Button variant="link" onClick={() => navigate('/itsm/change-templates')}>
          Return to Change Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => navigate('/itsm/change-templates')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Change Templates
            </Button>
            <span>/</span>
            <span className="font-mono">{template.templateCode}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            {template.name}
            <Badge variant={template.isActive ? 'default' : 'outline'}>
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleCreateFromTemplate}>
            <Play className="h-4 w-4 mr-2" />
            Create Change
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/itsm/change-templates/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            {template.isActive ? (
              <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
            ) : (
              <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Description */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{template.description}</p>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge variant="outline">{template.category.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Security Impact</span>
              <Badge variant={securityImpactVariants[template.securityImpact] || 'outline'}>
                {template.securityImpact}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              <span className="text-sm font-medium capitalize">{template.riskLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Auto Approve</span>
              {template.autoApprove ? (
                <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">No</span>
              )}
            </div>
            {template.maxDuration && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Duration</span>
                <span className="text-sm font-mono">{template.maxDuration} min</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Implementation Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-md p-4">
              {template.instructions}
            </pre>
          </CardContent>
        </Card>

        {/* Backout Plan */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Backout Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-md p-4">
              {template.backoutPlan}
            </pre>
          </CardContent>
        </Card>

        {/* Test Plan */}
        {template.testPlan && (
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Test Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-md p-4">
                {template.testPlan}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Applicable Asset Types */}
        {template.applicableAssetTypes && template.applicableAssetTypes.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Applicable Asset Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.applicableAssetTypes.map((t: string) => (
                  <Badge key={t} variant="outline" className="text-xs">{t.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Trail */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Template Code</span>
              <span className="text-sm font-mono">{template.templateCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{new Date(template.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Updated</span>
              <span className="text-sm">{new Date(template.updatedAt).toLocaleDateString()}</span>
            </div>
            {template.lastReviewDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Reviewed</span>
                <span className="text-sm">{new Date(template.lastReviewDate).toLocaleDateString()}</span>
              </div>
            )}
            {template.nextReviewDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Review</span>
                <span className="text-sm">{new Date(template.nextReviewDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
