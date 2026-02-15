import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Filter, X } from "lucide-react";
import type { SOAEntry, ControlTheme, ImplementationStatus } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface SOAEntryTableFilters {
  search: string;
  theme: string;
  applicable: string;
  implStatus: string;
}

export interface SOAEntryTableProps {
  entries: SOAEntry[];
  isEditable: boolean;
  onEntrySave: (
    entryId: string,
    data: {
      applicable: boolean;
      justificationIfNa?: string;
      implementationStatus: ImplementationStatus;
      implementationDesc?: string;
      parentRiskId?: string;
      scenarioIds?: string;
    }
  ) => Promise<void>;
  filters: SOAEntryTableFilters;
  onFiltersChange: (filters: Partial<SOAEntryTableFilters>) => void;
}

// =============================================================================
// Configuration
// =============================================================================

const themeLabels: Record<ControlTheme, string> = {
  ORGANISATIONAL: "Organisational",
  PEOPLE: "People",
  PHYSICAL: "Physical",
  TECHNOLOGICAL: "Technological",
};

const implStatusConfig: Record<ImplementationStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-gray-500" },
  PARTIAL: { label: "Partial", color: "text-amber-600" },
  IMPLEMENTED: { label: "Implemented", color: "text-green-600" },
};

// =============================================================================
// Inline Edit Row
// =============================================================================

function InlineEditRow({
  entry,
  onSave,
  onCancel,
  colSpan,
}: {
  entry: SOAEntry;
  onSave: SOAEntryTableProps["onEntrySave"];
  onCancel: () => void;
  colSpan: number;
}) {
  const [applicable, setApplicable] = useState(entry.applicable);
  const [justificationIfNa, setJustificationIfNa] = useState(entry.justificationIfNa || "");
  const [implementationStatus, setImplementationStatus] = useState<ImplementationStatus>(entry.implementationStatus);
  const [implementationDesc, setImplementationDesc] = useState(entry.implementationDesc || "");
  const [parentRiskId, setParentRiskId] = useState(entry.parentRiskId || "");
  const [scenarioIds, setScenarioIds] = useState(entry.scenarioIds || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setApplicable(entry.applicable);
    setJustificationIfNa(entry.justificationIfNa || "");
    setImplementationStatus(entry.implementationStatus);
    setImplementationDesc(entry.implementationDesc || "");
    setParentRiskId(entry.parentRiskId || "");
    setScenarioIds(entry.scenarioIds || "");
  }, [entry]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(entry.id, {
        applicable,
        justificationIfNa: !applicable ? justificationIfNa : undefined,
        implementationStatus,
        implementationDesc: applicable ? implementationDesc : undefined,
        parentRiskId: parentRiskId || undefined,
        scenarioIds: scenarioIds || undefined,
      });
      onCancel();
    } catch (error) {
      console.error("Failed to save SOA entry:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow className="bg-primary/5 hover:bg-primary/5">
      <TableCell colSpan={colSpan} className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-sm font-medium">{entry.controlId}</span>
              <span className="mx-2 text-muted-foreground">—</span>
              <span className="font-medium">{entry.controlName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Applicable</Label>
              <Select
                value={applicable ? "yes" : "no"}
                onValueChange={(v) => setApplicable(v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Control is applicable</SelectItem>
                  <SelectItem value="no">No - Control is not applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {applicable && (
              <div className="space-y-2">
                <Label>Implementation Status</Label>
                <Select
                  value={implementationStatus}
                  onValueChange={(v) => setImplementationStatus(v as ImplementationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="PARTIAL">Partially Implemented</SelectItem>
                    <SelectItem value="IMPLEMENTED">Fully Implemented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!applicable && (
            <div className="space-y-2">
              <Label>Justification (required for N/A controls)</Label>
              <Textarea
                value={justificationIfNa}
                onChange={(e) => setJustificationIfNa(e.target.value)}
                placeholder="Explain why this control is not applicable..."
                rows={2}
              />
            </div>
          )}

          {applicable && (
            <div className="space-y-2">
              <Label>Implementation Description</Label>
              <Textarea
                value={implementationDesc}
                onChange={(e) => setImplementationDesc(e.target.value)}
                placeholder="Describe how this control is implemented..."
                rows={2}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parent Risk ID</Label>
              <Input
                value={parentRiskId}
                onChange={(e) => setParentRiskId(e.target.value)}
                placeholder="e.g., R-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Scenario IDs</Label>
              <Input
                value={scenarioIds}
                onChange={(e) => setScenarioIds(e.target.value)}
                placeholder="Comma-separated, e.g., R-001-S01, R-001-S02"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// Component
// =============================================================================

export function SOAEntryTable({
  entries,
  isEditable,
  onEntrySave,
  filters,
  onFiltersChange,
}: SOAEntryTableProps) {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !entry.controlId.toLowerCase().includes(search) &&
          !entry.controlName.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (filters.theme !== "all" && entry.theme !== filters.theme) return false;
      if (filters.applicable !== "all") {
        if (filters.applicable === "yes" && !entry.applicable) return false;
        if (filters.applicable === "no" && entry.applicable) return false;
      }
      if (filters.implStatus !== "all" && entry.implementationStatus !== filters.implStatus)
        return false;
      return true;
    });
  }, [entries, filters]);

  const COL_COUNT = 6;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredEntries.length} of {entries.length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search controls..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="w-64"
        />
        <Select value={filters.theme} onValueChange={(v) => onFiltersChange({ theme: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            <SelectItem value="ORGANISATIONAL">Organisational</SelectItem>
            <SelectItem value="PEOPLE">People</SelectItem>
            <SelectItem value="PHYSICAL">Physical</SelectItem>
            <SelectItem value="TECHNOLOGICAL">Technological</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.applicable}
          onValueChange={(v) => onFiltersChange({ applicable: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Applicable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Applicable</SelectItem>
            <SelectItem value="no">Not Applicable</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.implStatus}
          onValueChange={(v) => onFiltersChange({ implStatus: v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Implementation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Control ID</TableHead>
              <TableHead>Control Name</TableHead>
              <TableHead className="w-32">Theme</TableHead>
              <TableHead className="w-28">Applicable</TableHead>
              <TableHead className="w-36">Implementation</TableHead>
              <TableHead>Justification / Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              editingEntryId === entry.id ? (
                <InlineEditRow
                  key={`edit-${entry.id}`}
                  entry={entry}
                  onSave={onEntrySave}
                  onCancel={() => setEditingEntryId(null)}
                  colSpan={COL_COUNT}
                />
              ) : (
                <TableRow
                  key={entry.id}
                  onClick={() => isEditable && setEditingEntryId(entry.id)}
                  className={isEditable ? "cursor-pointer hover:bg-muted/50" : undefined}
                >
                  <TableCell className="font-mono text-sm">{entry.controlId}</TableCell>
                  <TableCell className="font-medium">{entry.controlName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{themeLabels[entry.theme]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.applicable ? "default" : "secondary"}>
                      {entry.applicable ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={implStatusConfig[entry.implementationStatus].color}>
                      {implStatusConfig[entry.implementationStatus].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {!entry.applicable
                      ? entry.justificationIfNa || "-"
                      : entry.implementationDesc || "-"}
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
