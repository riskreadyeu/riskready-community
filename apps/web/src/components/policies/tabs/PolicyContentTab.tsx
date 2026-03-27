import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DocumentRenderer,
  type PolicyDocumentData,
} from "@/components/policies/document-sections";
import { parsePolicyContent } from "@/lib/parse-policy-content";
import { sanitizeHtml } from "@/lib/sanitize";
import type {
  PolicyDocument,
  DocumentVersion,
  ControlMapping,
} from "@/lib/policies-api";

interface PolicyContentTabProps {
  document: PolicyDocument;
  versions: DocumentVersion[];
  controlMappings: ControlMapping[];
}

export function PolicyContentTab({
  document,
  versions,
  controlMappings,
}: PolicyContentTabProps) {
  // Parse the markdown content to extract structured data
  const parsedContent = parsePolicyContent(document.content || "");

  return (
    <DocumentRenderer
      document={{
        id: document.id,
        documentId: document.documentId,
        title: document.title,
        shortTitle: document.shortTitle || undefined,
        documentType: document.documentType as PolicyDocumentData["documentType"],
        classification: document.classification,
        status: document.status,
        version: document.version,
        documentOwner: document.owner
          ? `${document.owner.firstName} ${document.owner.lastName}`
          : document.documentOwner,
        author: document.authorUser
          ? `${document.authorUser.firstName} ${document.authorUser.lastName}`
          : document.author,
        approvedBy: document.approver
          ? `${document.approver.firstName} ${document.approver.lastName}`
          : document.approvedBy || undefined,
        approvalDate: document.approvalDate || undefined,
        effectiveDate: document.effectiveDate || undefined,
        nextReviewDate: document.nextReviewDate || undefined,
        reviewFrequency: document.reviewFrequency,
        distribution: document.distribution || undefined,
        purpose: document.purpose,
        scope: document.scope,

        // Parsed structured content from markdown
        managementCommitment: parsedContent.managementCommitment,
        definitions: parsedContent.definitions,
        roles: parsedContent.roles,
        relatedDocuments: parsedContent.relatedDocuments,
        policyStatements: parsedContent.policyStatements,

        // Transform control mappings to ISO controls format
        isoControls: controlMappings.map((m) => ({
          controlId: m.control?.controlId || "",
          controlTitle: m.control?.name || "",
          relevance: m.notes || m.mappingType,
          coverage: m.coverage as "FULL" | "PARTIAL" | "MINIMAL" | undefined,
        })),

        // Transform version history to revisions format
        revisions: versions.map((v) => ({
          version: v.version,
          date: v.createdAt,
          author: v.createdBy
            ? `${v.createdBy.firstName} ${v.createdBy.lastName}`
            : "System",
          description: v.changeDescription || v.changeType.replace(/_/g, " "),
        })),
      }}
      showTableOfContents
    />
  );
}

interface PolicyRawContentTabProps {
  document: PolicyDocument;
}

export function PolicyRawContentTab({ document }: PolicyRawContentTabProps) {
  // Content is sanitized using the sanitizeHtml utility before rendering
  const sanitizedContent = sanitizeHtml(document.content);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Raw Document Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {document.summary && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Summary
            </h4>
            <p className="text-sm">{document.summary}</p>
          </div>
        )}
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Purpose
          </h4>
          <p className="text-sm whitespace-pre-wrap">{document.purpose}</p>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Scope
          </h4>
          <p className="text-sm whitespace-pre-wrap">{document.scope}</p>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Content
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              className="text-sm whitespace-pre-wrap"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
