import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EditorSection } from "../types";
import type {
  DefinitionEntry,
  ProcessStepEntry,
  PrerequisiteEntry,
  RoleEntry,
  RevisionEntry,
} from "../types";
import { ManagementCommitmentEditor } from "./ManagementCommitmentEditor";
import { DefinitionsEditor } from "./DefinitionsEditor";
import { ProcessStepsEditor } from "./ProcessStepsEditor";
import { PrerequisitesEditor } from "./PrerequisitesEditor";
import { RolesEditor } from "./RolesEditor";
import { RevisionsEditor } from "./RevisionsEditor";

interface SectionContentEditorProps {
  section: EditorSection;
  onUpdate: (updates: Partial<EditorSection>) => void;
}

export function SectionContentEditor({ section, onUpdate }: SectionContentEditorProps) {
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
