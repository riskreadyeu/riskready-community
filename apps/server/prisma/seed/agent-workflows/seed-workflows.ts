import { PrismaClient } from '@prisma/client';

const BUILT_IN_SCHEDULES = [
  {
    name: 'Incident Response Flow',
    description: 'Comprehensive incident analysis: impact assessment, control gap identification, risk re-assessment, and treatment proposal.',
    cronExpression: '0 8 * * 1', // Monday at 8 AM
    instruction: 'Run the Incident Response Flow workflow: 1) Analyze all recent incidents and their impact. 2) Identify control gaps related to these incidents. 3) Re-assess risk scores for affected risk scenarios. 4) Propose treatment actions for identified gaps. Present a comprehensive report.',
    targetServers: ['riskready-incidents', 'riskready-controls', 'riskready-risks'],
    enabled: false,
  },
  {
    name: 'Weekly Risk Review',
    description: 'Automated weekly review: tolerance breaches, KRI trends, overdue treatments, and executive summary.',
    cronExpression: '0 7 * * 1', // Monday at 7 AM
    instruction: 'Run the Weekly Risk Review: 1) Check all risks for tolerance breaches. 2) Analyze KRI trends and identify any threshold breaches. 3) Review overdue risk treatment plans. 4) Compile an executive summary suitable for board presentation.',
    targetServers: ['riskready-risks', 'riskready-controls'],
    enabled: false,
  },
  {
    name: 'Control Assurance Cycle',
    description: 'Assessment status review, gap analysis, and nonconformity tracking.',
    cronExpression: '0 8 * * 3', // Wednesday at 8 AM
    instruction: 'Run the Control Assurance Cycle: 1) Review all control assessments for status and overdue items. 2) Perform a gap analysis for partially or unimplemented controls. 3) Track open nonconformities and corrective action plans. Produce a consolidated assurance report.',
    targetServers: ['riskready-controls', 'riskready-audits', 'riskready-risks'],
    enabled: false,
  },
  {
    name: 'Policy Compliance Check',
    description: 'Policy review status, exception expiry, and evidence coverage analysis.',
    cronExpression: '0 9 1 * *', // 1st of month at 9 AM
    instruction: 'Run the Policy Compliance Check: 1) Identify policies overdue for review. 2) Check for expiring policy exceptions within 30 days. 3) Analyze evidence coverage gaps across controls and policies. Produce a compliance status report.',
    targetServers: ['riskready-policies', 'riskready-evidence', 'riskready-controls'],
    enabled: false,
  },
];

export async function seedAgentWorkflows(prisma: PrismaClient, organisationId: string) {
  for (const schedule of BUILT_IN_SCHEDULES) {
    const existing = await prisma.agentSchedule.findFirst({
      where: {
        name: schedule.name,
        organisationId,
      },
    });

    if (!existing) {
      await prisma.agentSchedule.create({
        data: {
          ...schedule,
          organisationId,
        },
      });
    }
  }
}
