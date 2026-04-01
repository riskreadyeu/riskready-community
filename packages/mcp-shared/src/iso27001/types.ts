export interface Iso27001DocumentDef {
  documentId: string;
  title: string;
  documentType: 'POLICY' | 'STANDARD' | 'PROCEDURE';
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  approvalLevel:
    | 'BOARD'
    | 'EXECUTIVE'
    | 'SENIOR_MANAGEMENT'
    | 'MANAGEMENT'
    | 'TEAM_LEAD'
    | 'PROCESS_OWNER';
  reviewFrequency:
    | 'MONTHLY'
    | 'QUARTERLY'
    | 'SEMI_ANNUAL'
    | 'ANNUAL'
    | 'BIENNIAL'
    | 'TRIENNIAL'
    | 'ON_CHANGE'
    | 'AS_NEEDED';
  wave: 1 | 2 | 3;
  isoClause?: string;
  sections: SectionDef[];
  controlMappings: ControlMappingDef[];
  riskMappings?: RiskMappingDef[];
  tags: string[];
  requiresAcknowledgment: boolean;
  parentDocumentId?: string;
  documentOwner: string;
  seeded?: boolean;
}

export interface SectionDef {
  sectionType: string;
  title: string;
  promptHint: string;
  isoReference?: string;
}

export interface ControlMappingDef {
  controlRef: string;
  mappingType: 'IMPLEMENTS' | 'SUPPORTS' | 'REFERENCES';
  coverage: 'FULL' | 'PARTIAL';
}

export interface RiskMappingDef {
  riskRef: string;
  mappingType: 'MITIGATES' | 'ADDRESSES' | 'MONITORS';
}

export interface GenerationResult {
  wave: number;
  generated: { documentId: string; title: string; pendingActionId: string }[];
  skipped: { documentId: string; title: string; reason: string }[];
  summary: string;
}
