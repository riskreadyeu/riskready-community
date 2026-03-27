// gateway/src/workflows/types.ts

export interface WorkflowStep {
  name: string;
  instruction: string;
  /** MCP server tags required for this step */
  requiredServers: string[];
  /** If true, pause for human approval before proceeding to the next step */
  approvalGate: boolean;
  /** Max turns for the agent on this step */
  maxTurns?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  /** Tags for categorization */
  tags: string[];
}

export interface WorkflowExecution {
  workflowId: string;
  parentTaskId: string;
  organisationId: string;
  currentStepIndex: number;
  status: 'running' | 'paused_at_gate' | 'completed' | 'failed';
  stepResults: Array<{
    stepIndex: number;
    taskId: string;
    status: string;
    result?: string;
  }>;
}

/**
 * Built-in workflow definitions shipped with RiskReady.
 */
export const BUILT_IN_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'incident-response-flow',
    name: 'Incident Response Flow',
    description: 'Comprehensive incident analysis: impact assessment, control gap identification, risk re-assessment, and treatment proposal.',
    tags: ['incident', 'risk', 'controls'],
    steps: [
      {
        name: 'Incident Analysis',
        instruction: 'Analyze all open or recent incidents. For each, review the timeline, affected assets, and severity. Summarize the current incident landscape.',
        requiredServers: ['incidents'],
        approvalGate: false,
      },
      {
        name: 'Control Gap Identification',
        instruction: 'Based on the incident analysis, identify which controls failed, were bypassed, or are missing. Check the control implementation status and assessment results for each relevant control.',
        requiredServers: ['controls', 'incidents'],
        approvalGate: false,
      },
      {
        name: 'Risk Re-assessment',
        instruction: 'For each control gap identified, check if there are linked risk scenarios. Re-assess whether the current residual risk scores are accurate given the incidents. Identify any risks that may need tolerance review.',
        requiredServers: ['risks', 'controls'],
        approvalGate: false,
      },
      {
        name: 'Treatment Proposal',
        instruction: 'Based on the control gaps and risk re-assessment, propose specific treatment actions: new controls, control enhancements, risk treatment plan updates, or corrective actions. Each proposal should include rationale and priority.',
        requiredServers: ['risks', 'controls'],
        approvalGate: true,
      },
    ],
  },
  {
    id: 'weekly-risk-review',
    name: 'Weekly Risk Review',
    description: 'Automated weekly review: tolerance breaches, KRI trends, overdue treatments, and executive summary.',
    tags: ['risk', 'kri', 'executive'],
    steps: [
      {
        name: 'Tolerance Breach Check',
        instruction: 'Check all risks for tolerance breaches. List any risks where residual scores exceed defined tolerance thresholds. Include the tolerance status and gap.',
        requiredServers: ['risks'],
        approvalGate: false,
      },
      {
        name: 'KRI Trend Analysis',
        instruction: 'Review all Key Risk Indicators. Identify trends — which KRIs are deteriorating, which are improving? Flag any KRIs that have breached warning or critical thresholds.',
        requiredServers: ['risks'],
        approvalGate: false,
      },
      {
        name: 'Overdue Treatment Review',
        instruction: 'List all risk treatment plans that are overdue or approaching their target date. Summarize their current status and any blockers.',
        requiredServers: ['risks'],
        approvalGate: false,
      },
      {
        name: 'Executive Summary',
        instruction: 'Compile an executive summary from the above analyses. Include: top risks by residual score, tolerance breaches, KRI alerts, overdue treatments, and recommended actions for management attention. Format as a board-ready briefing.',
        requiredServers: ['risks', 'controls', 'incidents'],
        approvalGate: false,
      },
    ],
  },
  {
    id: 'control-assurance-cycle',
    name: 'Control Assurance Cycle',
    description: 'Assessment status review, gap analysis, and nonconformity tracking.',
    tags: ['controls', 'audits', 'assessment'],
    steps: [
      {
        name: 'Assessment Status Review',
        instruction: 'Review all control assessments. Identify which assessments are overdue, in progress, or recently completed. Summarize pass/fail rates and overall assurance posture.',
        requiredServers: ['controls'],
        approvalGate: false,
      },
      {
        name: 'Gap Analysis',
        instruction: 'Run a gap analysis across all applicable controls. Identify controls that are not implemented or only partially implemented. Prioritize gaps by risk linkage.',
        requiredServers: ['controls', 'risks'],
        approvalGate: false,
      },
      {
        name: 'Nonconformity Tracking',
        instruction: 'Review all open nonconformities and their corrective action plans. Identify overdue items, track progress, and flag any that require escalation.',
        requiredServers: ['audits', 'controls'],
        approvalGate: false,
      },
    ],
  },
  {
    id: 'policy-compliance-check',
    name: 'Policy Compliance Check',
    description: 'Policy review status, exception expiry, and evidence coverage analysis.',
    tags: ['policies', 'evidence', 'compliance'],
    steps: [
      {
        name: 'Overdue Policy Reviews',
        instruction: 'List all policies that are overdue for review or approaching their review date. Check policy status and identify any that have not been acknowledged by required personnel.',
        requiredServers: ['policies'],
        approvalGate: false,
      },
      {
        name: 'Exception Expiry Check',
        instruction: 'Review all active policy exceptions. Identify any that have expired or will expire within the next 30 days. Flag exceptions that should be re-evaluated.',
        requiredServers: ['policies'],
        approvalGate: false,
      },
      {
        name: 'Evidence Coverage Analysis',
        instruction: 'Analyze evidence coverage across controls and policies. Identify areas with insufficient or stale evidence. Check for outstanding evidence requests.',
        requiredServers: ['evidence', 'controls', 'policies'],
        approvalGate: false,
      },
    ],
  },
];

/**
 * Look up a built-in workflow definition by its ID.
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return BUILT_IN_WORKFLOWS.find((w) => w.id === id);
}
