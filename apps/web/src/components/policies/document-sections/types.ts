// =============================================
// DOCUMENT SECTION TYPES
// Based on actual ISO 27001 document structures:
// - POL-xxx: Policies
// - STD-xxx: Standards  
// - PRO-xxx: Procedures
// =============================================

export type DocumentSectionType =
  | 'DOCUMENT_HEADER'        // Metadata header (ID, version, owner, dates)
  | 'DOCUMENT_CONTROL'       // Document control table (Standards/Procedures)
  | 'MANAGEMENT_COMMITMENT'  // Executive commitment statement (Policies only)
  | 'PURPOSE'                // Purpose/objectives section
  | 'SCOPE'                  // Scope and applicability
  | 'DEFINITIONS'            // Definitions table
  | 'ISO_CONTROLS'           // ISO 27001:2022 Controls Addressed
  | 'RELATED_DOCUMENTS'      // Related/referenced documents
  | 'ROLES_RESPONSIBILITIES' // Roles table + RACI Matrix
  | 'POLICY_STATEMENTS'      // Policy statements (Policies only)
  | 'REQUIREMENTS'           // Requirements/standards content
  | 'PROCEDURE_STEPS'        // Step-by-step procedure (with sub-steps)
  | 'PREREQUISITES'          // Prerequisites checklist
  | 'COMPLIANCE'             // Compliance measurement & KPIs
  | 'EXCEPTIONS'             // Exception handling
  | 'TRAINING_AWARENESS'     // Training requirements
  | 'REVIEW_MAINTENANCE'     // Review triggers and schedule
  | 'REVISION_HISTORY'       // Version history table
  | 'APPENDIX'               // Appendix content
  | 'CUSTOM';                // Freeform section

export type DocumentType =
  | 'POLICY'
  | 'STANDARD'
  | 'PROCEDURE'
  | 'WORK_INSTRUCTION'
  | 'FORM'
  | 'TEMPLATE'
  | 'CHECKLIST'
  | 'GUIDELINE'
  | 'RECORD';

// Section data interfaces
export interface DocumentSection {
  id: string;
  sectionType: DocumentSectionType;
  title: string;
  sectionNumber?: string; // e.g., "1", "2.1", "6.1.2"
  order: number;
  content?: string;
  structuredData?: Record<string, unknown>;
  isVisible: boolean;
  isCollapsed: boolean;
}

// Document Header Metadata - inline format for policies
export interface DocumentHeaderData {
  documentId: string;
  title: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  version: string;
  documentOwner: string;
  author: string;
  approvedBy?: string;
  approvalDate?: string;
  effectiveDate?: string;
  reviewFrequency: string;
  nextReviewDate?: string;
  distribution?: string[];
  status: string;
}

// Document Control Table - for Standards and Procedures
export interface DocumentControlData {
  documentType: string;
  parentPolicy?: string;
  parentPolicyId?: string;
  distribution: string;
  confidentiality: string;
  approvalAuthority: string;
  implementationDate?: string;
  compliance: string; // e.g., "Mandatory for all risk assessment activities"
}

// Management Commitment Statement (Policies only)
export interface ManagementCommitmentData {
  statement: string;        // The commitment text (can be multi-paragraph)
  commitments?: string[];   // Bullet points of specific commitments
  signatory?: string;
  signatoryTitle?: string;
  signatureDate?: string;
}

// Definitions Table
export interface DefinitionEntry {
  id?: string;
  term: string;
  definition: string;
  source?: string;
}

// ISO 27001 Controls Table
export interface ISOControlEntry {
  controlId: string;           // e.g., "5.7", "6.1.2"
  controlTitle: string;        // e.g., "Threat intelligence"
  relevance: string;           // How the document addresses this control
  isPrimary?: boolean;         // Primary vs Supporting control
  coverage?: 'FULL' | 'PARTIAL' | 'MINIMAL';
}

// Related Documents - grouped by category
export interface RelatedDocumentEntry {
  documentId: string;
  title: string;
  category: 'PARENT' | 'SUPPORTING_POLICY' | 'SUPPORTING_STANDARD' | 'SUPPORTING_PROCEDURE' | 'TEMPLATE' | 'FORM' | 'EXTERNAL';
  description?: string;
  url?: string;
}

// Roles and Responsibilities
export interface RoleEntry {
  role: string;
  responsibilities: string[];
  raciMatrix?: Record<string, 'R' | 'A' | 'C' | 'I'>;
}

// RACI Matrix Entry
export interface RACIActivity {
  activity: string;
  assignments: Record<string, 'R' | 'A' | 'C' | 'I'>; // role -> RACI
}

// Procedure Step with sub-steps
export interface ProcedureStepEntry {
  id?: string;
  stepNumber: string;          // "1", "1.1", "1.1.1"
  title: string;
  description?: string;
  objective?: string;
  activities: string[];        // Numbered activities within the step
  deliverables?: string[];
  responsibility?: string;
  responsible?: string;
  accountable?: string;
  timing?: string;             // e.g., "Day 1-2", "Within 24 hours"
  estimatedDuration?: string;
  inputs?: string[];
  outputs?: string[];
  isDecisionPoint?: boolean;
  decisionOptions?: Array<{ label: string; nextStep: string }>;
  subSteps?: ProcedureStepEntry[];
}

// Alias for backwards compatibility
export type ProcessStepEntry = ProcedureStepEntry;

// Prerequisites Checklist (Procedures)
export interface PrerequisiteEntry {
  id?: string;
  category: 'MANDATORY' | 'SUPPORTING' | 'TOOLS' | 'APPROVALS';
  item: string;
  isChecked?: boolean;
  isMandatory?: boolean;
}

// Compliance Section
export interface ComplianceData {
  verificationMethods: string[];
  kpis: Array<{
    metric: string;
    target: string;
    description?: string;
  }>;
  exceptionProcess?: string;
  nonComplianceConsequences?: string[];
}

// Training Requirements
export interface TrainingRequirement {
  audience: string;
  content: string;
  frequency: string;
}

// Revision History Entry
export interface RevisionEntry {
  version: string;
  date: string;
  author: string;
  approvedBy?: string;
  description: string;
}

// Section templates by document type - based on actual document analysis
export const SECTION_TEMPLATES: Record<DocumentType, DocumentSectionType[]> = {
  POLICY: [
    'DOCUMENT_HEADER',
    'MANAGEMENT_COMMITMENT',
    'PURPOSE',
    'SCOPE',
    'DEFINITIONS',
    'POLICY_STATEMENTS',      // Main policy content (e.g., "5. Policy Statements")
    'ROLES_RESPONSIBILITIES', // Includes RACI Matrix
    'COMPLIANCE',             // Compliance measurement, KPIs
    'RELATED_DOCUMENTS',
    'ISO_CONTROLS',
    'TRAINING_AWARENESS',
    'REVIEW_MAINTENANCE',
    'REVISION_HISTORY',
  ],
  STANDARD: [
    'DOCUMENT_HEADER',
    'DOCUMENT_CONTROL',       // Document Control table
    'PURPOSE',
    'SCOPE',
    'DEFINITIONS',
    'ISO_CONTROLS',           // Primary and Supporting Controls
    'REQUIREMENTS',           // Main standard content
    'RELATED_DOCUMENTS',
    'REVISION_HISTORY',
  ],
  PROCEDURE: [
    'DOCUMENT_HEADER',
    'DOCUMENT_CONTROL',
    'PURPOSE',
    'SCOPE',
    'RELATED_DOCUMENTS',
    'DEFINITIONS',
    'PREREQUISITES',          // With categories: Mandatory, Supporting, Tools, Approvals
    'PROCEDURE_STEPS',        // Detailed step-by-step with sub-steps
    'REVISION_HISTORY',
  ],
  WORK_INSTRUCTION: [
    'DOCUMENT_HEADER',
    'PURPOSE',
    'SCOPE',
    'PREREQUISITES',
    'PROCEDURE_STEPS',
    'REVISION_HISTORY',
  ],
  FORM: ['DOCUMENT_HEADER', 'PURPOSE', 'CUSTOM'],
  TEMPLATE: ['DOCUMENT_HEADER', 'PURPOSE', 'CUSTOM'],
  CHECKLIST: ['DOCUMENT_HEADER', 'PURPOSE', 'PREREQUISITES', 'CUSTOM'],
  GUIDELINE: ['DOCUMENT_HEADER', 'PURPOSE', 'SCOPE', 'CUSTOM', 'RELATED_DOCUMENTS'],
  RECORD: ['DOCUMENT_HEADER', 'CUSTOM'],
};

// Section display names
export const SECTION_LABELS: Record<DocumentSectionType, string> = {
  DOCUMENT_HEADER: 'Document Information',
  DOCUMENT_CONTROL: 'Document Control',
  MANAGEMENT_COMMITMENT: 'Management Commitment Statement',
  PURPOSE: 'Purpose',
  SCOPE: 'Scope',
  DEFINITIONS: 'Definitions',
  ISO_CONTROLS: 'ISO 27001:2022 Controls Addressed',
  RELATED_DOCUMENTS: 'Related Documents',
  ROLES_RESPONSIBILITIES: 'Roles and Responsibilities',
  POLICY_STATEMENTS: 'Policy Statements',
  REQUIREMENTS: 'Requirements',
  PROCEDURE_STEPS: 'Procedure Steps',
  PREREQUISITES: 'Prerequisites',
  COMPLIANCE: 'Compliance',
  EXCEPTIONS: 'Exceptions',
  TRAINING_AWARENESS: 'Training and Awareness',
  REVIEW_MAINTENANCE: 'Review and Maintenance',
  REVISION_HISTORY: 'Revision History',
  APPENDIX: 'Appendix',
  CUSTOM: 'Custom Section',
};

// Default section numbers by document type
export const SECTION_NUMBERS: Record<DocumentType, Record<DocumentSectionType, string>> = {
  POLICY: {
    DOCUMENT_HEADER: '',
    DOCUMENT_CONTROL: '',
    MANAGEMENT_COMMITMENT: '',
    PURPOSE: '1',
    SCOPE: '2',
    DEFINITIONS: '3',
    POLICY_STATEMENTS: '4',
    ROLES_RESPONSIBILITIES: '5',
    COMPLIANCE: '6',
    RELATED_DOCUMENTS: '7',
    ISO_CONTROLS: '8',
    TRAINING_AWARENESS: '9',
    REVIEW_MAINTENANCE: '10',
    REVISION_HISTORY: '11',
    EXCEPTIONS: '',
    PREREQUISITES: '',
    PROCEDURE_STEPS: '',
    REQUIREMENTS: '',
    APPENDIX: '',
    CUSTOM: '',
  },
  STANDARD: {
    DOCUMENT_HEADER: '',
    DOCUMENT_CONTROL: '',
    MANAGEMENT_COMMITMENT: '',
    PURPOSE: '1',
    SCOPE: '2',
    DEFINITIONS: '3',
    ISO_CONTROLS: '4',
    REQUIREMENTS: '5',
    RELATED_DOCUMENTS: '6',
    REVISION_HISTORY: '7',
    POLICY_STATEMENTS: '',
    ROLES_RESPONSIBILITIES: '',
    COMPLIANCE: '',
    EXCEPTIONS: '',
    TRAINING_AWARENESS: '',
    REVIEW_MAINTENANCE: '',
    PREREQUISITES: '',
    PROCEDURE_STEPS: '',
    APPENDIX: '',
    CUSTOM: '',
  },
  PROCEDURE: {
    DOCUMENT_HEADER: '',
    DOCUMENT_CONTROL: '',
    MANAGEMENT_COMMITMENT: '',
    PURPOSE: '1',
    SCOPE: '2',
    RELATED_DOCUMENTS: '3',
    DEFINITIONS: '4',
    PREREQUISITES: '5',
    PROCEDURE_STEPS: '6',
    REVISION_HISTORY: '7',
    POLICY_STATEMENTS: '',
    ROLES_RESPONSIBILITIES: '',
    ISO_CONTROLS: '',
    REQUIREMENTS: '',
    COMPLIANCE: '',
    EXCEPTIONS: '',
    TRAINING_AWARENESS: '',
    REVIEW_MAINTENANCE: '',
    APPENDIX: '',
    CUSTOM: '',
  },
  // Simplified for other types
  WORK_INSTRUCTION: {} as Record<DocumentSectionType, string>,
  FORM: {} as Record<DocumentSectionType, string>,
  TEMPLATE: {} as Record<DocumentSectionType, string>,
  CHECKLIST: {} as Record<DocumentSectionType, string>,
  GUIDELINE: {} as Record<DocumentSectionType, string>,
  RECORD: {} as Record<DocumentSectionType, string>,
};

// Section icons (Lucide icon names)
export const SECTION_ICONS: Record<DocumentSectionType, string> = {
  DOCUMENT_HEADER: 'FileText',
  DOCUMENT_CONTROL: 'ClipboardList',
  MANAGEMENT_COMMITMENT: 'Quote',
  PURPOSE: 'Target',
  SCOPE: 'Maximize2',
  DEFINITIONS: 'BookOpen',
  ISO_CONTROLS: 'Shield',
  RELATED_DOCUMENTS: 'Link2',
  ROLES_RESPONSIBILITIES: 'Users',
  POLICY_STATEMENTS: 'FileCheck',
  REQUIREMENTS: 'ListChecks',
  PROCEDURE_STEPS: 'ListOrdered',
  PREREQUISITES: 'CheckSquare',
  COMPLIANCE: 'Scale',
  EXCEPTIONS: 'AlertTriangle',
  TRAINING_AWARENESS: 'GraduationCap',
  REVIEW_MAINTENANCE: 'RefreshCw',
  REVISION_HISTORY: 'History',
  APPENDIX: 'Paperclip',
  CUSTOM: 'FileEdit',
};
