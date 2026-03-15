import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { type PolicyDocument } from "@/lib/policies-api";

const documentTypeColors: Record<string, string> = {
  POLICY: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  STANDARD: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  PROCEDURE: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  WORK_INSTRUCTION: "bg-green-500/10 text-green-500 border-green-500/30",
  FORM: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  TEMPLATE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  CHECKLIST: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  GUIDELINE: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  RECORD: "bg-pink-500/10 text-pink-500 border-pink-500/30",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  PENDING_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/30",
  PUBLISHED: "bg-green-500/10 text-green-500 border-green-500/30",
  UNDER_REVISION: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  SUPERSEDED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  RETIRED: "bg-red-500/10 text-red-500 border-red-500/30",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

const classificationColors: Record<string, string> = {
  PUBLIC: "bg-green-500/10 text-green-500 border-green-500/30",
  INTERNAL: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  CONFIDENTIAL: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  RESTRICTED: "bg-red-500/10 text-red-500 border-red-500/30",
};

type PolicyDetailHeaderProps = {
  document: PolicyDocument;
};

export function PolicyDetailHeader({ document }: PolicyDetailHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Link
          to="/policies/documents"
          className="hover:text-foreground transition-colors"
        >
          Documents
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>{document.documentId}</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={documentTypeColors[document.documentType] || ""}
        >
          {document.documentType.replace(/_/g, " ")}
        </Badge>
        <Badge variant="outline" className={statusColors[document.status] || ""}>
          {document.status.replace(/_/g, " ")}
        </Badge>
        <Badge
          variant="outline"
          className={classificationColors[document.classification] || ""}
        >
          {document.classification}
        </Badge>
        <span className="text-sm text-muted-foreground">v{document.version}</span>
      </div>
    </div>
  );
}
