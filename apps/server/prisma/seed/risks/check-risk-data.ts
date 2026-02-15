import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRiskData() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RISK REGISTER DATA ANALYSIS');
  console.log('='.repeat(60) + '\n');

  // Get organisation
  const org = await prisma.organisationProfile.findFirst();
  if (!org) {
    console.log('❌ No organisation found');
    return;
  }

  // ============================================
  // COUNT ENTITIES
  // ============================================
  console.log('📈 ENTITY COUNTS\n');

  const riskCount = await prisma.risk.count({ where: { organisationId: org.id } });
  const scenarioCount = await prisma.riskScenario.count();
  const kriCount = await prisma.keyRiskIndicator.count();
  const treatmentCount = await prisma.treatmentPlan.count({ where: { organisationId: org.id } });
  const actionCount = await prisma.treatmentAction.count();
  const rtsCount = await prisma.riskToleranceStatement.count({ where: { organisationId: org.id } });
  const birtCount = await prisma.scenarioImpactAssessment.count();
  const controlCount = await prisma.control.count({ where: { organisationId: org.id } });

  console.log(`   Risks:                    ${riskCount}`);
  console.log(`   Risk Scenarios:           ${scenarioCount}`);
  console.log(`   BIRT Impact Assessments:  ${birtCount}`);
  console.log(`   Key Risk Indicators:      ${kriCount}`);
  console.log(`   Treatment Plans:          ${treatmentCount}`);
  console.log(`   Treatment Actions:        ${actionCount}`);
  console.log(`   Risk Tolerance Statements:${rtsCount}`);
  console.log(`   Controls (for linking):   ${controlCount}`);

  // ============================================
  // ANALYZE SCENARIOS - WHAT'S MISSING?
  // ============================================
  console.log('\n' + '-'.repeat(60));
  console.log('🔍 SCENARIO DATA COMPLETENESS\n');

  const scenarios = await prisma.riskScenario.findMany({
    include: {
      impactAssessments: true,
      controlLinks: true,
    },
  });

  let withNarrative = 0;
  let withSLE = 0;
  let withBIRT = 0;
  let withFullBIRT = 0;
  let withF1 = 0;
  let withF2 = 0;
  let withF3 = 0;
  let withF4 = 0;
  let withF5 = 0;
  let withF6 = 0;
  let withControls = 0;
  let withInherentScore = 0;
  let withResidualScore = 0;
  let withCalculatedScores = 0;

  for (const s of scenarios) {
    if (s.cause && s.event && s.consequence) withNarrative++;
    if (s.sleLow || s.sleLikely || s.sleHigh) withSLE++;
    if (s.impactAssessments.length > 0) withBIRT++;
    if (s.impactAssessments.filter(a => !a.isResidual).length >= 4) withFullBIRT++;
    if (s.f1ThreatFrequency) withF1++;
    if (s.f2ControlEffectiveness) withF2++;
    if (s.f3GapVulnerability) withF3++;
    if (s.f4IncidentHistory) withF4++;
    if (s.f5AttackSurface) withF5++;
    if (s.f6Environmental) withF6++;
    if (s.controlLinks.length > 0) withControls++;
    if (s.inherentScore) withInherentScore++;
    if (s.residualScore) withResidualScore++;
    if (s.calculatedLikelihood && s.calculatedImpact) withCalculatedScores++;
  }

  const total = scenarios.length;
  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';

  console.log('   IMPORTED DATA (from CSV):');
  console.log(`   ├─ With narrative (cause/event/consequence): ${withNarrative}/${total} (${pct(withNarrative)})`);
  console.log(`   ├─ With SLE estimates:                       ${withSLE}/${total} (${pct(withSLE)})`);
  console.log(`   ├─ With any BIRT assessment:                 ${withBIRT}/${total} (${pct(withBIRT)})`);
  console.log(`   └─ With full BIRT (4 categories):            ${withFullBIRT}/${total} (${pct(withFullBIRT)})`);

  console.log('\n   LIKELIHOOD FACTORS (F1-F6):');
  console.log(`   ├─ F1 Threat Frequency:      ${withF1}/${total} (${pct(withF1)})`);
  console.log(`   ├─ F2 Control Effectiveness: ${withF2}/${total} (${pct(withF2)}) ← Calculated from controls`);
  console.log(`   ├─ F3 Gap/Vulnerability:     ${withF3}/${total} (${pct(withF3)})`);
  console.log(`   ├─ F4 Incident History:      ${withF4}/${total} (${pct(withF4)}) ← Calculated from incidents`);
  console.log(`   ├─ F5 Attack Surface:        ${withF5}/${total} (${pct(withF5)})`);
  console.log(`   └─ F6 Environmental:         ${withF6}/${total} (${pct(withF6)})`);

  console.log('\n   RELATIONSHIPS:');
  console.log(`   └─ With linked controls:     ${withControls}/${total} (${pct(withControls)})`);

  console.log('\n   CALCULATED SCORES:');
  console.log(`   ├─ With inherent score:      ${withInherentScore}/${total} (${pct(withInherentScore)})`);
  console.log(`   ├─ With residual score:      ${withResidualScore}/${total} (${pct(withResidualScore)})`);
  console.log(`   └─ With calculated L×I:      ${withCalculatedScores}/${total} (${pct(withCalculatedScores)})`);

  // ============================================
  // ANALYZE KRIs
  // ============================================
  console.log('\n' + '-'.repeat(60));
  console.log('🔍 KRI DATA COMPLETENESS\n');

  const kris = await prisma.keyRiskIndicator.findMany();
  let krisWithValue = 0;
  let krisWithThresholds = 0;

  for (const k of kris) {
    if (k.currentValue) krisWithValue++;
    if (k.thresholdGreen && k.thresholdAmber && k.thresholdRed) krisWithThresholds++;
  }

  console.log(`   With thresholds defined:  ${krisWithThresholds}/${kris.length}`);
  console.log(`   With current value:       ${krisWithValue}/${kris.length} ← Need measurement`);

  // ============================================
  // CONTROL LINKS STATUS
  // ============================================
  console.log('\n' + '-'.repeat(60));
  console.log('🔗 CONTROL LINK STATUS\n');

  const riskControlLinks = await prisma.risk.findMany({
    where: { organisationId: org.id },
    include: { controls: true },
  });

  const scenarioControlLinks = await prisma.riskScenarioControl.count();

  let risksWithControls = 0;
  for (const r of riskControlLinks) {
    if (r.controls.length > 0) risksWithControls++;
  }

  console.log(`   Risks with linked controls:    ${risksWithControls}/${riskCount}`);
  console.log(`   Scenario-Control links:        ${scenarioControlLinks}`);
  console.log(`   Available controls to link:    ${controlCount}`);

  // ============================================
  // WHAT'S MISSING SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  WHAT NEEDS ATTENTION');
  console.log('='.repeat(60) + '\n');

  const missing: string[] = [];

  if (withFullBIRT < total) {
    missing.push(`❌ ${total - withFullBIRT} scenarios missing full BIRT assessment (4 categories)`);
  }
  if (withF1 < total) {
    missing.push(`❌ ${total - withF1} scenarios missing F1 (Threat Frequency)`);
  }
  if (withControls === 0) {
    missing.push(`❌ No scenarios have linked controls → F2 cannot be calculated`);
  }
  if (withF3 < total) {
    missing.push(`⚠️  ${total - withF3} scenarios missing F3 (Gap/Vulnerability) - optional`);
  }
  if (withF5 < total) {
    missing.push(`⚠️  ${total - withF5} scenarios missing F5 (Attack Surface) - optional`);
  }
  if (withF6 < total) {
    missing.push(`⚠️  ${total - withF6} scenarios missing F6 (Environmental) - optional`);
  }
  if (krisWithValue === 0) {
    missing.push(`❌ No KRIs have current values → RAG status cannot be calculated`);
  }
  if (controlCount === 0) {
    missing.push(`❌ No controls exist → Cannot link risks/scenarios to controls`);
  }
  if (withCalculatedScores < total) {
    missing.push(`❌ ${total - withCalculatedScores} scenarios have no calculated scores → Run calculation service`);
  }

  if (missing.length === 0) {
    console.log('   ✅ All data looks complete!');
  } else {
    missing.forEach(m => console.log(`   ${m}`));
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  try {
    await checkRiskData();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
