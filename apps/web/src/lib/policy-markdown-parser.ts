/**
 * Policy Markdown Parser
 * 
 * Parses policy documents with YAML frontmatter and section markers
 * into structured data for the DocumentRenderer component.
 */

import type {
  DocumentType,
  DocumentSectionType,
  DocumentHeaderData,
  DocumentControlData,
  ManagementCommitmentData,
  DefinitionEntry,
  ISOControlEntry,
  RelatedDocumentEntry,
  RoleEntry,
  RACIActivity,
  ProcedureStepEntry,
  PrerequisiteEntry,
  RevisionEntry,
  ComplianceData,
  TrainingRequirement,
} from "@/components/policies/document-sections/types";

// ===========================================
// YAML FRONTMATTER INTERFACE
// ===========================================

export interface PolicyFrontmatter {
  documentId: string;
  title: string;
  shortTitle?: string;
  documentType: DocumentType;
  classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  status: string;
  version: string;
  majorVersion?: number;
  minorVersion?: number;
  documentOwner: string;
  author: string;
  approvedBy?: string;
  approvalDate?: string;
  effectiveDate?: string;
  reviewFrequency: string;
  nextReviewDate?: string;
  distribution?: string[];
  parentDocumentId?: string;
  childDocuments?: string[];
  tags?: string[];
  keywords?: string[];
}

// ===========================================
// PARSED SECTION INTERFACE
// ===========================================

export interface ParsedSection {
  type: DocumentSectionType;
  number?: string;
  title: string;
  content: string;
  subSections?: ParsedSection[];
  tables?: ParsedTable[];
  lists?: string[][];
}

export interface ParsedTable {
  id?: string;
  headers: string[];
  rows: string[][];
}

// ===========================================
// FULL PARSED DOCUMENT
// ===========================================

export interface ParsedPolicyDocument {
  frontmatter: PolicyFrontmatter;
  sections: ParsedSection[];
  
  // Extracted structured data
  managementCommitment?: ManagementCommitmentData;
  definitions?: DefinitionEntry[];
  roles?: RoleEntry[];
  raciMatrix?: RACIActivity[];
  isoControls?: ISOControlEntry[];
  relatedDocuments?: RelatedDocumentEntry[];
  trainingRequirements?: TrainingRequirement[];
  revisions?: RevisionEntry[];
  compliance?: ComplianceData;
}

// ===========================================
// PARSER FUNCTIONS
// ===========================================

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(content: string): { frontmatter: PolicyFrontmatter | null; body: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { frontmatter: null, body: content };
  }
  
  const [, yamlContent, body] = frontmatterMatch;
  
  try {
    // Simple YAML parser for our specific format
    const frontmatter = parseSimpleYaml(yamlContent!);
    return { frontmatter: frontmatter as unknown as PolicyFrontmatter, body: body! };
  } catch (e) {
    console.error("Failed to parse frontmatter:", e);
    return { frontmatter: null, body: content };
  }
}

/**
 * Simple YAML parser for policy frontmatter
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let inArray = false;
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith("#") || line.trim() === "") {
      continue;
    }
    
    // Check for array item
    if (line.match(/^\s+-\s+/)) {
      const value = line.replace(/^\s+-\s+/, "").trim();
      currentArray.push(value);
      continue;
    }
    
    // Check for key-value pair
    const keyValueMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyValueMatch) {
      // Save previous array if any
      if (inArray && currentKey) {
        result[currentKey] = currentArray;
        currentArray = [];
        inArray = false;
      }
      
      const [, key, value] = keyValueMatch as RegExpMatchArray;
      currentKey = key!;

      if (value === "" || value === undefined) {
        // Start of array or object
        inArray = true;
      } else {
        // Simple value
        let parsedValue: unknown = value;
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          parsedValue = value.slice(1, -1);
        }
        // Parse numbers
        else if (!isNaN(Number(value))) {
          parsedValue = Number(value);
        }
        // Parse booleans
        else if (value === "true") {
          parsedValue = true;
        } else if (value === "false") {
          parsedValue = false;
        }
        
        result[key!] = parsedValue;
        inArray = false;
      }
    }
  }
  
  // Save last array if any
  if (inArray && currentKey) {
    result[currentKey] = currentArray;
  }
  
  return result;
}

/**
 * Parse section markers from markdown content
 */
export function parseSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Match section markers: <!-- section: TYPE number: N -->
  const sectionRegex = /<!-- section: (\w+)(?:\s+number:\s*(\d+))? -->\n## ((?:\d+\.\s+)?.*)/g;
  
  // Split content by section markers
  const parts = content.split(/<!-- section: \w+(?:\s+number:\s*\d+)? -->/);
  const markers = [...content.matchAll(sectionRegex)];
  
  for (let i = 0; i < markers.length; i++) {
    const [, type, number, title] = markers[i]!;
    const sectionContent = parts[i + 1] || "";
    
    // Extract content until next section or end
    const nextSectionStart = sectionContent.indexOf("\n<!-- section:");
    const relevantContent = nextSectionStart >= 0 
      ? sectionContent.substring(0, nextSectionStart)
      : sectionContent;
    
    sections.push({
      type: type as DocumentSectionType,
      number: number || undefined,
      title: title!.replace(/^##\s*/, "").replace(/^\d+\.\s*/, "").trim(),
      content: relevantContent.trim(),
      tables: extractTables(relevantContent),
      subSections: extractSubSections(relevantContent),
    });
  }
  
  return sections;
}

/**
 * Extract tables from markdown content
 */
export function extractTables(content: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  
  // Match table markers and tables
  const tableMarkerRegex = /<!-- ([\w-]+)-table -->\n/g;
  const tableRegex = /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g;
  
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const headerRow = match[1]!;
    const bodyRows = match[2]!;
    
    // Find preceding marker if any
    const precedingContent = content.substring(0, match.index);
    const markerMatch = precedingContent.match(/<!-- ([\w-]+)-table -->\n$/);
    const tableId = markerMatch ? markerMatch[1] : undefined;
    
    // Parse headers
    const headers = headerRow
      .split("|")
      .map((h) => h.trim())
      .filter((h) => h);
    
    // Parse rows
    const rows = bodyRows
      .trim()
      .split("\n")
      .map((row) =>
        row
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell)
      );
    
    tables.push({ id: tableId, headers, rows });
  }
  
  return tables;
}

/**
 * Extract sub-sections (### headings) from content
 */
export function extractSubSections(content: string): ParsedSection[] {
  const subSections: ParsedSection[] = [];
  
  // Match ### headings
  const subSectionRegex = /### ((?:\d+\.\d+\s+)?.*)\n([\s\S]*?)(?=### |\n## |$)/g;
  
  let match;
  while ((match = subSectionRegex.exec(content)) !== null) {
    const [, title, sectionContent] = match;

    subSections.push({
      type: "CUSTOM",
      title: title!.trim(),
      content: sectionContent!.trim(),
      tables: extractTables(sectionContent!),
    });
  }
  
  return subSections;
}

/**
 * Extract definitions from a definitions table
 */
export function extractDefinitions(table: ParsedTable): DefinitionEntry[] {
  if (!table.headers.some((h) => h.toLowerCase().includes("term"))) {
    return [];
  }
  
  return table.rows.map((row) => ({
    term: row[0]?.replace(/\*\*/g, "") || "",
    definition: row[1] || "",
  }));
}

/**
 * Extract roles from a roles table
 */
export function extractRoles(table: ParsedTable): RoleEntry[] {
  if (!table.headers.some((h) => h.toLowerCase().includes("role"))) {
    return [];
  }
  
  return table.rows.map((row) => ({
    role: row[0]?.replace(/\*\*/g, "") || "",
    responsibilities: [row[1] || ""],
  }));
}

/**
 * Extract RACI matrix from a table
 */
export function extractRACIMatrix(table: ParsedTable): RACIActivity[] {
  if (!table.headers.some((h) => h.toLowerCase().includes("activity"))) {
    return [];
  }
  
  const roles = table.headers.slice(1); // Skip "Activity" column
  
  return table.rows.map((row) => {
    const activity = row[0] || "";
    const assignments: Record<string, "R" | "A" | "C" | "I"> = {};
    
    roles.forEach((role, index) => {
      const value = row[index + 1]?.trim().toUpperCase();
      if (value === "R" || value === "A" || value === "C" || value === "I") {
        assignments[role] = value;
      }
    });
    
    return { activity, assignments };
  });
}

/**
 * Extract ISO controls from tables
 */
export function extractISOControls(
  primaryTable?: ParsedTable,
  supportingTable?: ParsedTable
): ISOControlEntry[] {
  const controls: ISOControlEntry[] = [];
  
  if (primaryTable) {
    primaryTable.rows.forEach((row) => {
      controls.push({
        controlId: row[0] || "",
        controlTitle: row[1] || "",
        relevance: row[2] || "",
        isPrimary: true,
      });
    });
  }
  
  if (supportingTable) {
    supportingTable.rows.forEach((row) => {
      controls.push({
        controlId: row[0] || "",
        controlTitle: row[1] || "",
        relevance: row[2] || "",
        isPrimary: false,
      });
    });
  }
  
  return controls;
}

/**
 * Extract related documents from tables
 */
export function extractRelatedDocuments(
  tables: ParsedTable[],
  categories: { id: string; category: RelatedDocumentEntry["category"] }[]
): RelatedDocumentEntry[] {
  const documents: RelatedDocumentEntry[] = [];
  
  for (const { id, category } of categories) {
    const table = tables.find((t) => t.id === id);
    if (table) {
      table.rows.forEach((row) => {
        documents.push({
          documentId: row[0] || "",
          title: row[1] || "",
          category,
          description: row[2],
        });
      });
    }
  }
  
  return documents;
}

/**
 * Extract training requirements from table
 */
export function extractTrainingRequirements(table: ParsedTable): TrainingRequirement[] {
  if (!table.headers.some((h) => h.toLowerCase().includes("audience"))) {
    return [];
  }
  
  return table.rows.map((row) => ({
    audience: row[0]?.replace(/\*\*/g, "") || "",
    content: row[1] || "",
    frequency: row[2] || "",
  }));
}

/**
 * Extract revision history from table
 */
export function extractRevisionHistory(table: ParsedTable): RevisionEntry[] {
  if (!table.headers.some((h) => h.toLowerCase().includes("version"))) {
    return [];
  }
  
  return table.rows.map((row) => ({
    version: row[0] || "",
    date: row[1] || "",
    author: row[2] || "",
    approvedBy: row[3],
    description: row[4] || "",
  }));
}

/**
 * Extract management commitment from section content
 */
export function extractManagementCommitment(content: string): ManagementCommitmentData {
  // Extract blockquote statement
  const statementMatch = content.match(/>\s*([\s\S]*?)(?=\n\nWe commit to:|$)/);
  const statement = statementMatch
    ? statementMatch[1]!.replace(/>\s*/g, "").trim()
    : "";

  // Extract commitments list
  const commitmentsMatch = content.match(/We commit to:\n((?:- .+\n?)+)/);
  const commitments = commitmentsMatch
    ? commitmentsMatch[1]!
        .split("\n")
        .filter((l) => l.startsWith("-"))
        .map((l) => l.replace(/^-\s*/, "").trim())
    : [];
  
  // Extract signature info from table
  const signatureMatch = content.match(/\*\*Name\*\*\s*\|\s*(.+)/);
  const titleMatch = content.match(/\*\*Title\*\*\s*\|\s*(.+)/);

  return {
    statement,
    commitments,
    signatory: signatureMatch ? signatureMatch[1]!.trim() : undefined,
    signatoryTitle: titleMatch ? titleMatch[1]!.trim() : undefined,
  };
}

// ===========================================
// MAIN PARSE FUNCTION
// ===========================================

/**
 * Parse a full policy markdown document
 */
export function parsePolicyMarkdown(markdown: string): ParsedPolicyDocument {
  // Parse frontmatter
  const { frontmatter, body } = parseFrontmatter(markdown);
  
  if (!frontmatter) {
    throw new Error("Document must have YAML frontmatter");
  }
  
  // Parse sections
  const sections = parseSections(body);
  
  // Extract structured data from sections
  const result: ParsedPolicyDocument = {
    frontmatter,
    sections,
  };
  
  // Process each section to extract structured data
  for (const section of sections) {
    switch (section.type) {
      case "MANAGEMENT_COMMITMENT":
        result.managementCommitment = extractManagementCommitment(section.content);
        break;
        
      case "DEFINITIONS":
        const defTable = section.tables?.find((t) => 
          t.headers.some((h) => h.toLowerCase().includes("term"))
        );
        if (defTable) {
          result.definitions = extractDefinitions(defTable);
        }
        break;
        
      case "ROLES_RESPONSIBILITIES":
        const rolesTable = section.tables?.find((t) => t.id === "roles");
        const raciTable = section.tables?.find((t) => t.id === "raci-matrix");
        
        if (rolesTable) {
          result.roles = extractRoles(rolesTable);
        }
        if (raciTable) {
          result.raciMatrix = extractRACIMatrix(raciTable);
        }
        break;
        
      case "ISO_CONTROLS":
        const primaryTable = section.tables?.find((t) => t.id === "iso-controls-primary");
        const supportingTable = section.tables?.find((t) => t.id === "iso-controls-supporting");
        
        // Or find by sub-section
        const primarySubSection = section.subSections?.find((s) => 
          s.title.includes("Primary")
        );
        const supportingSubSection = section.subSections?.find((s) => 
          s.title.includes("Supporting")
        );
        
        result.isoControls = extractISOControls(
          primaryTable || primarySubSection?.tables?.[0],
          supportingTable || supportingSubSection?.tables?.[0]
        );
        break;
        
      case "RELATED_DOCUMENTS":
        result.relatedDocuments = extractRelatedDocuments(section.tables || [], [
          { id: "related-docs-parent", category: "PARENT" },
          { id: "related-docs-supporting-policies", category: "SUPPORTING_POLICY" },
          { id: "related-docs-supporting-standards-procedures", category: "SUPPORTING_STANDARD" },
          { id: "related-docs-isms-documents", category: "SUPPORTING_STANDARD" },
          { id: "related-docs-templates-forms", category: "TEMPLATE" },
          { id: "related-docs-external", category: "EXTERNAL" },
        ]);
        break;
        
      case "TRAINING_AWARENESS":
        const trainingTable = section.tables?.find((t) => t.id === "training");
        if (trainingTable) {
          result.trainingRequirements = extractTrainingRequirements(trainingTable);
        }
        break;
        
      case "REVISION_HISTORY":
        const revTable = section.tables?.find((t) => t.id === "revision-history");
        if (revTable) {
          result.revisions = extractRevisionHistory(revTable);
        }
        break;
        
      case "COMPLIANCE":
        const kpiTable = section.tables?.find((t) => t.id === "kpi");
        result.compliance = {
          verificationMethods: [],
          kpis: kpiTable?.rows.map((row) => ({
            metric: row[0] || "",
            target: row[1] || "",
          })) || [],
        };
        break;
    }
  }
  
  return result;
}

/**
 * Convert parsed document to PolicyDocumentData for the renderer
 */
export function toRendererFormat(parsed: ParsedPolicyDocument) {
  const fm = parsed.frontmatter;
  
  return {
    id: fm.documentId,
    documentId: fm.documentId,
    title: fm.title,
    shortTitle: fm.shortTitle,
    documentType: fm.documentType,
    classification: fm.classification,
    status: fm.status,
    version: fm.version,
    documentOwner: fm.documentOwner,
    author: fm.author,
    approvedBy: fm.approvedBy,
    approvalDate: fm.approvalDate,
    effectiveDate: fm.effectiveDate,
    reviewFrequency: fm.reviewFrequency,
    nextReviewDate: fm.nextReviewDate,
    distribution: fm.distribution,
    
    managementCommitment: parsed.managementCommitment,
    definitions: parsed.definitions,
    roles: parsed.roles,
    isoControls: parsed.isoControls,
    relatedDocuments: parsed.relatedDocuments,
    trainingRequirements: parsed.trainingRequirements,
    revisions: parsed.revisions,
    compliance: parsed.compliance,
    
    // Extract content sections
    purpose: parsed.sections.find((s) => s.type === "PURPOSE")?.content,
    scope: parsed.sections.find((s) => s.type === "SCOPE")?.content,
    policyStatements: parsed.sections.find((s) => s.type === "POLICY_STATEMENTS")?.content,
    requirements: parsed.sections.find((s) => s.type === "REQUIREMENTS")?.content,
  };
}
