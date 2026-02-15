"use client";

import { useMemo } from "react";
import { DocumentHeader } from "./DocumentHeader";
import { ManagementCommitment } from "./ManagementCommitment";
import { DefinitionsTable } from "./DefinitionsTable";
import { ISOControlsTable } from "./ISOControlsTable";
import { ProcessSteps } from "./ProcessSteps";
import { PrerequisitesChecklist } from "./PrerequisitesChecklist";
import { RolesResponsibilities } from "./RolesResponsibilities";
import { RelatedDocuments } from "./RelatedDocuments";
import { ContentSection } from "./ContentSection";
import { RevisionHistory } from "./RevisionHistory";
import {
  SECTION_TEMPLATES,
  SECTION_LABELS,
  SECTION_NUMBERS,
  type DocumentType,
  type DocumentSectionType,
  type DocumentHeaderData,
  type DocumentControlData,
  type ManagementCommitmentData,
  type DefinitionEntry,
  type ISOControlEntry,
  type RelatedDocumentEntry,
  type RoleEntry,
  type ProcedureStepEntry,
  type PrerequisiteEntry,
  type RevisionEntry,
  type ComplianceData,
  type TrainingRequirement,
} from "./types";

// Extended document data interface - matches actual ISO 27001 document structure
export interface PolicyDocumentData {
  // Core identification
  id: string;
  documentId: string;
  title: string;
  shortTitle?: string;
  documentType: DocumentType;

  // Classification & Status
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  status: string;
  version: string;

  // Ownership
  documentOwner: string;
  author: string;
  approvedBy?: string;
  approvalDate?: string;

  // Dates
  effectiveDate?: string;
  nextReviewDate?: string;
  reviewFrequency: string;

  // Distribution
  distribution?: string[];

  // Document Control (for Standards/Procedures)
  documentControl?: DocumentControlData;

  // Content sections
  purpose?: string;
  scope?: string;
  content?: string;             // Generic content field
  policyStatements?: string;  // Main policy content (Policies)
  requirements?: string;       // Main requirements (Standards)
  
  // Management commitment (Policies only)
  managementCommitment?: ManagementCommitmentData;

  // Structured data
  definitions?: DefinitionEntry[];
  isoControls?: ISOControlEntry[];
  relatedDocuments?: RelatedDocumentEntry[];
  roles?: RoleEntry[];
  procedureSteps?: ProcedureStepEntry[];
  prerequisites?: PrerequisiteEntry[];
  revisions?: RevisionEntry[];

  // Compliance section
  compliance?: ComplianceData;
  
  // Training requirements
  trainingRequirements?: TrainingRequirement[];

  // Review and Maintenance
  reviewTriggers?: string[];

  // Custom sections
  customSections?: {
    type: DocumentSectionType;
    title: string;
    sectionNumber?: string;
    content?: string;
    data?: unknown;
  }[];

  // Control mappings from DB (for backwards compatibility)
  controlMappings?: Array<{
    control: {
      controlId: string;
      name: string;
    };
    mappingType: string;
    coverage: string;
    notes?: string;
    isPrimary?: boolean;
  }>;
}

interface DocumentRendererProps {
  document: PolicyDocumentData;
  mode?: "view" | "print";
  showTableOfContents?: boolean;
  className?: string;
}

// Parse definitions from document content or structured data
function parseDefinitions(document: PolicyDocumentData): DefinitionEntry[] {
  if (document.definitions && document.definitions.length > 0) {
    return document.definitions;
  }
  return [];
}

// Parse ISO controls from control mappings
function parseISOControls(document: PolicyDocumentData): ISOControlEntry[] {
  if (document.isoControls && document.isoControls.length > 0) {
    return document.isoControls;
  }

  if (document.controlMappings && document.controlMappings.length > 0) {
    return document.controlMappings.map((m) => ({
      controlId: m.control.controlId,
      controlTitle: m.control.name,
      relevance: m.notes || m.mappingType,
      isPrimary: m.isPrimary,
      coverage: m.coverage as "FULL" | "PARTIAL" | "MINIMAL" | undefined,
    }));
  }

  return [];
}

// Get section number for a section type
function getSectionNumber(docType: DocumentType, sectionType: DocumentSectionType): string {
  const numbers = SECTION_NUMBERS[docType];
  if (numbers && numbers[sectionType]) {
    return numbers[sectionType];
  }
  return "";
}

// Determine which sections to render based on document type
function getSectionsToRender(document: PolicyDocumentData): DocumentSectionType[] {
  const template = SECTION_TEMPLATES[document.documentType] || SECTION_TEMPLATES.POLICY;
  const sections: DocumentSectionType[] = [];

  for (const sectionType of template) {
    switch (sectionType) {
      case "DOCUMENT_HEADER":
        sections.push("DOCUMENT_HEADER");
        break;
      case "DOCUMENT_CONTROL":
        if (document.documentControl) {
          sections.push("DOCUMENT_CONTROL");
        }
        break;
      case "MANAGEMENT_COMMITMENT":
        if (document.documentType === "POLICY" && document.managementCommitment) {
          sections.push("MANAGEMENT_COMMITMENT");
        }
        break;
      case "PURPOSE":
        if (document.purpose) sections.push("PURPOSE");
        break;
      case "SCOPE":
        if (document.scope) sections.push("SCOPE");
        break;
      case "DEFINITIONS":
        if (parseDefinitions(document).length > 0) {
          sections.push("DEFINITIONS");
        }
        break;
      case "ISO_CONTROLS":
        if (parseISOControls(document).length > 0) {
          sections.push("ISO_CONTROLS");
        }
        break;
      case "RELATED_DOCUMENTS":
        if (document.relatedDocuments && document.relatedDocuments.length > 0) {
          sections.push("RELATED_DOCUMENTS");
        }
        break;
      case "ROLES_RESPONSIBILITIES":
        if (document.roles && document.roles.length > 0) {
          sections.push("ROLES_RESPONSIBILITIES");
        }
        break;
      case "POLICY_STATEMENTS":
        if (document.documentType === "POLICY" && document.policyStatements) {
          sections.push("POLICY_STATEMENTS");
        }
        break;
      case "REQUIREMENTS":
        if (document.documentType === "STANDARD" && document.requirements) {
          sections.push("REQUIREMENTS");
        }
        break;
      case "PROCEDURE_STEPS":
        if (document.procedureSteps && document.procedureSteps.length > 0) {
          sections.push("PROCEDURE_STEPS");
        }
        break;
      case "PREREQUISITES":
        if (document.prerequisites && document.prerequisites.length > 0) {
          sections.push("PREREQUISITES");
        }
        break;
      case "COMPLIANCE":
        if (document.compliance) {
          sections.push("COMPLIANCE");
        }
        break;
      case "TRAINING_AWARENESS":
        if (document.trainingRequirements && document.trainingRequirements.length > 0) {
          sections.push("TRAINING_AWARENESS");
        }
        break;
      case "REVIEW_MAINTENANCE":
        if (document.reviewTriggers && document.reviewTriggers.length > 0) {
          sections.push("REVIEW_MAINTENANCE");
        }
        break;
      case "REVISION_HISTORY":
        if (document.revisions && document.revisions.length > 0) {
          sections.push("REVISION_HISTORY");
        }
        break;
      default:
        break;
    }
  }

  return sections;
}

export function DocumentRenderer({
  document,
  mode = "view",
  showTableOfContents = false,
  className,
}: DocumentRendererProps) {
  const sectionsToRender = useMemo(
    () => getSectionsToRender(document),
    [document]
  );

  const headerData: DocumentHeaderData = useMemo(
    () => ({
      documentId: document.documentId,
      title: document.title,
      classification: document.classification,
      version: document.version,
      documentOwner: document.documentOwner,
      author: document.author,
      approvedBy: document.approvedBy,
      approvalDate: document.approvalDate,
      effectiveDate: document.effectiveDate,
      reviewFrequency: document.reviewFrequency,
      nextReviewDate: document.nextReviewDate,
      distribution: document.distribution,
      status: document.status,
    }),
    [document]
  );

  const definitions = useMemo(() => parseDefinitions(document), [document]);
  const isoControls = useMemo(() => parseISOControls(document), [document]);

  const renderSection = (sectionType: DocumentSectionType) => {
    const sectionNumber = getSectionNumber(document.documentType, sectionType);

    switch (sectionType) {
      case "DOCUMENT_HEADER":
        return (
          <DocumentHeader
            key="header"
            data={headerData}
            documentControl={document.documentControl}
          />
        );

      case "MANAGEMENT_COMMITMENT":
        return document.managementCommitment ? (
          <ManagementCommitment
            key="commitment"
            data={document.managementCommitment}
          />
        ) : null;

      case "PURPOSE":
        return document.purpose ? (
          <ContentSection
            key="purpose"
            sectionType="PURPOSE"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.PURPOSE}`}
            content={document.purpose}
          />
        ) : null;

      case "SCOPE":
        return document.scope ? (
          <ContentSection
            key="scope"
            sectionType="SCOPE"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.SCOPE}`}
            content={document.scope}
          />
        ) : null;

      case "DEFINITIONS":
        return definitions.length > 0 ? (
          <DefinitionsTable
            key="definitions"
            definitions={definitions}
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.DEFINITIONS}`}
          />
        ) : null;

      case "ISO_CONTROLS":
        return isoControls.length > 0 ? (
          <ISOControlsTable
            key="iso-controls"
            controls={isoControls}
            title={SECTION_LABELS.ISO_CONTROLS}
            sectionNumber={sectionNumber}
          />
        ) : null;

      case "RELATED_DOCUMENTS":
        return document.relatedDocuments && document.relatedDocuments.length > 0 ? (
          <RelatedDocuments
            key="related-docs"
            documents={document.relatedDocuments}
            title={SECTION_LABELS.RELATED_DOCUMENTS}
            sectionNumber={sectionNumber}
          />
        ) : null;

      case "ROLES_RESPONSIBILITIES":
        return document.roles && document.roles.length > 0 ? (
          <RolesResponsibilities
            key="roles"
            roles={document.roles}
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.ROLES_RESPONSIBILITIES}`}
          />
        ) : null;

      case "POLICY_STATEMENTS":
        return document.policyStatements ? (
          <ContentSection
            key="policy-statements"
            sectionType="POLICY_STATEMENTS"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.POLICY_STATEMENTS}`}
            content={document.policyStatements}
          />
        ) : null;

      case "REQUIREMENTS":
        return document.requirements ? (
          <ContentSection
            key="requirements"
            sectionType="REQUIREMENTS"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.REQUIREMENTS}`}
            content={document.requirements}
          />
        ) : null;

      case "PROCEDURE_STEPS":
        return document.procedureSteps && document.procedureSteps.length > 0 ? (
          <ProcessSteps
            key="procedure-steps"
            steps={document.procedureSteps.map(step => ({
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.activities?.join("\n") || step.objective || "",
              activities: step.activities || [],
              responsible: step.responsibility,
              estimatedDuration: step.timing,
              inputs: step.inputs,
              outputs: step.outputs || step.deliverables,
            }))}
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.PROCEDURE_STEPS}`}
          />
        ) : null;

      case "PREREQUISITES":
        return document.prerequisites && document.prerequisites.length > 0 ? (
          <PrerequisitesChecklist
            key="prerequisites"
            prerequisites={document.prerequisites.map(p => ({
              ...p,
              isMandatory: p.category === "MANDATORY",
            }))}
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.PREREQUISITES}`}
          />
        ) : null;

      case "COMPLIANCE":
        return document.compliance ? (
          <ContentSection
            key="compliance"
            sectionType="COMPLIANCE"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.COMPLIANCE}`}
            content={formatCompliance(document.compliance)}
          />
        ) : null;

      case "TRAINING_AWARENESS":
        return document.trainingRequirements && document.trainingRequirements.length > 0 ? (
          <ContentSection
            key="training"
            sectionType="TRAINING_AWARENESS"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.TRAINING_AWARENESS}`}
            content={formatTraining(document.trainingRequirements)}
          />
        ) : null;

      case "REVIEW_MAINTENANCE":
        return document.reviewTriggers && document.reviewTriggers.length > 0 ? (
          <ContentSection
            key="review"
            sectionType="REVIEW_MAINTENANCE"
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.REVIEW_MAINTENANCE}`}
            content={formatReviewMaintenance(document.reviewTriggers)}
          />
        ) : null;

      case "REVISION_HISTORY":
        return document.revisions && document.revisions.length > 0 ? (
          <RevisionHistory
            key="revisions"
            revisions={document.revisions}
            title={`${sectionNumber ? sectionNumber + ". " : ""}${SECTION_LABELS.REVISION_HISTORY}`}
          />
        ) : null;

      case "CUSTOM":
        return document.customSections?.map((section, index) => (
          <ContentSection
            key={`custom-${index}`}
            sectionType="CUSTOM"
            title={section.sectionNumber ? `${section.sectionNumber}. ${section.title}` : section.title}
            content={section.content || ""}
          />
        ));

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {/* Table of Contents */}
      {showTableOfContents && sectionsToRender.length > 2 && (
        <div className="mb-8 p-4 rounded-lg border bg-muted/30">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
            Table of Contents
          </h3>
          <nav className="space-y-1">
            {sectionsToRender.map((section) => {
              const sectionNumber = getSectionNumber(document.documentType, section);
              return (
                <a
                  key={section}
                  href={`#section-${section.toLowerCase()}`}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {sectionNumber ? `${sectionNumber}. ` : ""}{SECTION_LABELS[section]}
                </a>
              );
            })}
          </nav>
        </div>
      )}

      {/* Rendered Sections */}
      <div className="space-y-6">
        {sectionsToRender.map((sectionType, index) => (
          <div
            key={`${sectionType}-${index}`}
            id={`section-${sectionType.toLowerCase()}`}
          >
            {renderSection(sectionType)}
          </div>
        ))}
      </div>

      {/* Print Footer */}
      {mode === "print" && (
        <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground print:block hidden">
          <p>
            {document.documentId} v{document.version} | Classification:{" "}
            {document.classification}
          </p>
          <p>Printed on {new Date().toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

// Helper functions to format structured data as markdown-like content
function formatCompliance(compliance: ComplianceData): string {
  let content = "";

  if (compliance.verificationMethods.length > 0) {
    content += "### Compliance Measurement\n\nCompliance with this policy will be verified through:\n\n";
    compliance.verificationMethods.forEach((method) => {
      content += `- ${method}\n`;
    });
    content += "\n";
  }

  if (compliance.kpis.length > 0) {
    content += "### Key Performance Indicators\n\n";
    compliance.kpis.forEach((kpi) => {
      content += `- **${kpi.metric}**: Target ${kpi.target}`;
      if (kpi.description) content += ` - ${kpi.description}`;
      content += "\n";
    });
  }

  return content;
}

function formatTraining(requirements: TrainingRequirement[]): string {
  let content = "The following personnel shall receive training:\n\n";
  
  requirements.forEach((req) => {
    content += `### ${req.audience}\n`;
    content += `- **Content**: ${req.content}\n`;
    content += `- **Frequency**: ${req.frequency}\n\n`;
  });

  return content;
}

function formatReviewMaintenance(triggers: string[]): string {
  let content = "This document shall be reviewed:\n\n";
  content += "- **Mandatory Review**: At least annually (every 12 months)\n";
  content += "- **Triggered Review**: Following any of these events:\n";
  
  triggers.forEach((trigger) => {
    content += `  - ${trigger}\n`;
  });

  return content;
}
