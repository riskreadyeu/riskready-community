"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Save,
  FileText,
  Target,
  Maximize2,
  BookOpen,
  Shield,
  Link2,
  Users,
  ListOrdered,
  CheckSquare,
  History,
  Quote,
  FileCheck,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECTION_TEMPLATES,
  SECTION_LABELS,
  SECTION_ICONS,
  type DocumentType,
  type DocumentSectionType,
  type DefinitionEntry,
  type ProcessStepEntry,
  type PrerequisiteEntry,
  type RoleEntry,
  type RevisionEntry,
} from "./types";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FileText,
  Target,
  Maximize2,
  BookOpen,
  Shield,
  Link2,
  Users,
  ListOrdered,
  CheckSquare,
  History,
  Quote,
  FileCheck,
  ListChecks,
  GripVertical,
};

// Editor section data
export interface EditorSection {
  id: string;
  type: DocumentSectionType;
  title: string;
  order: number;
  isVisible: boolean;
  isCollapsed: boolean;
  content?: string;
  structuredData?: unknown;
}

interface DocumentEditorProps {
  documentType: DocumentType;
  sections: EditorSection[];
  onChange: (sections: EditorSection[]) => void;
  onSave?: () => void;
  className?: string;
}

// Sortable Section Item
interface SortableSectionItemProps {
  section: EditorSection;
  onToggleVisibility: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onUpdateSection: (id: string, updates: Partial<EditorSection>) => void;
  onDeleteSection: (id: string) => void;
}

function SortableSectionItem({
  section,
  onToggleVisibility,
  onToggleCollapse,
  onUpdateSection,
  onDeleteSection,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const iconName = SECTION_ICONS[section.type];
  const Icon = iconMap[iconName] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg bg-card",
        !section.isVisible && "opacity-50"
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-muted p-1 rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => onToggleCollapse(section.id)}
          className="p-1 hover:bg-muted rounded"
        >
          {section.isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className="p-1.5 rounded bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>

        <Input
          value={section.title}
          onChange={(e) => onUpdateSection(section.id, { title: e.target.value })}
          className="flex-1 h-8 text-sm font-medium"
        />

        <Badge variant="outline" className="text-[10px]">
          {section.type}
        </Badge>

        <button
          onClick={() => onToggleVisibility(section.id)}
          className="p-1.5 hover:bg-muted rounded"
          title={section.isVisible ? "Hide section" : "Show section"}
        >
          {section.isVisible ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => onDeleteSection(section.id)}
          className="p-1.5 hover:bg-destructive/10 rounded text-destructive"
          title="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Section Content Editor */}
      {!section.isCollapsed && (
        <div className="p-4">
          <SectionContentEditor
            section={section}
            onUpdate={(updates) => onUpdateSection(section.id, updates)}
          />
        </div>
      )}
    </div>
  );
}

// Section Content Editor - renders appropriate editor based on section type
interface SectionContentEditorProps {
  section: EditorSection;
  onUpdate: (updates: Partial<EditorSection>) => void;
}

function SectionContentEditor({ section, onUpdate }: SectionContentEditorProps) {
  switch (section.type) {
    case "MANAGEMENT_COMMITMENT":
      return (
        <ManagementCommitmentEditor
          data={section.structuredData as { statement?: string; signatory?: string; signatoryTitle?: string }}
          onChange={(data) => onUpdate({ structuredData: data })}
        />
      );
    case "DEFINITIONS":
      return (
        <DefinitionsEditor
          definitions={(section.structuredData as DefinitionEntry[]) || []}
          onChange={(data) => onUpdate({ structuredData: data })}
        />
      );
    case "PROCEDURE_STEPS":
      return (
        <ProcessStepsEditor
          steps={(section.structuredData as ProcessStepEntry[]) || []}
          onChange={(data) => onUpdate({ structuredData: data })}
        />
      );
    case "PREREQUISITES":
      return (
        <PrerequisitesEditor
          prerequisites={(section.structuredData as PrerequisiteEntry[]) || []}
          onChange={(data) => onUpdate({ structuredData: data })}
        />
      );
    case "ROLES_RESPONSIBILITIES":
      return (
        <RolesEditor
          roles={(section.structuredData as RoleEntry[]) || []}
          onChange={(data) => onUpdate({ structuredData: data })}
        />
      );
    case "REVISION_HISTORY":
      return (
        <RevisionsEditor
          revisions={(section.structuredData as RevisionEntry[]) || []}
          onChange={(data) => onUpdate({ structuredData: data })}
        />
      );
    default:
      // Default to markdown/text editor
      return (
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={section.content || ""}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Enter section content..."
            className="min-h-[200px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Supports basic markdown: **bold**, *italic*, - lists, # headers
          </p>
        </div>
      );
  }
}

// Management Commitment Editor
function ManagementCommitmentEditor({
  data,
  onChange,
}: {
  data?: { statement?: string; signatory?: string; signatoryTitle?: string };
  onChange: (data: unknown) => void;
}) {
  const [statement, setStatement] = useState(data?.statement || "");
  const [signatory, setSignatory] = useState(data?.signatory || "");
  const [signatoryTitle, setSignatoryTitle] = useState(data?.signatoryTitle || "");

  const handleChange = () => {
    onChange({ statement, signatory, signatoryTitle });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Commitment Statement</Label>
        <Textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onBlur={handleChange}
          placeholder="Enter the management commitment statement..."
          className="min-h-[150px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Signatory Name</Label>
          <Input
            value={signatory}
            onChange={(e) => setSignatory(e.target.value)}
            onBlur={handleChange}
            placeholder="e.g., John Smith"
          />
        </div>
        <div className="space-y-2">
          <Label>Signatory Title</Label>
          <Input
            value={signatoryTitle}
            onChange={(e) => setSignatoryTitle(e.target.value)}
            onBlur={handleChange}
            placeholder="e.g., Chief Executive Officer"
          />
        </div>
      </div>
    </div>
  );
}

// Definitions Editor
function DefinitionsEditor({
  definitions,
  onChange,
}: {
  definitions: DefinitionEntry[];
  onChange: (data: DefinitionEntry[]) => void;
}) {
  const addDefinition = () => {
    onChange([...definitions, { term: "", definition: "" }]);
  };

  const updateDefinition = (index: number, updates: Partial<DefinitionEntry>) => {
    const updated = [...definitions];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeDefinition = (index: number) => {
    onChange(definitions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr,2fr,auto] gap-2 p-3 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <span>Term</span>
          <span>Definition</span>
          <span className="w-10" />
        </div>
        <div className="divide-y">
          {definitions.map((def, index) => (
            <div key={index} className="grid grid-cols-[1fr,2fr,auto] gap-2 p-3 items-start">
              <Input
                value={def.term}
                onChange={(e) => updateDefinition(index, { term: e.target.value })}
                placeholder="Term"
                className="h-9"
              />
              <Textarea
                value={def.definition}
                onChange={(e) => updateDefinition(index, { definition: e.target.value })}
                placeholder="Definition"
                className="min-h-[80px]"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDefinition(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={addDefinition}>
        <Plus className="h-4 w-4 mr-2" />
        Add Definition
      </Button>
    </div>
  );
}

// Process Steps Editor
function ProcessStepsEditor({
  steps,
  onChange,
}: {
  steps: ProcessStepEntry[];
  onChange: (data: ProcessStepEntry[]) => void;
}) {
  const addStep = () => {
    const nextNumber = steps.length > 0 ? String(steps.length + 1) : "1";
    onChange([
      ...steps,
      { stepNumber: nextNumber, title: "", description: "", activities: [] },
    ]);
  };

  const updateStep = (index: number, updates: Partial<ProcessStepEntry>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={index}>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono font-semibold">
                {step.stepNumber}
              </div>
              <Input
                value={step.title}
                onChange={(e) => updateStep(index, { title: e.target.value })}
                placeholder="Step title"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={step.description}
                onChange={(e) => updateStep(index, { description: e.target.value })}
                placeholder="Step description..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsible</Label>
                <Input
                  value={step.responsible || ""}
                  onChange={(e) => updateStep(index, { responsible: e.target.value })}
                  placeholder="Who performs this step"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Duration</Label>
                <Input
                  value={step.estimatedDuration || ""}
                  onChange={(e) => updateStep(index, { estimatedDuration: e.target.value })}
                  placeholder="e.g., 1 hour, 2-3 days"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addStep}>
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}

// Prerequisites Editor
function PrerequisitesEditor({
  prerequisites,
  onChange,
}: {
  prerequisites: PrerequisiteEntry[];
  onChange: (data: PrerequisiteEntry[]) => void;
}) {
  const addPrerequisite = () => {
    onChange([...prerequisites, { item: "", isMandatory: true, category: "MANDATORY" as const }]);
  };

  const updatePrerequisite = (index: number, updates: Partial<PrerequisiteEntry>) => {
    const updated = [...prerequisites];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removePrerequisite = (index: number) => {
    onChange(prerequisites.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {prerequisites.map((prereq, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            <Input
              value={prereq.item}
              onChange={(e) => updatePrerequisite(index, { item: e.target.value })}
              placeholder="Prerequisite item"
              className="flex-1"
            />
            <Select
              value={prereq.isMandatory ? "mandatory" : "optional"}
              onValueChange={(v) =>
                updatePrerequisite(index, { isMandatory: v === "mandatory" })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mandatory">Mandatory</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePrerequisite(index)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addPrerequisite}>
        <Plus className="h-4 w-4 mr-2" />
        Add Prerequisite
      </Button>
    </div>
  );
}

// Roles Editor
function RolesEditor({
  roles,
  onChange,
}: {
  roles: RoleEntry[];
  onChange: (data: RoleEntry[]) => void;
}) {
  const addRole = () => {
    onChange([...roles, { role: "", responsibilities: [] }]);
  };

  const updateRole = (index: number, updates: Partial<RoleEntry>) => {
    const updated = [...roles];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeRole = (index: number) => {
    onChange(roles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {roles.map((role, index) => (
        <Card key={index}>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <Input
                value={role.role}
                onChange={(e) => updateRole(index, { role: e.target.value })}
                placeholder="Role name"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRole(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block">Responsibilities (one per line)</Label>
            <Textarea
              value={role.responsibilities.join("\n")}
              onChange={(e) =>
                updateRole(index, {
                  responsibilities: e.target.value.split("\n").filter((r) => r.trim()),
                })
              }
              placeholder="Enter responsibilities..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addRole}>
        <Plus className="h-4 w-4 mr-2" />
        Add Role
      </Button>
    </div>
  );
}

// Revisions Editor
function RevisionsEditor({
  revisions,
  onChange,
}: {
  revisions: RevisionEntry[];
  onChange: (data: RevisionEntry[]) => void;
}) {
  const addRevision = () => {
    onChange([
      ...revisions,
      {
        version: "",
        date: new Date().toISOString().split("T")[0]!,
        author: "",
        description: "",
      },
    ]);
  };

  const updateRevision = (index: number, updates: Partial<RevisionEntry>) => {
    const updated = [...revisions];
    updated[index] = { ...updated[index]!, ...updates };
    onChange(updated);
  };

  const removeRevision = (index: number) => {
    onChange(revisions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="grid grid-cols-[80px,100px,1fr,1fr,auto] gap-2 p-3 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
          <span>Version</span>
          <span>Date</span>
          <span>Author</span>
          <span>Description</span>
          <span className="w-10" />
        </div>
        <div className="divide-y">
          {revisions.map((rev, index) => (
            <div key={index} className="grid grid-cols-[80px,100px,1fr,1fr,auto] gap-2 p-3 items-start">
              <Input
                value={rev.version}
                onChange={(e) => updateRevision(index, { version: e.target.value })}
                placeholder="1.0"
                className="h-9"
              />
              <Input
                type="date"
                value={rev.date}
                onChange={(e) => updateRevision(index, { date: e.target.value })}
                className="h-9"
              />
              <Input
                value={rev.author}
                onChange={(e) => updateRevision(index, { author: e.target.value })}
                placeholder="Author name"
                className="h-9"
              />
              <Input
                value={rev.description}
                onChange={(e) => updateRevision(index, { description: e.target.value })}
                placeholder="Description of changes"
                className="h-9"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRevision(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={addRevision}>
        <Plus className="h-4 w-4 mr-2" />
        Add Revision
      </Button>
    </div>
  );
}

// Add Section Dialog
interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: DocumentSectionType) => void;
  documentType: DocumentType;
  existingSections: DocumentSectionType[];
}

function AddSectionDialog({
  open,
  onClose,
  onAdd,
  documentType,
  existingSections,
}: AddSectionDialogProps) {
  const availableSections = SECTION_TEMPLATES[documentType].filter(
    (type) => !existingSections.includes(type) || type === "CUSTOM"
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Select a section type to add to your document.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-4">
            {availableSections.map((type) => {
              const iconName = SECTION_ICONS[type];
              const Icon = iconMap[iconName] || FileText;
              return (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{SECTION_LABELS[type]}</p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Main Document Editor Component
export function DocumentEditor({
  documentType,
  sections,
  onChange,
  onSave,
  className,
}: DocumentEditorProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);

        const newSections = [...sections];
        const [removed] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, removed!);

        // Update order numbers
        newSections.forEach((s, i) => {
          s.order = i;
        });

        onChange(newSections);
      }
    },
    [sections, onChange]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      onChange(
        sections.map((s) =>
          s.id === id ? { ...s, isVisible: !s.isVisible } : s
        )
      );
    },
    [sections, onChange]
  );

  const toggleCollapse = useCallback(
    (id: string) => {
      onChange(
        sections.map((s) =>
          s.id === id ? { ...s, isCollapsed: !s.isCollapsed } : s
        )
      );
    },
    [sections, onChange]
  );

  const updateSection = useCallback(
    (id: string, updates: Partial<EditorSection>) => {
      onChange(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    },
    [sections, onChange]
  );

  const deleteSection = useCallback(
    (id: string) => {
      onChange(sections.filter((s) => s.id !== id));
    },
    [sections, onChange]
  );

  const addSection = useCallback(
    (type: DocumentSectionType) => {
      const newSection: EditorSection = {
        id: `section-${Date.now()}`,
        type,
        title: SECTION_LABELS[type],
        order: sections.length,
        isVisible: true,
        isCollapsed: false,
      };
      onChange([...sections, newSection]);
    },
    [sections, onChange]
  );

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {documentType}
          </Badge>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          {onSave && (
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Sections List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onToggleVisibility={toggleVisibility}
                  onToggleCollapse={toggleCollapse}
                  onUpdateSection={updateSection}
                  onDeleteSection={deleteSection}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium mb-2">No sections yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add sections to start building your document.
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Section
          </Button>
        </div>
      )}

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={addSection}
        documentType={documentType}
        existingSections={sections.map((s) => s.type)}
      />
    </div>
  );
}
