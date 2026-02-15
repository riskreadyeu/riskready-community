import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Section } from "@/components/archer/section";
import {
  DataTable,
  type Column,
} from "@/components/common";
import {
  getControls,
  fetchScopeItems,
  addControlsToAssessment,
  removeControlFromAssessment,
  addScopeItemsToAssessment,
  removeScopeItemFromAssessment,
  type Assessment,
  type AssessmentControl,
  type AssessmentScope,
  type Control,
  type ScopeItem,
} from "@/lib/controls-api";
import { Shield, Target, Trash2, Search, Plus, X, Loader2 } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface AssessmentScopeTabProps {
  assessment: Assessment;
  onUpdate: () => void;
}

// =============================================================================
// Inline Add Controls Panel
// =============================================================================

function AddControlsPanel({
  assessmentId,
  existingControlIds,
  onDone,
}: {
  assessmentId: string;
  existingControlIds: Set<string>;
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const [allControls, setAllControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await getControls({ take: 200 });
        setAllControls(res.results);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const available = useMemo(() => {
    const filtered = allControls.filter(c => !existingControlIds.has(c.id));
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      c => c.controlId?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q)
    );
  }, [allControls, existingControlIds, search]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    try {
      setSaving(true);
      await addControlsToAssessment(assessmentId, Array.from(selected));
      onDone();
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Add Controls to Scope</h4>
        <Button variant="ghost" size="sm" onClick={onDone}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search available controls..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading controls...
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
            {available.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {search ? "No matching controls found" : "All controls are already in scope"}
              </div>
            ) : (
              available.map(c => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(c.id)}
                    onCheckedChange={() => toggleSelect(c.id)}
                  />
                  <span className="font-mono text-xs">{c.controlId}</span>
                  <span className="text-sm truncate flex-1">{c.name}</span>
                  {c.theme && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {c.theme}
                    </Badge>
                  )}
                </label>
              ))
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {selected.size} selected of {available.length} available
            </span>
            <Button size="sm" onClick={handleAdd} disabled={selected.size === 0 || saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Adding...</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> Add {selected.size > 0 ? `(${selected.size})` : ""}</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Inline Add Scope Items Panel
// =============================================================================

function AddScopeItemsPanel({
  assessmentId,
  existingScopeItemIds,
  onDone,
}: {
  assessmentId: string;
  existingScopeItemIds: Set<string>;
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState<ScopeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const orgId = "cmj7b9wys0000eocjc9zm0j9m";
        const items = await fetchScopeItems(orgId);
        setAllItems(items);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const available = useMemo(() => {
    const filtered = allItems.filter(s => !existingScopeItemIds.has(s.id));
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      s => s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)
    );
  }, [allItems, existingScopeItemIds, search]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    try {
      setSaving(true);
      await addScopeItemsToAssessment(assessmentId, Array.from(selected));
      onDone();
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Add Scope Items</h4>
        <Button variant="ghost" size="sm" onClick={onDone}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search available scope items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading scope items...
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
            {available.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {search ? "No matching scope items found" : "All scope items are already added"}
              </div>
            ) : (
              available.map(s => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => toggleSelect(s.id)}
                  />
                  <span className="font-mono text-xs">{s.code}</span>
                  <span className="text-sm truncate flex-1">{s.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {s.scopeType?.replace("_", " ")}
                  </Badge>
                </label>
              ))
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {selected.size} selected of {available.length} available
            </span>
            <Button size="sm" onClick={handleAdd} disabled={selected.size === 0 || saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Adding...</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> Add {selected.size > 0 ? `(${selected.size})` : ""}</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AssessmentScopeTab({ assessment, onUpdate }: AssessmentScopeTabProps) {
  const [controlSearch, setControlSearch] = useState("");
  const [scopeSearch, setScopeSearch] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [showAddControls, setShowAddControls] = useState(false);
  const [showAddScopeItems, setShowAddScopeItems] = useState(false);

  const controls = assessment.controls || [];
  const scopeItems = assessment.scopeItems || [];

  const existingControlIds = useMemo(
    () => new Set(controls.map(c => c.controlId)),
    [controls]
  );
  const existingScopeItemIds = useMemo(
    () => new Set(scopeItems.map(s => s.scopeItemId)),
    [scopeItems]
  );

  const filteredControls = controlSearch
    ? controls.filter(c =>
        c.control?.controlId?.toLowerCase().includes(controlSearch.toLowerCase()) ||
        c.control?.name?.toLowerCase().includes(controlSearch.toLowerCase())
      )
    : controls;

  const filteredScopeItems = scopeSearch
    ? scopeItems.filter(s =>
        s.scopeItem?.code?.toLowerCase().includes(scopeSearch.toLowerCase()) ||
        s.scopeItem?.name?.toLowerCase().includes(scopeSearch.toLowerCase())
      )
    : scopeItems;

  const isEditable = assessment.status === "DRAFT" || assessment.status === "IN_PROGRESS";

  const handleRemoveControl = async (controlId: string) => {
    try {
      setRemoving(controlId);
      await removeControlFromAssessment(assessment.id, controlId);
      onUpdate();
    } catch {
      // Error handling
    } finally {
      setRemoving(null);
    }
  };

  const handleRemoveScopeItem = async (scopeItemId: string) => {
    try {
      setRemoving(scopeItemId);
      await removeScopeItemFromAssessment(assessment.id, scopeItemId);
      onUpdate();
    } catch {
      // Error handling
    } finally {
      setRemoving(null);
    }
  };

  const handleControlsAdded = () => {
    setShowAddControls(false);
    onUpdate();
  };

  const handleScopeItemsAdded = () => {
    setShowAddScopeItems(false);
    onUpdate();
  };

  const controlColumns: Column<AssessmentControl>[] = [
    {
      key: "controlId",
      header: "Control ID",
      render: (ac) => (
        <span className="font-mono text-sm font-medium">
          {ac.control?.controlId || "\u2014"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (ac) => (
        <span className="text-sm">{ac.control?.name || "\u2014"}</span>
      ),
    },
    {
      key: "theme",
      header: "Theme",
      render: (ac) => (
        <Badge variant="outline" className="text-xs">
          {ac.control?.theme || "\u2014"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Implementation",
      render: (ac) => {
        const status = ac.control?.implementationStatus;
        if (!status) return <span className="text-muted-foreground">{"\u2014"}</span>;
        const variant = status === "IMPLEMENTED" ? "default" as const : status === "PARTIAL" ? "outline" as const : "secondary" as const;
        return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
      },
    },
  ];

  const scopeColumns: Column<AssessmentScope>[] = [
    {
      key: "code",
      header: "Code",
      render: (as_) => (
        <span className="font-mono text-sm font-medium">
          {as_.scopeItem?.code || "\u2014"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (as_) => (
        <span className="text-sm">{as_.scopeItem?.name || "\u2014"}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (as_) => (
        <Badge variant="outline" className="text-xs">
          {as_.scopeItem?.scopeType?.replace("_", " ") || "\u2014"}
        </Badge>
      ),
    },
    {
      key: "criticality",
      header: "Criticality",
      render: (as_) => {
        const crit = as_.scopeItem?.criticality;
        if (!crit) return <span className="text-muted-foreground">{"\u2014"}</span>;
        const variant = crit === "CRITICAL" || crit === "HIGH" ? "destructive" as const : crit === "MEDIUM" ? "outline" as const : "secondary" as const;
        return <Badge variant={variant}>{crit}</Badge>;
      },
    },
  ];

  const controlRowActions = isEditable
    ? (ac: AssessmentControl) => [{
        label: "Remove",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleRemoveControl(ac.controlId),
      }]
    : undefined;

  const scopeRowActions = isEditable
    ? (as_: AssessmentScope) => [{
        label: "Remove",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleRemoveScopeItem(as_.scopeItemId),
      }]
    : undefined;

  return (
    <div className="space-y-6">
      {/* Controls in Scope */}
      <Section
        title="Controls in Scope"
        icon={Shield}
        badge={<Badge variant="secondary">{controls.length}</Badge>}
        actions={
          isEditable && !showAddControls ? (
            <Button size="sm" variant="outline" onClick={() => setShowAddControls(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Controls
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-3">
          {showAddControls && (
            <AddControlsPanel
              assessmentId={assessment.id}
              existingControlIds={existingControlIds}
              onDone={handleControlsAdded}
            />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search controls in scope..."
              value={controlSearch}
              onChange={(e) => setControlSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DataTable
            columns={controlColumns}
            data={filteredControls}
            keyExtractor={(ac) => ac.id}
            rowActions={controlRowActions}
            emptyMessage="No controls in scope. Click 'Add Controls' above to add controls."
          />
        </div>
      </Section>

      {/* Scope Items */}
      <Section
        title="Scope Items"
        icon={Target}
        badge={<Badge variant="secondary">{scopeItems.length}</Badge>}
        actions={
          isEditable && !showAddScopeItems ? (
            <Button size="sm" variant="outline" onClick={() => setShowAddScopeItems(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Scope Items
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-3">
          {showAddScopeItems && (
            <AddScopeItemsPanel
              assessmentId={assessment.id}
              existingScopeItemIds={existingScopeItemIds}
              onDone={handleScopeItemsAdded}
            />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scope items..."
              value={scopeSearch}
              onChange={(e) => setScopeSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DataTable
            columns={scopeColumns}
            data={filteredScopeItems}
            keyExtractor={(as_) => as_.id}
            rowActions={scopeRowActions}
            emptyMessage="No scope items added. Click 'Add Scope Items' above to define testing scope."
          />
        </div>
      </Section>
    </div>
  );
}
