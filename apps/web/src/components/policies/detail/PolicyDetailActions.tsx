import {
  CheckCircle2,
  Download,
  Edit3,
  FileDown,
  FileText,
  GitBranch,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type PolicyDocument } from "@/lib/policies-api";
import {
  exportPolicyToHTML,
  exportPolicyToMarkdown,
  exportPolicyToPDF,
} from "@/lib/policy-export-utils";

type PolicyDetailActionsProps = {
  document: PolicyDocument;
  documentId: string;
  onOpenApprovalDialog: () => void;
};

export function PolicyDetailActions({
  document,
  documentId,
  onOpenApprovalDialog,
}: PolicyDetailActionsProps) {
  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => exportPolicyToPDF(document)}>
            <Printer className="h-4 w-4 mr-2" />
            Print / PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportPolicyToMarkdown(document)}>
            <FileDown className="h-4 w-4 mr-2" />
            Markdown (.md)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportPolicyToHTML(document)}>
            <FileText className="h-4 w-4 mr-2" />
            HTML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link to={`/policies/versions?documentId=${documentId}`}>
        <Button variant="outline" size="sm">
          <GitBranch className="h-4 w-4 mr-2" />
          Versions
        </Button>
      </Link>
      <Link to={`/policies/documents/${documentId}/edit`}>
        <Button variant="outline" size="sm">
          <Edit3 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </Link>
      {(document.status === "DRAFT" || document.status === "UNDER_REVISION") && (
        <Button size="sm" onClick={onOpenApprovalDialog}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      )}
    </div>
  );
}
