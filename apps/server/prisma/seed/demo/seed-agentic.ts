import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

/**
 * Seed agentic AI platform demo data.
 *
 * Creates:
 * - 4 AgentSchedule records (built-in workflows, 1 enabled)
 * - 8 AgentTask records (completed workflows + in-progress tasks)
 * - 2 CouncilSession records with 6 opinions each
 * - 12 McpPendingAction records in various statuses
 */
export async function seedAgentic(
  prisma: PrismaClient,
  ctx: DemoContext,
): Promise<void> {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

  // ============================================================
  // 1. AGENT SCHEDULES (4 built-in workflows)
  // ============================================================

  const schedules = await Promise.all([
    prisma.agentSchedule.create({
      data: {
        organisationId: ctx.orgId,
        name: 'Weekly Risk Review',
        description: 'Automated weekly review: tolerance breaches, KRI trends, overdue treatments, and executive summary.',
        cronExpression: '0 7 * * 1',
        instruction: 'Run the Weekly Risk Review: 1) Check all risks for tolerance breaches. 2) Analyze KRI trends and identify any threshold breaches. 3) Review overdue risk treatment plans. 4) Compile an executive summary suitable for board presentation.',
        targetServers: ['riskready-risks', 'riskready-controls'],
        enabled: true,
        lastRunAt: daysAgo(7),
        nextRunAt: new Date(now.getTime() + 3 * 86400000), // 3 days from now
        createdBy: ctx.users.ciso,
      },
    }),
    prisma.agentSchedule.create({
      data: {
        organisationId: ctx.orgId,
        name: 'Incident Response Flow',
        description: 'Comprehensive incident analysis: impact assessment, control gap identification, risk re-assessment, and treatment proposal.',
        cronExpression: '0 8 * * 1',
        instruction: 'Run the Incident Response Flow workflow: 1) Analyze all recent incidents and their impact. 2) Identify control gaps related to these incidents. 3) Re-assess risk scores for affected risk scenarios. 4) Propose treatment actions for identified gaps.',
        targetServers: ['riskready-incidents', 'riskready-controls', 'riskready-risks'],
        enabled: false,
        createdBy: ctx.users.ciso,
      },
    }),
    prisma.agentSchedule.create({
      data: {
        organisationId: ctx.orgId,
        name: 'Control Assurance Cycle',
        description: 'Assessment status review, gap analysis, and nonconformity tracking.',
        cronExpression: '0 8 * * 3',
        instruction: 'Run the Control Assurance Cycle: 1) Review all control assessments for status and overdue items. 2) Perform a gap analysis for partially or unimplemented controls. 3) Track open nonconformities and corrective action plans.',
        targetServers: ['riskready-controls', 'riskready-audits', 'riskready-risks'],
        enabled: false,
        createdBy: ctx.users.ismsManager,
      },
    }),
    prisma.agentSchedule.create({
      data: {
        organisationId: ctx.orgId,
        name: 'Policy Compliance Check',
        description: 'Policy review status, exception expiry, and evidence coverage analysis.',
        cronExpression: '0 9 1 * *',
        instruction: 'Run the Policy Compliance Check: 1) Identify policies overdue for review. 2) Check for expiring policy exceptions within 30 days. 3) Analyze evidence coverage gaps across controls and policies.',
        targetServers: ['riskready-policies', 'riskready-evidence', 'riskready-controls'],
        enabled: false,
        createdBy: ctx.users.complianceOfficer,
      },
    }),
  ]);

  console.log('    4 agent schedules created');

  // ============================================================
  // 2. AGENT TASKS (completed + in-progress workflow executions)
  // ============================================================

  // Completed weekly risk review (parent + 4 child steps)
  const riskReviewParent = await prisma.agentTask.create({
    data: {
      organisationId: ctx.orgId,
      title: 'Weekly Risk Review — 17 Feb 2026',
      instruction: 'Run the Weekly Risk Review for ClearStream Payments.',
      workflowId: 'weekly-risk-review',
      status: 'COMPLETED',
      trigger: 'SCHEDULED',
      result: '## Weekly Risk Review Summary\n\n**Overall Risk Posture: AMBER**\n\n### Key Findings\n- 2 KRI threshold breaches detected (Third-party reviews overdue, Change failure rate)\n- 1 risk tolerance breach: R-06 DDoS attack residual score exceeds tolerance\n- 3 overdue treatment actions identified\n\n### Recommendations\n1. Escalate third-party risk review backlog to Risk Committee\n2. Schedule emergency CAB for change failure rate remediation\n3. Update DDoS mitigation controls (A.8.20, A.8.22)\n\n*Report generated automatically by Weekly Risk Review workflow.*',
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
      completedAt: daysAgo(7),
    },
  });

  const riskReviewSteps = [
    { title: 'Check tolerance breaches', step: 0, result: 'Found 1 tolerance breach: R-06 (DDoS attack) residual score 16 exceeds tolerance of 12.' },
    { title: 'Analyze KRI trends', step: 1, result: 'KRI-006 (Third-party reviews overdue): RED status, 3 overdue. KRI-008 (Change failure rate): AMBER at 8%, threshold 5%.' },
    { title: 'Review overdue treatments', step: 2, result: '3 overdue treatment actions: TP-003 (WAF deployment), TP-005 (Encryption upgrade), TP-006 (Shadow IT discovery).' },
    { title: 'Compile executive summary', step: 3, result: 'Executive summary compiled with risk heatmap delta, KRI dashboard, and remediation timeline.' },
  ];

  for (const step of riskReviewSteps) {
    await prisma.agentTask.create({
      data: {
        organisationId: ctx.orgId,
        title: step.title,
        instruction: `Step ${step.step + 1} of Weekly Risk Review`,
        workflowId: 'weekly-risk-review',
        parentTaskId: riskReviewParent.id,
        stepIndex: step.step,
        status: 'COMPLETED',
        trigger: 'WORKFLOW_STEP',
        result: step.result,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
        completedAt: daysAgo(7),
      },
    });
  }

  // In-progress incident response (triggered by DDoS incident)
  const incidentFlowParent = await prisma.agentTask.create({
    data: {
      organisationId: ctx.orgId,
      title: 'Incident Response Flow — DDoS Attempt (INC-2026-007)',
      instruction: 'Analyze the ongoing DDoS attempt on payment API and recommend response actions.',
      workflowId: 'incident-response-flow',
      status: 'AWAITING_APPROVAL',
      trigger: 'EVENT',
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(2),
    },
  });

  await prisma.agentTask.create({
    data: {
      organisationId: ctx.orgId,
      title: 'Analyze incident impact',
      instruction: 'Step 1: Assess impact of INC-2026-007 DDoS attempt on payment API.',
      workflowId: 'incident-response-flow',
      parentTaskId: incidentFlowParent.id,
      stepIndex: 0,
      status: 'COMPLETED',
      trigger: 'WORKFLOW_STEP',
      result: 'DDoS attempt peaked at 2.3Gbps targeting payment-api-prod-1. WAF mitigated 94% of traffic. 6% degradation in payment processing latency observed for 23 minutes. No data loss or transaction failures. 3 merchant complaints received.',
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(5),
      completedAt: hoursAgo(5),
    },
  });

  await prisma.agentTask.create({
    data: {
      organisationId: ctx.orgId,
      title: 'Identify control gaps',
      instruction: 'Step 2: Identify control gaps related to INC-2026-007.',
      workflowId: 'incident-response-flow',
      parentTaskId: incidentFlowParent.id,
      stepIndex: 1,
      status: 'COMPLETED',
      trigger: 'WORKFLOW_STEP',
      result: 'Control gaps identified:\n- A.8.20 (Network Security): Rate limiting thresholds need adjustment\n- A.8.22 (Web Filtering): Geo-blocking rules not configured for known botnet origins\n- A.8.16 (Monitoring): Alert threshold for traffic anomalies set too high (triggered 12 min late)',
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(3),
      completedAt: hoursAgo(3),
    },
  });

  await prisma.agentTask.create({
    data: {
      organisationId: ctx.orgId,
      title: 'Propose treatment actions',
      instruction: 'Step 3: Propose treatment actions for identified gaps.',
      workflowId: 'incident-response-flow',
      parentTaskId: incidentFlowParent.id,
      stepIndex: 2,
      status: 'AWAITING_APPROVAL',
      trigger: 'WORKFLOW_STEP',
      result: 'Proposed 3 control updates pending approval:\n1. Update A.8.20 rate limiting configuration\n2. Add geo-blocking rules to A.8.22\n3. Lower monitoring threshold in A.8.16',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(2),
    },
  });

  // User-requested task (completed)
  await prisma.agentTask.create({
    data: {
      organisationId: ctx.orgId,
      title: 'Generate DORA compliance gap analysis',
      instruction: 'Analyze our current DORA compliance posture, identify gaps against the ICT risk management requirements, and recommend prioritized remediation actions.',
      status: 'COMPLETED',
      trigger: 'USER_REQUEST',
      userId: ctx.users.complianceOfficer,
      result: '## DORA Compliance Gap Analysis\n\n**Overall Score: 72%**\n\n### Compliant Areas (18/25 requirements)\n- ICT risk management framework established\n- Incident classification aligned with RTS\n- Third-party risk register maintained\n\n### Gaps Identified (7 requirements)\n1. **Art. 6(5)**: ICT asset classification incomplete — 4 assets missing criticality ratings\n2. **Art. 9(1)**: Detection mechanisms not fully mapped to threat scenarios\n3. **Art. 11(1)**: Business continuity testing not conducted in last 12 months\n4. **Art. 15**: Third-party exit strategies not documented for 2 critical providers\n5. **Art. 19(1)**: Information sharing arrangements not formalized\n6. **Art. 24**: Penetration testing scope does not cover all critical functions\n7. **Art. 28(3)**: Subcontracting chain for AWS not fully mapped\n\n### Remediation Priority\n- **Immediate**: Art. 11(1) BCM testing, Art. 24 pentest scope\n- **Short-term**: Art. 6(5) asset classification, Art. 15 exit strategies\n- **Medium-term**: Art. 9(1) detection mapping, Art. 19(1) info sharing, Art. 28(3) subcontracting',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
      completedAt: daysAgo(3),
    },
  });

  console.log('    10 agent tasks created (2 workflows + 1 standalone)');

  // ============================================================
  // 3. COUNCIL SESSIONS (multi-agent deliberation records)
  // ============================================================

  // Council Session 1: Board-level security posture review
  const session1 = await prisma.councilSession.create({
    data: {
      conversationId: `conv-council-${Date.now()}-1`,
      question: 'What is our overall security posture and readiness for the upcoming ISO 27001 surveillance audit?',
      pattern: 'parallel_then_synthesis',
      participatingAgents: ['risk-analyst', 'controls-auditor', 'compliance-officer', 'incident-commander', 'evidence-auditor', 'ciso-strategist'],
      organisationId: ctx.orgId,
      confidenceLevel: 'high',
      inputTokens: 48200,
      outputTokens: 12800,
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      consensusSummary: '## Security Posture Assessment — Audit Readiness\n\n**Overall Readiness: AMBER (78%)**\n\nThe council unanimously agrees ClearStream Payments has a solid ISMS foundation but identifies 3 critical gaps requiring immediate attention before the surveillance audit:\n\n### Consensus Points\n1. **Control framework is mature** — 28/40 controls fully implemented, 8 partial implementations on track\n2. **Risk management is well-established** — 15 risks documented with active treatment plans\n3. **Incident response is effective** — Mean time to detect improved from 6.1h to 4.2h over 6 months\n\n### Critical Gaps (Council Agreement)\n1. **Evidence currency** — 3 evidence records expiring before audit date, 2 under review\n2. **Change Management Procedure** — STD-004 overdue for review since January, potential audit finding\n3. **Staging database encryption** — NC-002 (MAJOR) still in remediation, auditor will check\n\n### Cross-Domain Correlation\n- The DDoS incident (INC-2026-007) exposed control gaps in A.8.20 and A.8.22 → linked to risk R-06 → treatment plan TP-003 addresses this but is overdue\n- Policy exception for legacy API authentication expires in 15 days → linked to control A.8.5 → evidence EVD-2025-0003 needs renewal\n\n### Recommended Actions (Prioritized)\n1. **Immediate**: Complete NC-002 remediation (staging DB encryption)\n2. **This week**: Renew expiring evidence records, complete STD-004 review\n3. **Before audit**: Close TP-003, update risk scores for R-06, prepare management review minutes',
    },
  });

  // Council opinions for session 1
  const session1Opinions = [
    {
      agentRole: 'risk-analyst',
      confidence: 'high',
      findings: [
        { severity: 'high', title: 'KRI-006 third-party reviews overdue', detail: '3 third-party risk reviews overdue, RED status. Auditor will likely flag this.', evidence: 'KRI-006 dashboard showing RED since 4 weeks' },
        { severity: 'medium', title: 'Risk tolerance breach on R-06', detail: 'DDoS risk residual score (16) exceeds tolerance (12). Treatment plan TP-003 is overdue.', evidence: 'Risk register R-06, Treatment plan TP-003' },
        { severity: 'low', title: 'Risk trend is positive', detail: 'Overall risk posture improved 12% over 6 months. 4 treatment plans completed.', evidence: 'Risk calculation history, trend dashboard' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Complete overdue third-party risk reviews', supporting: 'Addresses KRI-006 RED status and potential audit finding' },
        { priority: 'short_term', action: 'Update risk scores for R-06 after DDoS control improvements', supporting: 'Reduces residual score below tolerance threshold' },
      ],
    },
    {
      agentRole: 'controls-auditor',
      confidence: 'high',
      findings: [
        { severity: 'high', title: 'NC-002 staging DB encryption still open', detail: 'MAJOR nonconformity from last audit — CAP defined but not fully implemented. Auditor will specifically check.', evidence: 'NC-002 audit record, CAP timeline' },
        { severity: 'medium', title: '4 controls not yet started', detail: 'Controls A.7.4 (Physical monitoring), A.8.12 (DLP), A.8.28 (Secure coding), A.8.34 (Cloud security) have NOT_STARTED status.', evidence: 'Control register implementation status' },
        { severity: 'info', title: 'Assessment coverage good', detail: 'Q4-2025 assessment complete (85% pass), Q1-2026 assessment 60% tested.', evidence: 'Assessment records' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Complete NC-002 remediation before audit', supporting: 'MAJOR NC — highest audit risk item' },
        { priority: 'short_term', action: 'Document justification for 4 not-started controls', supporting: 'Auditor may accept planned implementation timeline' },
      ],
    },
    {
      agentRole: 'compliance-officer',
      confidence: 'high',
      findings: [
        { severity: 'high', title: 'Change Management Procedure overdue for review', detail: 'STD-004 review was due January 2026 — now 4+ weeks overdue.', evidence: 'Policy document STD-004, review schedule' },
        { severity: 'medium', title: 'DORA compliance at 72%', detail: '7 DORA requirements have gaps. Art. 11(1) BCM testing is highest risk.', evidence: 'DORA gap analysis report' },
        { severity: 'low', title: 'NIS2 compliance improving', detail: 'NIS2 score improved from 71% to 79% since implementation began.', evidence: 'NIS2 compliance dashboard' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Fast-track STD-004 review and approval', supporting: 'Overdue policy review is a common audit finding' },
        { priority: 'medium_term', action: 'Schedule DORA BCM testing exercise', supporting: 'Addresses highest-priority DORA gap' },
      ],
    },
    {
      agentRole: 'incident-commander',
      confidence: 'medium',
      findings: [
        { severity: 'medium', title: 'Active incidents may concern auditor', detail: 'INC-2026-007 (DDoS) in CONTAINMENT and INC-2026-008 (vendor DPA violation) in DETECTED status. Auditor may ask about response effectiveness.', evidence: 'Incident register, timeline entries' },
        { severity: 'low', title: 'Incident response maturity improved', detail: 'MTTR decreased from 8.1h to 4.2h. Lessons learned documented for 3/5 closed incidents.', evidence: 'Incident metrics dashboard' },
      ],
      recommendations: [
        { priority: 'short_term', action: 'Resolve INC-2026-007 and INC-2026-008 before audit if possible', supporting: 'Demonstrates effective response capability' },
        { priority: 'short_term', action: 'Complete lessons learned for remaining 2 closed incidents', supporting: 'Shows continual improvement commitment' },
      ],
    },
    {
      agentRole: 'evidence-auditor',
      confidence: 'high',
      findings: [
        { severity: 'high', title: '3 evidence records expiring within 30 days', detail: 'EVD-2025-0003 (Penetration test report), EVD-2025-0006 (BCP test results), EVD-2025-0010 (Access review log) expire before likely audit date.', evidence: 'Evidence repository, expiry dashboard' },
        { severity: 'medium', title: '2 evidence records under review', detail: 'EVD-2026-0007 and EVD-2026-0008 still in UNDER_REVIEW status — may not be accepted as current evidence.', evidence: 'Evidence review queue' },
        { severity: 'low', title: 'Evidence coverage is generally good', detail: '14/20 evidence records are APPROVED. All critical controls have linked evidence.', evidence: 'Evidence-control link matrix' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Renew 3 expiring evidence records', supporting: 'Expired evidence = automatic audit finding' },
        { priority: 'short_term', action: 'Complete review of 2 pending evidence records', supporting: 'Strengthens evidence base for audit' },
      ],
    },
    {
      agentRole: 'ciso-strategist',
      confidence: 'high',
      findings: [
        { severity: 'high', title: 'Audit readiness at 78% — 3 blockers identified', detail: 'Cross-domain analysis reveals 3 interconnected issues that could generate audit findings: NC-002 (encryption), STD-004 (policy review), expiring evidence.', evidence: 'Synthesized from all council members' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Launch 2-week audit preparation sprint', supporting: 'Address NC-002, STD-004, and evidence renewals in coordinated effort' },
      ],
    },
  ];

  for (const opinion of session1Opinions) {
    await prisma.councilOpinion.create({
      data: {
        sessionId: session1.id,
        agentRole: opinion.agentRole,
        findings: opinion.findings,
        recommendations: opinion.recommendations,
        confidence: opinion.confidence,
        inputTokens: 6000 + Math.floor(Math.random() * 3000),
        outputTokens: 1500 + Math.floor(Math.random() * 1000),
      },
    });
  }

  // Council Session 2: Incident cross-domain analysis
  const session2 = await prisma.councilSession.create({
    data: {
      conversationId: `conv-council-${Date.now()}-2`,
      question: 'Analyze the DDoS attempt on our payment API — what are the cross-domain implications for our risk posture, control effectiveness, and regulatory compliance?',
      pattern: 'sequential_buildup',
      participatingAgents: ['incident-commander', 'controls-auditor', 'risk-analyst', 'compliance-officer', 'ciso-strategist'],
      organisationId: ctx.orgId,
      confidenceLevel: 'high',
      inputTokens: 35600,
      outputTokens: 9400,
      startedAt: hoursAgo(5),
      completedAt: hoursAgo(4),
      consensusSummary: '## DDoS Incident Cross-Domain Analysis\n\n**Incident: INC-2026-007 — DDoS attempt on payment API**\n\n### Impact Chain\n```\nDDoS Attack (2.3 Gbps) → Payment API degradation (23 min)\n  → 3 merchant complaints\n  → Control gaps in A.8.20, A.8.22, A.8.16\n  → Risk R-06 residual score needs recalculation\n  → DORA Art. 19 notification assessment required\n```\n\n### Council Consensus\n1. **Incident response was effective** — WAF mitigated 94%, no data loss, recovery within SLA\n2. **Three control improvements needed** — rate limiting, geo-blocking, monitoring thresholds\n3. **Risk R-06 score should be recalculated** — Current controls proved partially effective\n4. **DORA notification threshold NOT met** — Below 10% service impact, no notification required\n5. **NIS2 reporting NOT triggered** — Duration under 24h, no cross-border impact\n\n### Recommended Actions\n1. Update control configurations (A.8.20, A.8.22, A.8.16) — proposed via approval queue\n2. Recalculate R-06 residual score with updated control effectiveness\n3. Document lessons learned for INC-2026-007\n4. Schedule tabletop exercise for escalated DDoS scenario',
    },
  });

  const session2Opinions = [
    {
      agentRole: 'incident-commander',
      confidence: 'high',
      findings: [
        { severity: 'medium', title: 'DDoS mitigated but exposed gaps', detail: 'Attack peaked 2.3Gbps. WAF blocked 94%. Payment latency degraded 6% for 23 minutes. Root cause: botnet from Eastern European IP ranges.', evidence: 'INC-2026-007 timeline, WAF logs, network telemetry' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Configure geo-blocking for identified botnet source ranges', supporting: 'Prevents repeat from same origin' },
      ],
    },
    {
      agentRole: 'controls-auditor',
      confidence: 'high',
      findings: [
        { severity: 'medium', title: '3 controls need configuration updates', detail: 'A.8.20 rate limiting too permissive, A.8.22 missing geo-block rules, A.8.16 alert threshold too high (12 min detection delay).', evidence: 'Control assessment results, incident timeline correlation' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Submit control update proposals via approval queue', supporting: 'Closes identified gaps before next attack' },
      ],
    },
    {
      agentRole: 'risk-analyst',
      confidence: 'medium',
      findings: [
        { severity: 'high', title: 'R-06 needs score recalculation', detail: 'Current residual score (16) based on assumed control effectiveness. Actual effectiveness of linked controls was lower than assessed — residual score should be recalculated.', evidence: 'R-06 scenario calculation, incident evidence' },
      ],
      recommendations: [
        { priority: 'short_term', action: 'Recalculate R-06 after control updates implemented', supporting: 'Score should improve once gaps are closed' },
      ],
    },
    {
      agentRole: 'compliance-officer',
      confidence: 'high',
      findings: [
        { severity: 'info', title: 'No regulatory notification required', detail: 'DORA: Service impact <10%, duration <2h — below major incident threshold. NIS2: No cross-border impact, duration <24h — not significant.', evidence: 'DORA Art. 18 criteria, NIS2 Art. 23 thresholds' },
      ],
      recommendations: [
        { priority: 'medium_term', action: 'Document DORA/NIS2 assessment in incident record', supporting: 'Demonstrates regulatory awareness for audit' },
      ],
    },
    {
      agentRole: 'ciso-strategist',
      confidence: 'high',
      findings: [
        { severity: 'medium', title: 'Effective response but improvement needed', detail: 'The incident validates our investment in WAF and DDoS protection but reveals configuration gaps that could be exploited in a larger attack.', evidence: 'Synthesized from all council members' },
      ],
      recommendations: [
        { priority: 'immediate', action: 'Implement 3 control updates and schedule DDoS tabletop exercise', supporting: 'Closes gaps and tests response to escalated scenario' },
      ],
    },
  ];

  for (const opinion of session2Opinions) {
    await prisma.councilOpinion.create({
      data: {
        sessionId: session2.id,
        agentRole: opinion.agentRole,
        findings: opinion.findings,
        recommendations: opinion.recommendations,
        confidence: opinion.confidence,
        inputTokens: 5000 + Math.floor(Math.random() * 2500),
        outputTokens: 1200 + Math.floor(Math.random() * 800),
      },
    });
  }

  console.log('    2 council sessions with 11 opinions created');

  // ============================================================
  // 4. MCP PENDING ACTIONS (AI-proposed changes in approval queue)
  // ============================================================

  // 3 EXECUTED (approved and completed)
  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'UPDATE_CONTROL',
      status: 'EXECUTED',
      summary: 'Update control A.5.1 (Information Security Policies) maturity level from 3 to 4',
      reason: 'Based on Q4-2025 assessment results showing full implementation with documented effectiveness metrics and regular review cycle established.',
      payload: { controlId: ctx.controlIds['5.1'], field: 'maturityLevel', oldValue: 3, newValue: 4 },
      mcpToolName: 'update_control',
      reviewedById: ctx.users.ciso,
      reviewedAt: daysAgo(10),
      reviewNotes: 'Agreed — evidence supports maturity increase.',
      executedAt: daysAgo(10),
      resultData: { success: true },
      organisationId: ctx.orgId,
      createdAt: daysAgo(12),
    },
  });

  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'CREATE_TREATMENT_PLAN',
      status: 'EXECUTED',
      summary: 'Create treatment plan for R-10 (Software Supply Chain Attack): Implement SBOM generation pipeline',
      reason: 'Supply chain risk R-10 has residual score of 12 with no active treatment plan. SBOM generation would improve visibility and reduce likelihood.',
      payload: { riskId: ctx.riskIds['R-10'], title: 'Implement SBOM generation pipeline', description: 'Deploy CycloneDX SBOM generation in CI/CD pipeline for all production artifacts.', owner: ctx.users.securityLead },
      mcpToolName: 'create_treatment_plan',
      reviewedById: ctx.users.ciso,
      reviewedAt: daysAgo(8),
      reviewNotes: 'Good proposal. Assign to Markus for Q1 implementation.',
      executedAt: daysAgo(8),
      resultData: { success: true, treatmentPlanId: 'auto-generated' },
      organisationId: ctx.orgId,
      createdAt: daysAgo(9),
    },
  });

  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'CREATE_EVIDENCE',
      status: 'EXECUTED',
      summary: 'Create evidence record for ISO 27001 management review minutes (Feb 2026)',
      reason: 'Management review was conducted on 14 Feb 2026. Evidence record needed to demonstrate ISMS review commitment for upcoming surveillance audit.',
      payload: { evidenceRef: 'EVD-2026-0011', title: 'ISMS Management Review Minutes — February 2026', type: 'DOCUMENT', classification: 'CONFIDENTIAL' },
      mcpToolName: 'create_evidence',
      reviewedById: ctx.users.ismsManager,
      reviewedAt: daysAgo(5),
      reviewNotes: 'Correct. Uploaded the signed minutes as attachment.',
      executedAt: daysAgo(5),
      resultData: { success: true },
      organisationId: ctx.orgId,
      createdAt: daysAgo(6),
    },
  });

  // 2 APPROVED (awaiting execution)
  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'UPDATE_CONTROL',
      status: 'APPROVED',
      summary: 'Update control A.8.20 (Network Security) — lower rate limiting threshold from 10k to 5k req/min',
      reason: 'DDoS incident INC-2026-007 showed current 10k req/min threshold is too permissive. Reducing to 5k would have blocked the attack 12 minutes earlier.',
      payload: { controlId: ctx.controlIds['8.20'], updates: { operatingEffectiveness: 'PARTIALLY_EFFECTIVE', notes: 'Rate limiting threshold reduced from 10k to 5k req/min per DDoS incident findings' } },
      mcpToolName: 'update_control',
      reviewedById: ctx.users.ciso,
      reviewedAt: hoursAgo(3),
      reviewNotes: 'Approved. Coordinate with engineering for implementation window.',
      organisationId: ctx.orgId,
      createdAt: hoursAgo(4),
    },
  });

  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'UPDATE_CONTROL',
      status: 'APPROVED',
      summary: 'Update control A.8.16 (Monitoring) — reduce anomaly alert threshold from 150% to 120% baseline',
      reason: 'DDoS incident analysis showed 12-minute detection delay due to alert threshold being set at 150% of baseline. Reducing to 120% would catch anomalies faster.',
      payload: { controlId: ctx.controlIds['8.15'], updates: { operatingEffectiveness: 'PARTIALLY_EFFECTIVE', notes: 'Monitoring alert threshold reduced from 150% to 120% baseline' } },
      mcpToolName: 'update_control',
      reviewedById: ctx.users.securityLead,
      reviewedAt: hoursAgo(2),
      reviewNotes: 'Makes sense. Will adjust Datadog alert rules this sprint.',
      organisationId: ctx.orgId,
      createdAt: hoursAgo(4),
    },
  });

  // 4 PENDING (awaiting human review)
  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'UPDATE_CONTROL',
      status: 'PENDING',
      summary: 'Update control A.8.22 (Web Filtering) — add geo-blocking rules for identified botnet source ranges',
      reason: 'DDoS incident INC-2026-007 originated from Eastern European botnet. Adding geo-blocking for non-customer IP ranges would prevent similar attacks.',
      payload: { controlId: ctx.controlIds['8.24'], updates: { notes: 'Geo-blocking rules added for botnet source IP ranges (non-customer regions)' } },
      mcpToolName: 'update_control',
      organisationId: ctx.orgId,
      createdAt: hoursAgo(3),
    },
  });

  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'CREATE_ASSESSMENT',
      status: 'PENDING',
      summary: 'Create targeted assessment for DDoS-related controls (A.8.20, A.8.22, A.8.16)',
      reason: 'Post-incident review identified control configuration gaps. A focused assessment should validate the effectiveness of remediation actions.',
      payload: { title: 'Post-DDoS Incident Control Assessment', scope: 'Controls A.8.20, A.8.22, A.8.16', priority: 'HIGH' },
      mcpToolName: 'create_assessment',
      organisationId: ctx.orgId,
      createdAt: hoursAgo(2),
    },
  });

  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'CREATE_NONCONFORMITY',
      status: 'PENDING',
      summary: 'Raise nonconformity for DDoS monitoring detection delay (12-minute gap)',
      reason: 'Control A.8.16 monitoring threshold was configured too high, resulting in 12-minute detection delay during DDoS attack. This represents a deviation from the expected 5-minute detection SLA.',
      payload: { title: 'Delayed DDoS detection — monitoring threshold misconfiguration', severity: 'MINOR', controlId: ctx.controlIds['8.15'], source: 'Incident Review' },
      mcpToolName: 'create_nonconformity',
      organisationId: ctx.orgId,
      createdAt: hoursAgo(2),
    },
  });

  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'ASSESS_SCENARIO',
      status: 'PENDING',
      summary: 'Recalculate R-06 (DDoS attack) residual risk score after control updates',
      reason: 'DDoS incident demonstrated that current control effectiveness for this scenario is lower than assessed. Linked controls should be recalculated based on actual incident data.',
      payload: { riskId: ctx.riskIds['R-06'], scenarioUpdate: { justification: 'Recalculate based on INC-2026-007 — WAF effective but rate limiting and monitoring thresholds were insufficient' } },
      mcpToolName: 'update_risk_scenario',
      organisationId: ctx.orgId,
      createdAt: hoursAgo(1),
    },
  });

  // 1 REJECTED
  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'ASSESS_SCENARIO',
      status: 'REJECTED',
      summary: 'Increase R-01 (Ransomware) inherent risk score from 20 to 25',
      reason: 'Recent industry reports show 40% increase in ransomware targeting payment processors. Suggested increasing inherent score to maximum.',
      payload: { riskId: ctx.riskIds['R-01'], scenarioUpdate: { inherentScore: 25 } },
      mcpToolName: 'update_risk_scenario',
      reviewedById: ctx.users.riskAnalyst,
      reviewedAt: daysAgo(2),
      reviewNotes: 'Industry trends don\'t warrant maximum score. Our specific threat profile hasn\'t changed — we already have strong backup and segmentation controls. Keep current score.',
      organisationId: ctx.orgId,
      createdAt: daysAgo(3),
    },
  });

  // 1 FAILED
  await prisma.mcpPendingAction.create({
    data: {
      actionType: 'CREATE_EVIDENCE',
      status: 'FAILED',
      summary: 'Create evidence record for vulnerability scan results — January 2026',
      reason: 'Monthly vulnerability scan completed. Evidence record needed for control A.8.8 (Vulnerability Management) compliance tracking.',
      payload: { evidenceRef: 'EVD-2026-0012', title: 'Vulnerability Scan Results — January 2026', type: 'REPORT' },
      mcpToolName: 'create_evidence',
      reviewedById: ctx.users.securityLead,
      reviewedAt: daysAgo(14),
      reviewNotes: 'Approved — please create.',
      executedAt: daysAgo(14),
      errorMessage: 'Evidence reference EVD-2026-0012 already exists. Use update_evidence to modify existing records.',
      organisationId: ctx.orgId,
      createdAt: daysAgo(15),
    },
  });

  console.log('    12 MCP pending actions created (3 executed, 2 approved, 4 pending, 1 rejected, 1 failed)');
}
