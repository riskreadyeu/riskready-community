import { useState, useEffect, useCallback } from "react";
import { Plus, Target, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchScopeItems,
  createScopeItem,
  updateScopeItem,
  deleteScopeItem,
  type ScopeItem,
  type ScopeType,
  type ScopeCriticality,
} from "@/lib/controls-api";
import {
  SCOPE_TYPE_LABELS,
  SCOPE_CRITICALITY_LABELS,
  SCOPE_CRITICALITY_COLORS,
} from "@/components/controls/control-browser/types";
import type { ScopeCriticality as ScopeCriticalityType } from "@/components/controls/control-browser/types";

const SCOPE_TYPES: ScopeType[] = [
  'APPLICATION', 'ASSET_CLASS', 'LOCATION', 'PERSONNEL_TYPE',
  'BUSINESS_UNIT', 'PLATFORM', 'PROVIDER', 'NETWORK_ZONE', 'PROCESS',
];

const CRITICALITIES: ScopeCriticality[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const formatDate = (dateString?: string) => {
  if (!dateString) return "\u2014";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ScopeRegistryPage() {
  const [items, setItems] = useState<ScopeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ScopeType | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScopeItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ScopeItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    scopeType: 'APPLICATION' as ScopeType,
    code: '',
    name: '',
    description: '',
    criticality: 'MEDIUM' as ScopeCriticality,
    isActive: true,
  });

  // TODO: Get orgId from auth context. For now use first org.
  const orgId = 'default'; // This will be replaced with actual org context

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchScopeItems(orgId, filterType === 'all' ? undefined : filterType);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load scope items');
    } finally {
      setLoading(false);
    }
  }, [orgId, filterType]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      scopeType: 'APPLICATION',
      code: '',
      name: '',
      description: '',
      criticality: 'MEDIUM',
      isActive: true,
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (item: ScopeItem) => {
    setEditingItem(item);
    setFormData({
      scopeType: item.scopeType,
      code: item.code,
      name: item.name,
      description: item.description || '',
      criticality: item.criticality,
      isActive: item.isActive,
    });
    setFormOpen(true);
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingItem) {
        await updateScopeItem(editingItem.id, {
          name: formData.name,
          description: formData.description || undefined,
          criticality: formData.criticality,
          isActive: formData.isActive,
        });
        toast.success('Scope item updated');
      } else {
        await createScopeItem({
          organisationId: orgId,
          scopeType: formData.scopeType,
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          criticality: formData.criticality,
        });
        toast.success('Scope item created');
      }
      setFormOpen(false);
      setEditingItem(null);
      loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteScopeItem(deletingItem.id);
      toast.success('Scope item deleted');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const groupedItems = items.reduce<Record<string, ScopeItem[]>>((acc, item) => {
    const key = item.scopeType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scope Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage scope items used for per-instance control testing
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={formOpen}>
          <Plus className="w-4 h-4 mr-2" />
          Add Scope Item
        </Button>
      </div>

      {/* Inline Create/Edit Form */}
      {formOpen && (
        <Card className="border-primary/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{editingItem ? 'Edit Scope Item' : 'Create Scope Item'}</CardTitle>
                <CardDescription>
                  {editingItem
                    ? 'Update the scope item details'
                    : 'Add a new scope item to the registry'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!editingItem && (
                <div className="space-y-2">
                  <Label>Scope Type</Label>
                  <Select
                    value={formData.scopeType}
                    onValueChange={(v) => setFormData({ ...formData, scopeType: v as ScopeType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{SCOPE_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!editingItem && (
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., AD, SAP-ERP, HQ-LONDON"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Active Directory, SAP ERP"
                />
              </div>
              <div className="space-y-2">
                <Label>Criticality</Label>
                <Select
                  value={formData.criticality}
                  onValueChange={(v) => setFormData({ ...formData, criticality: v as ScopeCriticality })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRITICALITIES.map((c) => (
                      <SelectItem key={c} value={c}>{SCOPE_CRITICALITY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingItem && (
                <div className="flex items-end gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formData.code || !formData.name}>
                {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={(v) => setFilterType(v as ScopeType | 'all')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SCOPE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{SCOPE_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">
          {items.length} items
        </Badge>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">No scope items found</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create scope items to enable per-instance control testing
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Scope Item
          </Button>
        </div>
      ) : (
        Object.entries(groupedItems).map(([scopeType, groupItems]) => (
          <div key={scopeType} className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              {SCOPE_TYPE_LABELS[scopeType as ScopeType] || scopeType}
              <Badge variant="secondary" className="text-[10px]">{groupItems.length}</Badge>
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[120px]">Criticality</TableHead>
                    <TableHead className="w-[80px] text-center">Tests</TableHead>
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                    <TableHead className="w-[100px]">Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupItems.map((item) => {
                    const critColors = SCOPE_CRITICALITY_COLORS[item.criticality as ScopeCriticalityType];
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-secondary/50"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <TableCell className="font-mono text-xs font-medium">{item.code}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-sm">{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground block truncate max-w-[300px]">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium",
                            critColors?.bg || '', critColors?.text || '',
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", critColors?.dot || '')} />
                            {SCOPE_CRITICALITY_LABELS[item.criticality]}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {item._count?.tests ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px]">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingItem(item);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={(item._count?.tests ?? 0) > 0}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}

      {/* Delete Confirmation — only destructive action uses a dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scope Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingItem?.name}" ({deletingItem?.code})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
