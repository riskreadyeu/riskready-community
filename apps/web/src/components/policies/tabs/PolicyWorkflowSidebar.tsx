import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  FolderTree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PolicyDocument } from "@/lib/policies-api";

interface PolicyWorkflowSidebarProps {
  document: PolicyDocument;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export function PolicyWorkflowSidebar({
  document,
  isOverdue,
  isDueSoon,
}: PolicyWorkflowSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="text-sm font-medium">
                {document.owner
                  ? `${document.owner.firstName} ${document.owner.lastName}`
                  : document.documentOwner}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Author</p>
              <p className="text-sm font-medium">
                {document.authorUser
                  ? `${document.authorUser.firstName} ${document.authorUser.lastName}`
                  : document.author}
              </p>
            </div>
          </div>
          {document.approver && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Approved By</p>
                <p className="text-sm font-medium">
                  {document.approver.firstName} {document.approver.lastName}
                </p>
              </div>
            </div>
          )}
          <Separator />
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Review Frequency</p>
              <p className="text-sm font-medium">
                {document.reviewFrequency.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          {document.effectiveDate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Effective Date</p>
                <p className="text-sm font-medium">
                  {new Date(document.effectiveDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          {document.nextReviewDate && (
            <div className="flex items-center gap-3">
              <Clock
                className={cn(
                  "h-4 w-4",
                  isOverdue
                    ? "text-destructive"
                    : isDueSoon
                    ? "text-warning"
                    : "text-muted-foreground"
                )}
              />
              <div>
                <p className="text-xs text-muted-foreground">Next Review</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isOverdue && "text-destructive",
                    isDueSoon && !isOverdue && "text-warning"
                  )}
                >
                  {new Date(document.nextReviewDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarchy */}
      {(document.parentDocument || (document.childDocuments && document.childDocuments.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Document Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {document.parentDocument && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Parent Document</p>
                <Link
                  to={`/policies/documents/${document.parentDocument.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {document.parentDocument.documentId}
                    </p>
                    <p className="text-sm">{document.parentDocument.title}</p>
                  </div>
                </Link>
              </div>
            )}
            {document.childDocuments && document.childDocuments.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Child Documents ({document.childDocuments.length})
                </p>
                <div className="space-y-2">
                  {document.childDocuments.map((child) => (
                    <Link
                      key={child.id}
                      to={`/policies/documents/${child.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {child.documentId}
                        </p>
                        <p className="text-sm truncate">{child.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
