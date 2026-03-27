import * as React from "react";
import {
  MoreHorizontal,
  Copy,
  Printer,
  History,
  Trash2,
  ExternalLink,
  Download,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * RecordActionsMenu - Archer GRC style ellipsis menu for secondary record actions
 *
 * Per Archer GRC Design Reference:
 * - Ellipsis menu (⋮) for secondary actions
 * - Actions: Copy, Print, History, Delete (destructive)
 * - Positioned in record header alongside primary actions
 */

export interface RecordAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface RecordActionsMenuProps {
  /** Handler for Edit action */
  onEdit?: () => void;
  /** Handler for Copy action */
  onCopy?: () => void;
  /** Handler for Print action */
  onPrint?: () => void;
  /** Handler for viewing History (scrolls to or opens history tab) */
  onHistory?: () => void;
  /** Handler for Export action */
  onExport?: () => void;
  /** Handler for Archive action */
  onArchive?: () => void;
  /** Handler for Delete action (destructive) */
  onDelete?: () => void;
  /** Handler for Duplicate action */
  onDuplicate?: () => void;
  /** Record type label for generic actions */
  recordType?: string;
  /** Record ID for generic actions */
  recordId?: string;
  /** Record name for display */
  recordName?: string;
  /** Additional custom actions */
  customActions?: RecordAction[];
  /** Hide specific default actions */
  hideActions?: ("copy" | "print" | "history" | "export" | "archive" | "delete")[];
  /** Custom trigger button */
  trigger?: React.ReactNode;
  /** Align dropdown menu */
  align?: "start" | "center" | "end";
}

export function RecordActionsMenu({
  onEdit,
  onCopy,
  onPrint,
  onHistory,
  onExport,
  onArchive,
  onDelete,
  onDuplicate,
  recordType: _recordType,
  recordId: _recordId,
  recordName: _recordName,
  customActions = [],
  hideActions = [],
  trigger,
  align = "end",
}: RecordActionsMenuProps) {
  const defaultActions: { key: string; action: RecordAction | null }[] = [
    {
      key: "copy",
      action: onCopy && !hideActions.includes("copy")
        ? { label: "Copy Record", icon: <Copy className="h-4 w-4" />, onClick: onCopy }
        : null,
    },
    {
      key: "print",
      action: onPrint && !hideActions.includes("print")
        ? { label: "Print", icon: <Printer className="h-4 w-4" />, onClick: onPrint }
        : null,
    },
    {
      key: "export",
      action: onExport && !hideActions.includes("export")
        ? { label: "Export", icon: <Download className="h-4 w-4" />, onClick: onExport }
        : null,
    },
    {
      key: "history",
      action: onHistory && !hideActions.includes("history")
        ? { label: "View History", icon: <History className="h-4 w-4" />, onClick: onHistory }
        : null,
    },
    {
      key: "archive",
      action: onArchive && !hideActions.includes("archive")
        ? { label: "Archive", icon: <Archive className="h-4 w-4" />, onClick: onArchive }
        : null,
    },
  ];

  const deleteAction: RecordAction | null = onDelete && !hideActions.includes("delete")
    ? { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: onDelete, variant: "destructive" }
    : null;

  const visibleActions = defaultActions.filter((a) => a.action !== null).map((a) => a.action!);
  const allActions = [...visibleActions, ...customActions];

  // Don't render if no actions available
  if (allActions.length === 0 && !deleteAction) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="h-9 w-9">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More actions</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {allActions.map((action, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
        {deleteAction && (
          <>
            {allActions.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={deleteAction.onClick}
              disabled={deleteAction.disabled}
              className="text-destructive focus:text-destructive"
            >
              {deleteAction.icon && <span className="mr-2">{deleteAction.icon}</span>}
              {deleteAction.label}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
