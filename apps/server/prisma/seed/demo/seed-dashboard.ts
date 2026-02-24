import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

/**
 * Seed dashboard-related historical data.
 *
 * Creates:
 * - 6 months of RiskCalculationHistory entries for trend charts
 * - RiskEventLog entries for risk activity feed
 * - Additional KRI history data points for sparklines
 *
 * Note: Compliance scores are already in ApplicableFramework (seed-organisation).
 * KRI history (3 months) is already in seed-risks.
 * This module adds longer-range trend data for the dashboard.
 */
export async function seedDashboard(
  prisma: PrismaClient,
  ctx: DemoContext,
): Promise<void> {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  // ============================================================
  // 1. RISK CALCULATION HISTORY (6 months of trend data)
  //    Shows gradual improvement in risk posture
  // ============================================================

  // Get scenario IDs for the trend data
  const scenarios = await prisma.riskScenario.findMany({
    where: { risk: { organisationId: ctx.orgId } },
    select: { id: true, scenarioId: true, residualScore: true },
    take: 10,
  });

  if (scenarios.length > 0) {
    // Generate monthly snapshots for each scenario showing improvement
    const monthOffsets = [180, 150, 120, 90, 60, 30]; // 6 months back

    for (const scenario of scenarios) {
      const baseScore = (scenario.residualScore ?? 12) + 4; // Start higher
      for (let i = 0; i < monthOffsets.length; i++) {
        const offset = monthOffsets[i]!;
        const improvement = Math.floor((i / monthOffsets.length) * 4);
        const score = Math.max(baseScore - improvement, scenario.residualScore ?? 4);
        const likelihood = Math.min(5, Math.max(1, Math.ceil(score / 5)));
        const impact = Math.min(5, Math.max(1, Math.ceil(score / likelihood)));

        await prisma.riskCalculationHistory.create({
          data: {
            scenarioId: scenario.id,
            calculatedAt: daysAgo(offset),
            calculatedById: ctx.users.riskAnalyst,
            trigger: 'SCHEDULED',
            triggerDetails: `Monthly scheduled risk recalculation`,
            f1ThreatFrequency: Math.min(5, likelihood + 1),
            f2ControlEffectiveness: Math.max(1, 5 - improvement),
            f3GapVulnerability: Math.max(1, 4 - Math.floor(improvement / 2)),
            likelihood: likelihood,
            impact: impact,
            inherentScore: Math.min(25, score + 6),
            residualScore: score,
            previousResidualScore: i > 0 ? score + 1 : null,
            scoreChange: i > 0 ? -1 : null,
          },
        });
      }
    }
    console.log(`    ${scenarios.length * monthOffsets.length} risk calculation history entries created`);
  }

  // ============================================================
  // 2. RISK EVENT LOG (recent activity for activity feed)
  // ============================================================

  const riskIds = Object.values(ctx.riskIds).slice(0, 8);

  const eventTypes = [
    { type: 'SCENARIO_UPDATED', desc: 'Scenario residual score recalculated' },
    { type: 'CONTROL_LINKED', desc: 'Mitigating control linked to scenario' },
    { type: 'KRI_RECORDED', desc: 'KRI measurement recorded' },
    { type: 'TREATMENT_COMPLETED', desc: 'Treatment action completed' },
    { type: 'KRI_BREACH', desc: 'KRI threshold breached' },
  ];

  const actors = [ctx.users.riskAnalyst, ctx.users.ciso, ctx.users.securityLead, ctx.users.ismsManager];

  for (let i = 0; i < Math.min(riskIds.length, 10); i++) {
    const eventDef = eventTypes[i % eventTypes.length]!;
    const riskId = riskIds[i % riskIds.length]!;
    const actorId = actors[i % actors.length]!;
    await prisma.riskEventLog.create({
      data: {
        riskId,
        eventType: eventDef.type,
        eventData: { description: eventDef.desc, timestamp: daysAgo(i * 3).toISOString() },
        sourceEntityType: 'scenario',
        triggeredActions: [],
        actorId,
        isSystemEvent: i % 3 === 0,
        createdAt: daysAgo(i * 3),
      },
    });
  }
  console.log(`    ${Math.min(riskIds.length, 10)} risk event log entries created`);

  // ============================================================
  // 3. ADDITIONAL KRI HISTORY (extend to 6 months for sparklines)
  // ============================================================

  const kris = await prisma.keyRiskIndicator.findMany({
    where: { risk: { organisationId: ctx.orgId } },
    select: { id: true, kriId: true, currentValue: true, status: true },
  });

  // Add months 4-6 (months 1-3 already created by seed-risks)
  const extraMonthOffsets = [120, 150, 180]; // 4, 5, 6 months ago
  const kriBaselines: Record<string, { values: string[]; statuses: ('GREEN' | 'AMBER' | 'RED')[] }> = {
    'KRI-001': { values: ['91', '89', '87'], statuses: ['AMBER', 'AMBER', 'AMBER'] },
    'KRI-002': { values: ['5.8', '6.1', '7.2'], statuses: ['AMBER', 'RED', 'RED'] },
    'KRI-003': { values: ['18', '22', '25'], statuses: ['GREEN', 'AMBER', 'AMBER'] },
    'KRI-004': { values: ['82', '79', '76'], statuses: ['AMBER', 'RED', 'RED'] },
    'KRI-005': { values: ['88', '85', '82'], statuses: ['AMBER', 'AMBER', 'AMBER'] },
    'KRI-006': { values: ['4', '5', '5'], statuses: ['RED', 'RED', 'RED'] },
    'KRI-007': { values: ['97.5', '96.8', '95.2'], statuses: ['GREEN', 'GREEN', 'AMBER'] },
    'KRI-008': { values: ['10', '12', '14'], statuses: ['AMBER', 'RED', 'RED'] },
  };

  let kriHistoryCount = 0;
  for (const kri of kris) {
    const baseline = kriBaselines[kri.kriId];
    if (!baseline) continue;

    for (let i = 0; i < extraMonthOffsets.length; i++) {
      const offset = extraMonthOffsets[i]!;
      await prisma.kRIHistory.create({
        data: {
          kriId: kri.id,
          value: baseline.values[i]!,
          status: baseline.statuses[i]!,
          measuredAt: daysAgo(offset),
          measuredBy: ctx.users.riskAnalyst,
          notes: `Historical measurement from ${Math.floor(offset / 30)} months ago`,
        },
      });
      kriHistoryCount++;
    }
  }
  console.log(`    ${kriHistoryCount} additional KRI history entries created`);

  // ============================================================
  // 4. CONTROL METRIC EXTENDED HISTORY (months 4-6)
  // ============================================================

  const controlMetrics = await prisma.controlMetric.findMany({
    where: { control: { organisationId: ctx.orgId } },
    select: { id: true, metricId: true },
  });

  let metricHistoryCount = 0;
  for (const metric of controlMetrics) {
    for (let i = 0; i < extraMonthOffsets.length; i++) {
      const offset = extraMonthOffsets[i]!;
      // Generate slightly worse historical values to show improvement trend
      const baseValue = 70 + Math.floor(Math.random() * 15);
      const status = baseValue >= 90 ? 'GREEN' : baseValue >= 75 ? 'AMBER' : 'RED';
      await prisma.controlMetricHistory.create({
        data: {
          metricId: metric.id,
          value: `${baseValue}%`,
          status: status as 'GREEN' | 'AMBER' | 'RED',
          measuredAt: daysAgo(offset),
          notes: `Historical data point`,
        },
      });
      metricHistoryCount++;
    }
  }
  console.log(`    ${metricHistoryCount} additional control metric history entries created`);
}
