import type { Iso27001DocumentDef } from './types.js';

// ---------------------------------------------------------------------------
// Helper: 9 mandatory sections every NEW (non-seeded) document must include
// ---------------------------------------------------------------------------
function mandatorySections(purposeHint: string) {
  return [
    {
      sectionType: 'DOCUMENT_OWNER',
      title: 'Document Owner',
      promptHint: 'Specify the named role accountable for this policy',
    },
    {
      sectionType: 'PURPOSE',
      title: 'Purpose',
      promptHint: purposeHint,
    },
    {
      sectionType: 'SCOPE',
      title: 'Scope',
      promptHint:
        'Define entities, functions, assets, third parties this applies to',
    },
    {
      sectionType: 'MANAGEMENT_APPROVAL',
      title: 'Management Approval',
      promptHint: 'State the management body that approves this policy',
    },
    {
      sectionType: 'REVIEW_CADENCE',
      title: 'Review Cadence',
      promptHint:
        'Annual minimum, plus triggered review after major ICT incidents or regulatory changes',
    },
    {
      sectionType: 'RISK_APPETITE_ALIGNMENT',
      title: 'Risk Appetite Alignment',
      promptHint:
        "Link to the organisation's documented ICT risk tolerance",
    },
    {
      sectionType: 'ROLES_AND_RESPONSIBILITIES',
      title: 'Roles and Responsibilities',
      promptHint: 'Who owns execution vs. oversight',
    },
    {
      sectionType: 'EXCEPTIONS_PROCESS',
      title: 'Exceptions Process',
      promptHint: 'How deviations are requested, approved, and tracked',
    },
    {
      sectionType: 'AWARENESS',
      title: 'Awareness',
      promptHint: 'How staff receive and acknowledge the policy',
    },
  ];
}

// ===========================================================================
// EXISTING 12 documents (seeded: true, minimal sections)
// ===========================================================================

const SEEDED_DOCS: Iso27001DocumentDef[] = [
  {
    documentId: 'POL-001',
    title: 'Information Security Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: '5.2',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Overarching IS policy purpose' },
    ],
    controlMappings: [{ controlRef: 'A.5.1', mappingType: 'IMPLEMENTS', coverage: 'FULL' }],
    tags: ['isms', 'core'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
    seeded: true,
  },
  {
    documentId: 'POL-002',
    title: 'Acceptable Use Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: 'A.5.10',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Acceptable use of information assets' },
    ],
    controlMappings: [{ controlRef: 'A.5.10', mappingType: 'IMPLEMENTS', coverage: 'FULL' }],
    tags: ['acceptable-use', 'people'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
    seeded: true,
  },
  {
    documentId: 'POL-003',
    title: 'Access Control Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'SEMI_ANNUAL',
    wave: 1,
    isoClause: 'A.5.15',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Access control principles and rules' },
    ],
    controlMappings: [
      { controlRef: 'A.5.15', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.16', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.17', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.18', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['access-control', 'technology'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
    seeded: true,
  },
  {
    documentId: 'POL-004',
    title: 'Data Classification Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: 'A.5.12',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Classification and labelling of information' },
    ],
    controlMappings: [
      { controlRef: 'A.5.12', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.13', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['data-classification', 'organizational'],
    requiresAcknowledgment: true,
    documentOwner: 'DPO',
    seeded: true,
  },
  {
    documentId: 'POL-005',
    title: 'Third-Party Risk Management Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: 'A.5.19',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Supplier and third-party risk management' },
    ],
    controlMappings: [
      { controlRef: 'A.5.19', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.20', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.21', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.5.22', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.5.23', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['supplier', 'third-party'],
    requiresAcknowledgment: false,
    documentOwner: 'CISO',
    seeded: true,
  },
  {
    documentId: 'POL-006',
    title: 'AI & ML Governance Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Governance of AI and ML systems' },
    ],
    controlMappings: [],
    tags: ['ai', 'governance'],
    requiresAcknowledgment: true,
    documentOwner: 'CTO',
    seeded: true,
  },
  {
    documentId: 'POL-007',
    title: 'DORA ICT Risk Management Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'DORA ICT risk management framework' },
    ],
    controlMappings: [],
    tags: ['dora', 'regulatory'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
    seeded: true,
  },
  {
    documentId: 'POL-008',
    title: 'NIS2 Compliance Procedure',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'NIS2 directive compliance' },
    ],
    controlMappings: [],
    tags: ['nis2', 'regulatory'],
    requiresAcknowledgment: true,
    documentOwner: 'Compliance Officer',
    seeded: true,
  },
  {
    documentId: 'STD-001',
    title: 'Incident Response Procedure',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'SEMI_ANNUAL',
    wave: 1,
    isoClause: 'A.5.24',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Incident response lifecycle' },
    ],
    controlMappings: [
      { controlRef: 'A.5.24', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.25', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.26', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.27', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.28', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['incident-response', 'operations'],
    requiresAcknowledgment: true,
    documentOwner: 'Security Lead',
    seeded: true,
  },
  {
    documentId: 'STD-002',
    title: 'Business Continuity Plan',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: 'A.5.29',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Business continuity and ICT readiness' },
    ],
    controlMappings: [
      { controlRef: 'A.5.29', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.30', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['bcp', 'resilience'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
    seeded: true,
  },
  {
    documentId: 'STD-003',
    title: 'Cryptographic Controls Standard',
    documentType: 'STANDARD',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: 'A.8.24',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Cryptographic controls and key management' },
    ],
    controlMappings: [{ controlRef: 'A.8.24', mappingType: 'IMPLEMENTS', coverage: 'FULL' }],
    tags: ['cryptography', 'technology'],
    requiresAcknowledgment: false,
    documentOwner: 'Security Lead',
    seeded: true,
  },
  {
    documentId: 'STD-004',
    title: 'Change Management Procedure',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: 'A.8.32',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Change management process' },
    ],
    controlMappings: [{ controlRef: 'A.8.32', mappingType: 'IMPLEMENTS', coverage: 'FULL' }],
    tags: ['change-management', 'operations'],
    requiresAcknowledgment: false,
    documentOwner: 'CTO',
    seeded: true,
  },
];

// ===========================================================================
// WAVE 1 — Mandatory ISMS clause procedures (5 new documents)
// ===========================================================================

const WAVE1_DOCS: Iso27001DocumentDef[] = [
  {
    documentId: 'POL-009',
    title: 'Risk Management Methodology',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: '6.1.2/8.2',
    sections: [
      ...mandatorySections(
        'Define the methodology for identifying, analysing, evaluating and treating information security risks in accordance with ISO 27001 clauses 6.1.2 and 8.2',
      ),
      {
        sectionType: 'RISK_CRITERIA',
        title: 'Risk Criteria',
        promptHint:
          'Define risk acceptance criteria, likelihood and impact scales (e.g. 5x5 matrix), qualitative and quantitative thresholds, and how residual risk is compared against appetite',
        isoReference: '6.1.2 a)',
      },
      {
        sectionType: 'RISK_ASSESSMENT_PROCESS',
        title: 'Risk Assessment Process',
        promptHint:
          'Detail asset-based or threat-based risk identification, analysis of consequences and likelihood, risk evaluation and prioritisation steps',
        isoReference: '6.1.2 c)-e)',
      },
      {
        sectionType: 'RISK_TREATMENT',
        title: 'Risk Treatment',
        promptHint:
          'Describe risk treatment options (avoid, transfer, mitigate, accept), control selection linked to Annex A, Statement of Applicability production, and risk treatment plan format',
        isoReference: '6.1.3',
      },
      {
        sectionType: 'RISK_MONITORING',
        title: 'Risk Monitoring and Review',
        promptHint:
          'How risks are monitored over time, triggers for reassessment, and integration with management review (clause 9.3)',
      },
    ],
    controlMappings: [],
    riskMappings: [
      { riskRef: 'RISK-METHODOLOGY', mappingType: 'ADDRESSES' },
    ],
    tags: ['risk-management', 'isms-core', 'clause-6'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
  },
  {
    documentId: 'POL-010',
    title: 'Document & Record Control Procedure',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: '7.5',
    sections: [
      ...mandatorySections(
        'Establish controls for creating, updating, distributing and retaining documented information required by the ISMS per ISO 27001 clause 7.5',
      ),
      {
        sectionType: 'DOCUMENT_CREATION',
        title: 'Document Creation and Updating',
        promptHint:
          'Identification, description, format, media, review and approval process for new and updated documents',
        isoReference: '7.5.2',
      },
      {
        sectionType: 'DOCUMENT_CONTROL',
        title: 'Control of Documented Information',
        promptHint:
          'Distribution, access, retrieval, storage, preservation, version control, retention and disposition of documents and records',
        isoReference: '7.5.3',
      },
      {
        sectionType: 'NAMING_CONVENTION',
        title: 'Naming and Numbering Convention',
        promptHint:
          'Document ID scheme, version numbering, classification marking, and metadata requirements',
      },
      {
        sectionType: 'EXTERNAL_DOCUMENTS',
        title: 'External Document Control',
        promptHint:
          'How externally-originated documents (standards, regulations, supplier contracts) are identified, controlled and kept current',
      },
    ],
    controlMappings: [],
    tags: ['document-control', 'isms-core', 'clause-7'],
    requiresAcknowledgment: false,
    documentOwner: 'ISMS Manager',
  },
  {
    documentId: 'POL-011',
    title: 'Internal Audit Programme',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: '9.2',
    sections: [
      ...mandatorySections(
        'Define the programme for conducting internal audits of the ISMS to verify conformity with ISO 27001 requirements and the organisation\'s own ISMS requirements per clause 9.2',
      ),
      {
        sectionType: 'AUDIT_PLANNING',
        title: 'Audit Planning',
        promptHint:
          'Annual audit schedule, frequency determination based on process importance and previous audit results, scope definition for each audit',
        isoReference: '9.2.2',
      },
      {
        sectionType: 'AUDITOR_COMPETENCE',
        title: 'Auditor Competence and Independence',
        promptHint:
          'Selection criteria for internal auditors, objectivity and impartiality requirements, training and qualification records',
        isoReference: '9.2.2 b)',
      },
      {
        sectionType: 'AUDIT_EXECUTION',
        title: 'Audit Execution',
        promptHint:
          'Audit methodology (interviews, observation, document review), evidence collection, finding classification (major/minor nonconformity, observation, OFI)',
      },
      {
        sectionType: 'AUDIT_REPORTING',
        title: 'Audit Reporting and Follow-up',
        promptHint:
          'Audit report format, communication to relevant management, corrective action tracking, verification of closure',
        isoReference: '9.2.2 c)',
      },
    ],
    controlMappings: [],
    tags: ['internal-audit', 'isms-core', 'clause-9'],
    requiresAcknowledgment: false,
    documentOwner: 'ISMS Manager',
  },
  {
    documentId: 'POL-012',
    title: 'Management Review Procedure',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'BOARD',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: '9.3',
    sections: [
      ...mandatorySections(
        'Define the process for top management review of the ISMS to ensure continuing suitability, adequacy and effectiveness per ISO 27001 clause 9.3',
      ),
      {
        sectionType: 'REVIEW_INPUTS',
        title: 'Management Review Inputs',
        promptHint:
          'Status of previous actions, changes in external/internal issues, changes in interested-party needs, IS performance trends (nonconformities, monitoring results, audit results, objectives), interested-party feedback, risk assessment results, continual improvement opportunities',
        isoReference: '9.3.2',
      },
      {
        sectionType: 'REVIEW_OUTPUTS',
        title: 'Management Review Outputs',
        promptHint:
          'Decisions on continual improvement opportunities, needs for ISMS changes, resource allocation, and documented evidence of results',
        isoReference: '9.3.3',
      },
      {
        sectionType: 'REVIEW_FREQUENCY',
        title: 'Review Frequency and Scheduling',
        promptHint:
          'Minimum annual review, triggered reviews after significant incidents or changes, attendee list, agenda template',
      },
    ],
    controlMappings: [],
    tags: ['management-review', 'isms-core', 'clause-9'],
    requiresAcknowledgment: false,
    documentOwner: 'CISO',
  },
  {
    documentId: 'POL-013',
    title: 'Competence & Awareness Programme',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'ANNUAL',
    wave: 1,
    isoClause: '7.2/7.3',
    sections: [
      ...mandatorySections(
        'Establish the programme for ensuring personnel competence and information security awareness in accordance with ISO 27001 clauses 7.2 and 7.3',
      ),
      {
        sectionType: 'COMPETENCE_REQUIREMENTS',
        title: 'Competence Requirements',
        promptHint:
          'How competence needs are determined for roles affecting IS performance, evidence of education/training/experience, competence evaluation methods',
        isoReference: '7.2',
      },
      {
        sectionType: 'TRAINING_PROGRAMME',
        title: 'Training Programme',
        promptHint:
          'Annual training plan, role-based training matrix, induction training, specialist training (e.g. secure coding, incident handling), training delivery methods and providers',
      },
      {
        sectionType: 'AWARENESS_PROGRAMME',
        title: 'Awareness Programme',
        promptHint:
          'Awareness of IS policy, contribution to ISMS effectiveness, implications of non-conformance, phishing simulations, awareness metrics',
        isoReference: '7.3',
      },
      {
        sectionType: 'EFFECTIVENESS_EVALUATION',
        title: 'Effectiveness Evaluation',
        promptHint:
          'How effectiveness of training and awareness actions is evaluated, KPIs, feedback mechanisms, records retention',
      },
    ],
    controlMappings: [
      { controlRef: 'A.6.3', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['competence', 'awareness', 'isms-core', 'clause-7'],
    requiresAcknowledgment: true,
    documentOwner: 'HR Director',
  },
];

// ===========================================================================
// WAVE 2 — Annex A policies (8 new documents)
// ===========================================================================

const WAVE2_DOCS: Iso27001DocumentDef[] = [
  {
    documentId: 'POL-014',
    title: 'Personnel Security Policy',
    documentType: 'POLICY',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.6.1-A.6.6',
    sections: [
      ...mandatorySections(
        'Establish personnel security controls covering the full employment lifecycle — screening, terms of employment, awareness, disciplinary process, termination responsibilities, and confidentiality agreements per Annex A controls 6.1 through 6.6',
      ),
      {
        sectionType: 'PRE_EMPLOYMENT',
        title: 'Pre-Employment Screening',
        promptHint:
          'Background verification checks, references, qualifications, identity verification, criminal record checks proportionate to role sensitivity',
        isoReference: 'A.6.1',
      },
      {
        sectionType: 'EMPLOYMENT_TERMS',
        title: 'Terms and Conditions of Employment',
        promptHint:
          'IS responsibilities in employment contracts, acceptable use obligations, legal responsibilities, confidentiality clauses',
        isoReference: 'A.6.2',
      },
      {
        sectionType: 'DISCIPLINARY_PROCESS',
        title: 'Disciplinary Process',
        promptHint:
          'Formal disciplinary process for IS violations, graduated sanctions, investigation procedures, appeals mechanism',
        isoReference: 'A.6.4',
      },
      {
        sectionType: 'TERMINATION',
        title: 'Termination and Change of Employment',
        promptHint:
          'IS responsibilities that remain valid after termination, asset return, access revocation timelines, knowledge transfer',
        isoReference: 'A.6.5',
      },
      {
        sectionType: 'CONFIDENTIALITY_AGREEMENTS',
        title: 'Confidentiality and Non-Disclosure Agreements',
        promptHint:
          'NDA requirements for employees, contractors, and third parties; review frequency; legally enforceable terms',
        isoReference: 'A.6.6',
      },
    ],
    controlMappings: [
      { controlRef: 'A.6.1', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.6.2', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.6.3', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.6.4', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.6.5', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.6.6', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['personnel', 'people-controls', 'hr'],
    requiresAcknowledgment: true,
    documentOwner: 'HR Director',
  },
  {
    documentId: 'POL-015',
    title: 'Physical & Environmental Security Policy',
    documentType: 'POLICY',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.7.1-A.7.14',
    sections: [
      ...mandatorySections(
        'Define physical and environmental security controls to prevent unauthorised physical access, damage, and interference to the organisation\'s information and information processing facilities per Annex A controls 7.1 through 7.14',
      ),
      {
        sectionType: 'SECURITY_PERIMETERS',
        title: 'Physical Security Perimeters',
        promptHint:
          'Defining secure areas, perimeter boundaries, entry controls, physical barriers, reception areas',
        isoReference: 'A.7.1',
      },
      {
        sectionType: 'ENTRY_CONTROLS',
        title: 'Physical Entry Controls',
        promptHint:
          'Access control mechanisms (cards, biometrics), visitor management, delivery/loading area controls, access logs',
        isoReference: 'A.7.2',
      },
      {
        sectionType: 'ENVIRONMENTAL_THREATS',
        title: 'Environmental Threat Protection',
        promptHint:
          'Protection against fire, flood, earthquake, explosion, power failure, HVAC requirements, environmental monitoring',
        isoReference: 'A.7.5',
      },
      {
        sectionType: 'EQUIPMENT_SECURITY',
        title: 'Equipment Security',
        promptHint:
          'Equipment siting and protection, supporting utilities, cabling security, equipment maintenance, off-premises security, secure disposal',
        isoReference: 'A.7.8-A.7.14',
      },
      {
        sectionType: 'MONITORING',
        title: 'Physical Security Monitoring',
        promptHint:
          'CCTV, intrusion detection, alarm systems, guard services, monitoring of secure areas',
        isoReference: 'A.7.4',
      },
    ],
    controlMappings: [
      { controlRef: 'A.7.1', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.7.2', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.7.3', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.4', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.7.5', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.6', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.7', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.8', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.9', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.10', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.11', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.12', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.13', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.7.14', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['physical-security', 'environmental', 'facilities'],
    requiresAcknowledgment: true,
    documentOwner: 'Facilities Manager',
  },
  {
    documentId: 'POL-016',
    title: 'Asset Management Policy',
    documentType: 'POLICY',
    classification: 'INTERNAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.5.9-A.5.14',
    sections: [
      ...mandatorySections(
        'Define the framework for identifying, classifying, labelling, and managing information assets and associated assets throughout their lifecycle per Annex A controls 5.9 through 5.14',
      ),
      {
        sectionType: 'ASSET_INVENTORY',
        title: 'Asset Inventory',
        promptHint:
          'Inventory of information and other associated assets, ownership assignment, acceptable use linkage',
        isoReference: 'A.5.9',
      },
      {
        sectionType: 'ASSET_CLASSIFICATION',
        title: 'Asset Classification and Labelling',
        promptHint:
          'Classification scheme aligned with data classification policy (POL-004), labelling procedures, handling rules per classification level',
        isoReference: 'A.5.12/A.5.13',
      },
      {
        sectionType: 'ASSET_LIFECYCLE',
        title: 'Asset Lifecycle Management',
        promptHint:
          'Acquisition, registration, use, return, transfer, and disposal of assets; return of assets procedures',
        isoReference: 'A.5.11',
      },
      {
        sectionType: 'INFORMATION_TRANSFER',
        title: 'Information Transfer Controls',
        promptHint:
          'Rules, agreements and procedures for transferring information to and from external parties, covering all transport types',
        isoReference: 'A.5.14',
      },
    ],
    controlMappings: [
      { controlRef: 'A.5.9', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.10', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.11', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.5.12', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.13', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.14', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['asset-management', 'organizational'],
    requiresAcknowledgment: true,
    parentDocumentId: 'POL-004',
    documentOwner: 'CISO',
  },
  {
    documentId: 'POL-017',
    title: 'Communications Security Policy',
    documentType: 'POLICY',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.5.14/A.8.20-A.8.22',
    sections: [
      ...mandatorySections(
        'Define controls to protect information in networks and supporting information processing facilities, covering network security, network services, and network segregation per Annex A controls 5.14, 8.20 through 8.22',
      ),
      {
        sectionType: 'NETWORK_SECURITY',
        title: 'Network Security Management',
        promptHint:
          'Network security controls, segmentation strategy, firewall rules, IDS/IPS, wireless security, remote access VPN requirements',
        isoReference: 'A.8.20',
      },
      {
        sectionType: 'NETWORK_SERVICES',
        title: 'Security of Network Services',
        promptHint:
          'SLA security requirements for network services (managed, outsourced), service level agreements, authentication mechanisms',
        isoReference: 'A.8.21',
      },
      {
        sectionType: 'NETWORK_SEGREGATION',
        title: 'Segregation of Networks',
        promptHint:
          'Network segmentation by trust zones, VLAN strategy, DMZ design, micro-segmentation for critical assets',
        isoReference: 'A.8.22',
      },
      {
        sectionType: 'TRANSFER_POLICIES',
        title: 'Information Transfer Policies',
        promptHint:
          'Formal transfer policies and procedures, email security, file transfer controls, electronic messaging security, secure data exchange agreements',
        isoReference: 'A.5.14',
      },
    ],
    controlMappings: [
      { controlRef: 'A.5.14', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.20', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.21', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.22', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['network-security', 'communications', 'technology'],
    requiresAcknowledgment: false,
    documentOwner: 'Security Lead',
  },
  {
    documentId: 'POL-018',
    title: 'Secure Development Lifecycle Policy',
    documentType: 'POLICY',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.8.25-A.8.34',
    sections: [
      ...mandatorySections(
        'Define secure software development lifecycle (SDLC) requirements covering secure design, coding, testing, deployment, and maintenance of applications and systems per Annex A controls 8.25 through 8.34',
      ),
      {
        sectionType: 'SECURE_DESIGN',
        title: 'Secure Design Principles',
        promptHint:
          'Secure architecture and engineering principles, threat modelling, security requirements specification, privacy by design',
        isoReference: 'A.8.27',
      },
      {
        sectionType: 'SECURE_CODING',
        title: 'Secure Coding Standards',
        promptHint:
          'Coding standards, OWASP guidelines, code review requirements, static/dynamic analysis tools, dependency management',
        isoReference: 'A.8.28',
      },
      {
        sectionType: 'SECURITY_TESTING',
        title: 'Security Testing',
        promptHint:
          'Penetration testing, vulnerability scanning, SAST/DAST, acceptance testing criteria, test data management',
        isoReference: 'A.8.29/A.8.33',
      },
      {
        sectionType: 'ENVIRONMENT_SEPARATION',
        title: 'Environment Separation',
        promptHint:
          'Separation of development, test, and production environments; access controls between environments; data sanitisation for test environments',
        isoReference: 'A.8.31',
      },
      {
        sectionType: 'OUTSOURCED_DEVELOPMENT',
        title: 'Outsourced Development',
        promptHint:
          'Security requirements for outsourced development, code escrow, intellectual property, acceptance criteria, supply chain risk',
        isoReference: 'A.8.30',
      },
    ],
    controlMappings: [
      { controlRef: 'A.8.25', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.26', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.27', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.8.28', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.29', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.8.30', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.8.31', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.32', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.8.33', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.34', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['secure-development', 'sdlc', 'technology'],
    requiresAcknowledgment: true,
    documentOwner: 'CTO',
  },
  {
    documentId: 'POL-019',
    title: 'Information Transfer Policy',
    documentType: 'POLICY',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.5.14',
    sections: [
      ...mandatorySections(
        'Define rules, protocols, and procedures governing the transfer of information within the organisation and with external parties per Annex A control 5.14',
      ),
      {
        sectionType: 'TRANSFER_RULES',
        title: 'Transfer Rules and Procedures',
        promptHint:
          'Formal transfer policies covering electronic transfer, physical media, verbal communication; classification-based transfer rules',
        isoReference: 'A.5.14',
      },
      {
        sectionType: 'TRANSFER_AGREEMENTS',
        title: 'Information Transfer Agreements',
        promptHint:
          'Transfer agreements with external parties, terms and conditions, responsibilities, encryption requirements, non-repudiation',
      },
      {
        sectionType: 'ELECTRONIC_MESSAGING',
        title: 'Electronic Messaging Security',
        promptHint:
          'Email encryption, secure messaging platforms, data loss prevention for messaging, retention policies',
      },
      {
        sectionType: 'PHYSICAL_MEDIA_TRANSFER',
        title: 'Physical Media Transfer',
        promptHint:
          'Courier requirements, tracking, tamper-evident packaging, encryption of media in transit, authorised recipient verification',
      },
    ],
    controlMappings: [
      { controlRef: 'A.5.14', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['information-transfer', 'data-protection', 'organizational'],
    requiresAcknowledgment: true,
    documentOwner: 'CISO',
  },
  {
    documentId: 'POL-020',
    title: 'Logging, Monitoring & Alerting Policy',
    documentType: 'POLICY',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'SEMI_ANNUAL',
    wave: 2,
    isoClause: 'A.8.15-A.8.17',
    sections: [
      ...mandatorySections(
        'Define requirements for logging security events, monitoring systems and networks, and synchronising clocks across information processing facilities per Annex A controls 8.15 through 8.17',
      ),
      {
        sectionType: 'LOGGING_REQUIREMENTS',
        title: 'Logging Requirements',
        promptHint:
          'What events to log (authentication, access, changes, failures), log content requirements, log protection against tampering, log retention periods',
        isoReference: 'A.8.15',
      },
      {
        sectionType: 'MONITORING_ACTIVITIES',
        title: 'Monitoring Activities',
        promptHint:
          'Network and system monitoring, anomaly detection, SIEM requirements, monitoring scope and frequency, alert thresholds',
        isoReference: 'A.8.16',
      },
      {
        sectionType: 'CLOCK_SYNCHRONIZATION',
        title: 'Clock Synchronisation',
        promptHint:
          'NTP configuration, authoritative time sources, clock drift tolerances, synchronisation monitoring',
        isoReference: 'A.8.17',
      },
      {
        sectionType: 'ALERTING',
        title: 'Alerting and Escalation',
        promptHint:
          'Alert classification and prioritisation, escalation procedures, on-call rotations, integration with incident response (STD-001)',
      },
      {
        sectionType: 'LOG_REVIEW',
        title: 'Log Review and Analysis',
        promptHint:
          'Regular log review schedule, automated analysis rules, investigation procedures for anomalies, reporting to management',
      },
    ],
    controlMappings: [
      { controlRef: 'A.8.15', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.16', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.17', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['logging', 'monitoring', 'siem', 'technology'],
    requiresAcknowledgment: false,
    documentOwner: 'Security Lead',
  },
  {
    documentId: 'POL-021',
    title: 'Compliance Management Procedure',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'ANNUAL',
    wave: 2,
    isoClause: 'A.5.31-A.5.36',
    sections: [
      ...mandatorySections(
        'Establish the procedure for identifying, tracking, and ensuring compliance with legal, statutory, regulatory, and contractual requirements related to information security per Annex A controls 5.31 through 5.36',
      ),
      {
        sectionType: 'LEGAL_REQUIREMENTS',
        title: 'Legal and Regulatory Requirements',
        promptHint:
          'Identification and documentation of applicable legislation, regulations, and contractual obligations; obligation register maintenance',
        isoReference: 'A.5.31',
      },
      {
        sectionType: 'INTELLECTUAL_PROPERTY',
        title: 'Intellectual Property Rights',
        promptHint:
          'Software licensing compliance, copyright protection, proprietary information handling, open-source licence management',
        isoReference: 'A.5.32',
      },
      {
        sectionType: 'RECORDS_PROTECTION',
        title: 'Protection of Records',
        promptHint:
          'Records retention requirements, protection from loss/destruction/falsification, privacy and personal data records',
        isoReference: 'A.5.33/A.5.34',
      },
      {
        sectionType: 'INDEPENDENT_REVIEW',
        title: 'Independent Review of Information Security',
        promptHint:
          'Periodic independent reviews of ISMS, external audit engagement, management of review findings',
        isoReference: 'A.5.35',
      },
      {
        sectionType: 'COMPLIANCE_CHECKING',
        title: 'Compliance Checking',
        promptHint:
          'Regular compliance reviews of policies, standards and procedures; technical compliance checking; remediation tracking',
        isoReference: 'A.5.36',
      },
    ],
    controlMappings: [
      { controlRef: 'A.5.31', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.32', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.5.33', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.34', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.5.35', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.36', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['compliance', 'legal', 'regulatory', 'organizational'],
    requiresAcknowledgment: false,
    documentOwner: 'Compliance Officer',
  },
];

// ===========================================================================
// WAVE 3 — Operational procedures (5 new documents)
// ===========================================================================

const WAVE3_DOCS: Iso27001DocumentDef[] = [
  {
    documentId: 'STD-005',
    title: 'Backup & Recovery Procedure',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'SEMI_ANNUAL',
    wave: 3,
    isoClause: 'A.8.13-A.8.14',
    sections: [
      ...mandatorySections(
        'Define backup and recovery procedures to ensure the availability and integrity of information and information processing facilities per Annex A controls 8.13 and 8.14',
      ),
      {
        sectionType: 'BACKUP_POLICY',
        title: 'Backup Policy and Schedule',
        promptHint:
          'Backup types (full, incremental, differential), frequency, retention periods, scope of systems covered, RPO/RTO targets per system classification',
        isoReference: 'A.8.13',
      },
      {
        sectionType: 'BACKUP_SECURITY',
        title: 'Backup Security',
        promptHint:
          'Encryption of backups, offsite/offline storage, access controls to backup media, immutable backup requirements',
      },
      {
        sectionType: 'RECOVERY_PROCEDURES',
        title: 'Recovery Procedures',
        promptHint:
          'Restore procedures, recovery testing schedule (minimum quarterly), recovery validation, escalation if RTO exceeded',
      },
      {
        sectionType: 'REDUNDANCY',
        title: 'Redundancy of Processing Facilities',
        promptHint:
          'High availability architecture, failover mechanisms, geographic redundancy, redundancy testing',
        isoReference: 'A.8.14',
      },
    ],
    controlMappings: [
      { controlRef: 'A.8.13', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.14', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['backup', 'recovery', 'availability', 'operations'],
    requiresAcknowledgment: false,
    documentOwner: 'Security Lead',
  },
  {
    documentId: 'STD-006',
    title: 'Vulnerability & Patch Management Procedure',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'SENIOR_MANAGEMENT',
    reviewFrequency: 'QUARTERLY',
    wave: 3,
    isoClause: 'A.8.8-A.8.10',
    sections: [
      ...mandatorySections(
        'Define the process for identifying, assessing, and remediating technical vulnerabilities and managing system configurations per Annex A controls 8.8 through 8.10',
      ),
      {
        sectionType: 'VULNERABILITY_IDENTIFICATION',
        title: 'Vulnerability Identification',
        promptHint:
          'Vulnerability scanning tools and frequency, threat intelligence feeds, vendor advisories, CVE monitoring, scope of scanned assets',
        isoReference: 'A.8.8',
      },
      {
        sectionType: 'VULNERABILITY_ASSESSMENT',
        title: 'Vulnerability Assessment and Prioritisation',
        promptHint:
          'CVSS scoring, risk-based prioritisation, exploitability assessment, business context weighting, SLA for remediation by severity',
      },
      {
        sectionType: 'PATCH_MANAGEMENT',
        title: 'Patch Management',
        promptHint:
          'Patch testing procedures, deployment windows, emergency patching process, rollback procedures, patch compliance reporting',
      },
      {
        sectionType: 'CONFIGURATION_MANAGEMENT',
        title: 'Configuration Management',
        promptHint:
          'Secure baseline configurations, hardening standards (CIS benchmarks), configuration drift detection, configuration change control',
        isoReference: 'A.8.9',
      },
      {
        sectionType: 'INFORMATION_DELETION',
        title: 'Information Deletion',
        promptHint:
          'Secure deletion methods, data sanitisation standards (e.g. NIST 800-88), verification of deletion, deletion records',
        isoReference: 'A.8.10',
      },
    ],
    controlMappings: [
      { controlRef: 'A.8.8', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.9', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.8.10', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['vulnerability-management', 'patching', 'configuration', 'operations'],
    requiresAcknowledgment: false,
    documentOwner: 'Security Lead',
  },
  {
    documentId: 'STD-007',
    title: 'Media Handling & Disposal Procedure',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'MANAGEMENT',
    reviewFrequency: 'ANNUAL',
    wave: 3,
    isoClause: 'A.7.10/A.7.14',
    sections: [
      ...mandatorySections(
        'Define procedures for the secure handling, transport, storage, and disposal of storage media and equipment per Annex A controls 7.10 and 7.14',
      ),
      {
        sectionType: 'MEDIA_HANDLING',
        title: 'Media Handling',
        promptHint:
          'Classification-based handling rules for removable media, labelling requirements, authorised media types, encryption requirements for portable media',
        isoReference: 'A.7.10',
      },
      {
        sectionType: 'MEDIA_TRANSPORT',
        title: 'Media Transport',
        promptHint:
          'Authorised courier services, tracking mechanisms, tamper-evident packaging, encryption in transit, chain of custody records',
      },
      {
        sectionType: 'MEDIA_DISPOSAL',
        title: 'Secure Disposal',
        promptHint:
          'Destruction methods by media type (degaussing, shredding, incineration), certified disposal vendors, certificates of destruction, disposal records',
        isoReference: 'A.7.14',
      },
      {
        sectionType: 'EQUIPMENT_REUSE',
        title: 'Equipment Re-use',
        promptHint:
          'Data sanitisation before re-use or disposal, verification procedures, re-use approval process',
      },
    ],
    controlMappings: [
      { controlRef: 'A.7.10', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.7.14', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['media-handling', 'disposal', 'physical-controls'],
    requiresAcknowledgment: false,
    documentOwner: 'Facilities Manager',
  },
  {
    documentId: 'STD-008',
    title: 'Capacity Management Procedure',
    documentType: 'PROCEDURE',
    classification: 'INTERNAL',
    approvalLevel: 'MANAGEMENT',
    reviewFrequency: 'QUARTERLY',
    wave: 3,
    isoClause: 'A.8.6',
    sections: [
      ...mandatorySections(
        'Define the process for monitoring, planning, and managing the capacity of information processing facilities to ensure required system performance per Annex A control 8.6',
      ),
      {
        sectionType: 'CAPACITY_MONITORING',
        title: 'Capacity Monitoring',
        promptHint:
          'Key capacity metrics (CPU, memory, storage, network bandwidth), monitoring tools and dashboards, alerting thresholds, baseline establishment',
        isoReference: 'A.8.6',
      },
      {
        sectionType: 'CAPACITY_PLANNING',
        title: 'Capacity Planning',
        promptHint:
          'Demand forecasting, growth projections, seasonal variation analysis, capacity planning cycle (quarterly), budget linkage',
      },
      {
        sectionType: 'CAPACITY_MANAGEMENT',
        title: 'Capacity Management Actions',
        promptHint:
          'Scaling procedures (horizontal/vertical), resource optimisation, load balancing, capacity-related change requests, cloud auto-scaling policies',
      },
    ],
    controlMappings: [
      { controlRef: 'A.8.6', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    ],
    tags: ['capacity', 'performance', 'infrastructure', 'operations'],
    requiresAcknowledgment: false,
    documentOwner: 'CTO',
  },
  {
    documentId: 'STD-009',
    title: 'Supplier Security Assessment Procedure',
    documentType: 'PROCEDURE',
    classification: 'CONFIDENTIAL',
    approvalLevel: 'EXECUTIVE',
    reviewFrequency: 'ANNUAL',
    wave: 3,
    isoClause: 'A.5.19-A.5.23',
    sections: [
      ...mandatorySections(
        'Define the procedure for assessing, monitoring, and managing information security risks in supplier relationships, including ICT supply chain and cloud services per Annex A controls 5.19 through 5.23',
      ),
      {
        sectionType: 'SUPPLIER_ASSESSMENT',
        title: 'Supplier Security Assessment',
        promptHint:
          'Due diligence process, security questionnaires, on-site audits, risk rating methodology, minimum security requirements by supplier tier',
        isoReference: 'A.5.19',
      },
      {
        sectionType: 'SUPPLIER_AGREEMENTS',
        title: 'Supplier Security Agreements',
        promptHint:
          'Contractual security clauses, data processing agreements, right-to-audit clauses, incident notification requirements, liability and indemnification',
        isoReference: 'A.5.20',
      },
      {
        sectionType: 'SUPPLY_CHAIN',
        title: 'ICT Supply Chain Security',
        promptHint:
          'Sub-supplier management, software supply chain integrity (SBOM), hardware provenance, supply chain attack mitigations',
        isoReference: 'A.5.21',
      },
      {
        sectionType: 'SUPPLIER_MONITORING',
        title: 'Supplier Monitoring and Review',
        promptHint:
          'Ongoing monitoring frequency, performance metrics, security incident review, change management of supplier services, exit planning',
        isoReference: 'A.5.22',
      },
      {
        sectionType: 'CLOUD_SERVICES',
        title: 'Cloud Services Security',
        promptHint:
          'Cloud-specific security requirements, shared responsibility model documentation, cloud security posture management, multi-cloud considerations',
        isoReference: 'A.5.23',
      },
    ],
    controlMappings: [
      { controlRef: 'A.5.19', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.20', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.21', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
      { controlRef: 'A.5.22', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
      { controlRef: 'A.5.23', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
    ],
    tags: ['supplier', 'third-party', 'cloud', 'supply-chain'],
    requiresAcknowledgment: false,
    parentDocumentId: 'POL-005',
    documentOwner: 'CISO',
  },
];

// ===========================================================================
// Combined Registry
// ===========================================================================

export const ISO27001_REGISTRY: Iso27001DocumentDef[] = [
  ...SEEDED_DOCS,
  ...WAVE1_DOCS,
  ...WAVE2_DOCS,
  ...WAVE3_DOCS,
];

// ===========================================================================
// Helper functions
// ===========================================================================

/**
 * Return all non-seeded documents for a given implementation wave.
 */
export function getDocumentsByWave(wave: 1 | 2 | 3): Iso27001DocumentDef[] {
  return ISO27001_REGISTRY.filter((d) => d.wave === wave && !d.seeded);
}

/**
 * Look up a single document definition by its ID.
 */
export function getDocumentById(
  documentId: string,
): Iso27001DocumentDef | undefined {
  return ISO27001_REGISTRY.find((d) => d.documentId === documentId);
}

/**
 * Return all document IDs in the registry.
 */
export function getAllDocumentIds(): string[] {
  return ISO27001_REGISTRY.map((d) => d.documentId);
}
