import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getChange,
  getApprovalsByChange,
  deleteChange,
  submitChange,
  type Change,
  type ChangeApproval,
} from '@/lib/itsm-api';

import { ChangeOverviewTab } from '@/components/itsm/tabs/change/change-overview-tab';
import { ChangePlanningTab } from '@/components/itsm/tabs/change/change-planning-tab';
import { ChangeApprovalsTab } from '@/components/itsm/tabs/change/change-approvals-tab';
import { ChangeAssetsTab } from '@/components/itsm/tabs/change/change-assets-tab';
import { ChangeHistoryTab } from '@/components/itsm/tabs/change/change-history-tab';

export default function ChangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [change, setChange] = useState<Change | null>(null);
  const [approvals, setApprovals] = useState<ChangeApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [changeData, approvalsData] = await Promise.all([
        getChange(id!),
        getApprovalsByChange(id!),
      ]);
      setChange(changeData);
      setApprovals(approvalsData);
    } catch (err) {
      console.error('Failed to load change:', err);
      toast.error('Failed to load change');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      await submitChange(id!);
      toast.success('Change submitted for approval');
      loadData();
    } catch (err) {
      toast.error('Failed to submit change');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this change?')) return;
    try {
      await deleteChange(id!);
      toast.success('Change deleted');
      navigate('/itsm/changes');
    } catch (err) {
      toast.error('Failed to delete change');
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!change) {
    return <div className="p-6">Change not found</div>;
  }

  const priorityColors = {
    CRITICAL: 'destructive',
    HIGH: 'default',
    MEDIUM: 'secondary',
    LOW: 'outline',
  };

  const typeColors = {
    EMERGENCY: 'destructive',
    NORMAL: 'default',
    STANDARD: 'secondary',
  };

  const canSubmit = change.status === 'DRAFTED';
  const canDelete = ['DRAFTED', 'CANCELLED'].includes(change.status);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/itsm/changes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{change.title}</h1>
              <Badge variant={typeColors[change.changeType] as any}>{change.changeType}</Badge>
              <Badge variant={priorityColors[change.priority] as any}>{change.priority}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{change.changeRef}</span>
              <span>•</span>
              <span>{change.category.replace(/_/g, ' ')}</span>
              <span>•</span>
              <Badge variant={change.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {change.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <Button variant="default" size="sm" onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/itsm/changes/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="planning">Planning & Risk</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({approvals.length})</TabsTrigger>
          <TabsTrigger value="assets">Affected Assets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ChangeOverviewTab change={change} />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <ChangePlanningTab change={change} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <ChangeApprovalsTab change={change} approvals={approvals} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <ChangeAssetsTab change={change} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ChangeHistoryTab change={change} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
