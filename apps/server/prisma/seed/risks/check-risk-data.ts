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
  const controlCount = await prisma.control.count({ where: { organisationId: org.id } });

  console.log(`   Risks:                    ${riskCount}`);
  console.log(`   Risk Scenarios:           ${scenarioCount}`);
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
      controlLinks: true,
    },
  });

  let withNarrative = 0;
  let withLikelihood = 0;
  let withImpact = 0;
  let withControls = 0;
  let withInherentScore = 0;
  let withResidualScore = 0;

  for (const s of scenarios) {
    if (s.cause && s.event && s.consequence) withNarrative++;
    if (s.likelihood) withLikelihood++;
    if (s.impact) withImpact++;
    if (s.controlLinks.length > 0) withControls++;
    if (s.inherentScore) withInherentScore++;
    if (s.residualScore) withResidualScore++;
  }

  const total = scenarios.length;
  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';

  console.log('   SCENARIO DATA:');
  console.log(`   ├─ With narrative (cause/event/consequence): ${withNarrative}/${total} (${pct(withNarrative)})`);
  console.log(`   ├─ With likelihood set:                      ${withLikelihood}/${total} (${pct(withLikelihood)})`);
  console.log(`   └─ With impact set:                          ${withImpact}/${total} (${pct(withImpact)})`);

  console.log('\n   RELATIONSHIPS:');
  console.log(`   └─ With linked controls:     ${withControls}/${total} (${pct(withControls)})`);

  console.log('\n   CALCULATED SCORES:');
  console.log(`   ├─ With inherent score:      ${withInherentScore}/${total} (${pct(withInherentScore)})`);
  console.log(`   └─ With residual score:      ${withResidualScore}/${total} (${pct(withResidualScore)})`);

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
  console.log(`   With current value:       ${krisWithValue}/${kris.length}`);

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

  if (withLikelihood < total) {
    missing.push(`❌ ${total - withLikelihood} scenarios missing likelihood`);
  }
  if (withImpact < total) {
    missing.push(`❌ ${total - withImpact} scenarios missing impact`);
  }
  if (withControls === 0) {
    missing.push(`❌ No scenarios have linked controls`);
  }
  if (krisWithValue === 0) {
    missing.push(`❌ No KRIs have current values — RAG status cannot be calculated`);
  }
  if (controlCount === 0) {
    missing.push(`❌ No controls exist — Cannot link risks/scenarios to controls`);
  }
  if (withInherentScore < total) {
    missing.push(`❌ ${total - withInherentScore} scenarios have no inherent score`);
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
