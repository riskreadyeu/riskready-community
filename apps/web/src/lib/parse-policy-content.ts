/**
 * Parse policy document content (markdown) into structured data
 * for the DocumentRenderer component
 */

import type {
  ManagementCommitmentData,
  DefinitionEntry,
  RoleEntry,
  RACIActivity,
  RelatedDocumentEntry,
  ISOControlEntry,
  RevisionEntry,
} from "@/components/policies/document-sections/types";

export interface ParsedPolicyContent {
  managementCommitment?: ManagementCommitmentData;
  definitions?: DefinitionEntry[];
  roles?: RoleEntry[];
  raciMatrix?: RACIActivity[];
  relatedDocuments?: RelatedDocumentEntry[];
  policyStatements?: string;
  requirements?: string;
  framework?: string;
  compliance?: string;
  training?: string;
  reviewMaintenance?: string;
}

/**
 * Extract Management Commitment section from markdown
 */
function parseManagementCommitment(content: string): ManagementCommitmentData | undefined {
  // Look for Management Commitment section
  const sectionMatch = content.match(
    /##\s*Management Commitment(?:\s+Statement)?\s*\n([\s\S]*?)(?=\n##\s|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  
  const sectionContent = sectionMatch[1]!;

  // Extract blockquote statement
  const blockquoteMatch = sectionContent.match(/>\s*([\s\S]*?)(?=\n\nWe commit to:|(?:\n[^>])|$)/);
  let statement = '';

  if (blockquoteMatch) {
    statement = blockquoteMatch[1]!
      .split('\n')
      .map(line => line.replace(/^>\s*/, '').trim())
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // Extract commitments list
  const commitmentsMatch = sectionContent.match(/We commit to:\s*\n((?:[>\s]*[-•*]\s*.+\n?)+)/i);
  const commitments: string[] = [];

  if (commitmentsMatch) {
    const listContent = commitmentsMatch[1]!;
    const items = listContent.match(/[>\s]*[-•*]\s*(.+)/g);
    if (items) {
      items.forEach(item => {
        const cleaned = item.replace(/^[>\s]*[-•*]\s*/, '').trim();
        if (cleaned) commitments.push(cleaned);
      });
    }
  }
  
  // Extract signatory info
  const nameMatch = sectionContent.match(/\*\*Name\*\*[:\s|]+\[?([^\]|\n]+)/i);
  const titleMatch = sectionContent.match(/\*\*Title\*\*[:\s|]+([^|\n]+)/i);

  return {
    statement,
    commitments: commitments.length > 0 ? commitments : undefined,
    signatory: nameMatch ? nameMatch[1]!.trim() : undefined,
    signatoryTitle: titleMatch ? titleMatch[1]!.trim() : undefined,
  };
}

/**
 * Extract definitions table from markdown
 */
function parseDefinitions(content: string): DefinitionEntry[] | undefined {
  // Look for Definitions section
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Definitions\s*\n([\s\S]*?)(?=\n##\s|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  
  const sectionContent = sectionMatch[1]!;

  // Find markdown table
  const tableMatch = sectionContent.match(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/);

  if (!tableMatch) return undefined;

  const rows = tableMatch[2]!.trim().split('\n');
  const definitions: DefinitionEntry[] = [];

  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      definitions.push({
        term: cells[0]!.replace(/\*\*/g, ''),
        definition: cells[1]!,
      });
    }
  }
  
  return definitions.length > 0 ? definitions : undefined;
}

/**
 * Extract roles and responsibilities from markdown
 */
function parseRoles(content: string): RoleEntry[] | undefined {
  // Look for Roles section
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Roles\s+(?:and\s+)?Responsibilities\s*\n([\s\S]*?)(?=\n##\s|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  
  const sectionContent = sectionMatch[1]!;

  // Find the roles table (typically under ### Key Roles or similar)
  const tableMatch = sectionContent.match(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/);

  if (!tableMatch) return undefined;

  const rows = tableMatch[2]!.trim().split('\n');
  const roles: RoleEntry[] = [];

  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      roles.push({
        role: cells[0]!.replace(/\*\*/g, ''),
        responsibilities: cells[1]!.split(';').map(r => r.trim()).filter(Boolean),
      });
    }
  }
  
  return roles.length > 0 ? roles : undefined;
}

/**
 * Extract RACI matrix from markdown
 */
function parseRACIMatrix(content: string): RACIActivity[] | undefined {
  // Look for RACI Matrix
  const sectionMatch = content.match(
    /###?\s*\d*\.?\d*\s*RACI Matrix\s*\n([\s\S]*?)(?=\n###?\s|\n##\s|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  
  const sectionContent = sectionMatch[1]!;

  // Find markdown table
  const tableMatch = sectionContent.match(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/);

  if (!tableMatch) return undefined;

  const headers = tableMatch[1]!.split('|').map(h => h.trim()).filter(Boolean);
  const rows = tableMatch[2]!.trim().split('\n');
  const activities: RACIActivity[] = [];

  // Skip first header (Activity column)
  const roleHeaders = headers.slice(1);

  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      const activity = cells[0]!;
      const assignments: Record<string, 'R' | 'A' | 'C' | 'I'> = {};

      for (let i = 1; i < cells.length && i <= roleHeaders.length; i++) {
        const value = cells[i]!.toUpperCase().trim();
        if (value === 'R' || value === 'A' || value === 'C' || value === 'I') {
          assignments[roleHeaders[i - 1]!] = value;
        }
      }
      
      if (Object.keys(assignments).length > 0) {
        activities.push({ activity, assignments });
      }
    }
  }
  
  return activities.length > 0 ? activities : undefined;
}

/**
 * Extract related documents from markdown
 */
function parseRelatedDocuments(content: string): RelatedDocumentEntry[] | undefined {
  // Look for Related Documents section
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Related Documents\s*\n([\s\S]*?)(?=\n##\s[^#]|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  
  const sectionContent = sectionMatch[1]!;
  const documents: RelatedDocumentEntry[] = [];
  
  // Parse each subsection
  const subsections = [
    { regex: /###?\s*\d*\.?\d*\s*Parent Policy\s*\n([\s\S]*?)(?=\n###|\n##|$)/i, category: 'PARENT' as const },
    { regex: /###?\s*\d*\.?\d*\s*Supporting Policies\s*\n([\s\S]*?)(?=\n###|\n##|$)/i, category: 'SUPPORTING_POLICY' as const },
    { regex: /###?\s*\d*\.?\d*\s*Supporting Standards(?: and Procedures)?\s*\n([\s\S]*?)(?=\n###|\n##|$)/i, category: 'SUPPORTING_STANDARD' as const },
    { regex: /###?\s*\d*\.?\d*\s*Key ISMS Documents\s*\n([\s\S]*?)(?=\n###|\n##|$)/i, category: 'SUPPORTING_STANDARD' as const },
    { regex: /###?\s*\d*\.?\d*\s*Templates(?: and Forms)?\s*\n([\s\S]*?)(?=\n###|\n##|$)/i, category: 'TEMPLATE' as const },
    { regex: /###?\s*\d*\.?\d*\s*External References\s*\n([\s\S]*?)(?=\n###|\n##|$)/i, category: 'EXTERNAL' as const },
  ];
  
  for (const { regex, category } of subsections) {
    const match = sectionContent.match(regex);
    if (match) {
      const tableMatch = match[1]!.match(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/);
      if (tableMatch) {
        const rows = tableMatch[2]!.trim().split('\n');
        for (const row of rows) {
          const cells = row.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length >= 2) {
            documents.push({
              documentId: cells[0]!,
              title: cells[1]!,
              category,
              description: cells[2] || undefined,
            });
          }
        }
      }
      
      // Also check for bullet list format
      const listItems = match[1]!.match(/[-•*]\s+(.+)/g);
      if (listItems && !tableMatch) {
        listItems.forEach(item => {
          const cleaned = item.replace(/^[-•*]\s+/, '').trim();
          documents.push({
            documentId: '',
            title: cleaned,
            category,
          });
        });
      }
    }
  }
  
  return documents.length > 0 ? documents : undefined;
}

/**
 * Extract Policy Statements section
 */
function parsePolicyStatements(content: string): string | undefined {
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Policy Statements?\s*\n([\s\S]*?)(?=\n##\s[^#]|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  return sectionMatch[1]!.trim();
}

/**
 * Extract Framework section
 */
function parseFramework(content: string): string | undefined {
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*(?:Risk Management )?Framework\s*\n([\s\S]*?)(?=\n##\s[^#]|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  return sectionMatch[1]!.trim();
}

/**
 * Extract Compliance section
 */
function parseCompliance(content: string): string | undefined {
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Compliance\s*\n([\s\S]*?)(?=\n##\s[^#]|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  return sectionMatch[1]!.trim();
}

/**
 * Extract Training section
 */
function parseTraining(content: string): string | undefined {
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Training(?: and Awareness)?\s*\n([\s\S]*?)(?=\n##\s[^#]|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  return sectionMatch[1]!.trim();
}

/**
 * Extract Review and Maintenance section
 */
function parseReviewMaintenance(content: string): string | undefined {
  const sectionMatch = content.match(
    /##\s*\d*\.?\s*Review(?: and Maintenance)?\s*\n([\s\S]*?)(?=\n##\s[^#]|\n---|\n# |$)/i
  );
  
  if (!sectionMatch) return undefined;
  return sectionMatch[1]!.trim();
}

/**
 * Main parser function - extracts all structured data from markdown content
 */
export function parsePolicyContent(content: string): ParsedPolicyContent {
  if (!content) return {};
  
  return {
    managementCommitment: parseManagementCommitment(content),
    definitions: parseDefinitions(content),
    roles: parseRoles(content),
    raciMatrix: parseRACIMatrix(content),
    relatedDocuments: parseRelatedDocuments(content),
    policyStatements: parsePolicyStatements(content),
    framework: parseFramework(content),
    compliance: parseCompliance(content),
    training: parseTraining(content),
    reviewMaintenance: parseReviewMaintenance(content),
  };
}
