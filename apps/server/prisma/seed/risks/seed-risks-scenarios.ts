import { PrismaClient, RiskTier, ControlFramework, ScenarioStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Parse risk CSV line - special handling for unquoted commas in Description and Org_Size
// Format: Risk_ID,Title,Description,Tier,Org_Size,Controls,Framework,SOC2_Criteria,TSC_Category
// Work backwards from the end where fields are more predictable
function parseRiskLine(line: string): string[] {
  const parts = parseCSVLine(line);
  const len = parts.length;

  // Work backwards: last 4 fields are fairly stable
  // TSC_Category is last (single word or "Multiple")
  // SOC2_Criteria is before that (can be complex like "CC1.1, CC1.2")
  // Framework is before that (ISO, SOC2, NIS2, DORA)
  // Controls is before that (starts with A. or contains control-like patterns)

  // Find Framework position by looking for ISO/SOC2/NIS2/DORA from the end
  let frameworkIndex = -1;
  for (let i = len - 2; i >= 0; i--) {
    if (['ISO', 'SOC2', 'NIS2', 'DORA'].includes(parts[i])) {
      frameworkIndex = i;
      break;
    }
  }

  if (frameworkIndex === -1) {
    // Fallback
    return parts;
  }

  // Controls is the field before Framework
  const controlsIndex = frameworkIndex - 1;

  // Find Tier position by looking for Core/Standard/Extended before Controls
  let tierIndex = -1;
  for (let i = controlsIndex - 1; i >= 0; i--) {
    if (['Core', 'Standard', 'Extended'].includes(parts[i])) {
      tierIndex = i;
      break;
    }
  }

  if (tierIndex === -1) {
    return parts;
  }

  // Everything between Tier and Controls is Org_Size (could be "S", "M", "L" or combinations)
  const orgSizeParts = parts.slice(tierIndex + 1, controlsIndex);

  // Risk_ID is first, Title is second, Description is everything between Title and Tier
  const descriptionParts = parts.slice(2, tierIndex);

  return [
    parts[0], // Risk_ID
    parts[1], // Title
    descriptionParts.join(', '), // Description (reconstructed)
    parts[tierIndex], // Tier
    orgSizeParts.join(','), // Org_Size
    parts[controlsIndex], // Controls
    parts[frameworkIndex], // Framework
    parts[frameworkIndex + 1] || '', // SOC2_Criteria
    parts[frameworkIndex + 2] || '', // TSC_Category
  ];
}

// Parse tier string to enum
function parseTier(tier: string): RiskTier {
  const tierMap: Record<string, RiskTier> = {
    'Core': 'CORE',
    'Standard': 'EXTENDED', // Map Standard to Extended
    'Extended': 'ADVANCED', // Map Extended to Advanced
  };
  return tierMap[tier] || 'CORE';
}

// Parse framework string to enum
function parseFramework(framework: string): ControlFramework {
  const frameworkMap: Record<string, ControlFramework> = {
    'ISO': 'ISO',
    'SOC2': 'SOC2',
    'NIS2': 'NIS2',
    'DORA': 'DORA',
  };
  return frameworkMap[framework] || 'ISO';
}

interface RiskData {
  riskId: string;
  title: string;
  description: string;
  tier: string;
  orgSize: string;
  controls: string;
  framework: string;
  soc2Criteria: string;
  tscCategory: string;
}

interface ScenarioData {
  scenarioId: string;
  parentRiskId: string;
  title: string;
  cause: string;
  event: string;
  consequence: string;
  controls: string;
  framework: string;
}

export async function seedRisksAndScenarios() {
  console.log('\n🚀 Starting Risks and Scenarios seed...\n');

  // Get organisation
  const organisation = await prisma.organisationProfile.findFirst();
  if (!organisation) {
    throw new Error('No organisation found. Run organisation seed first.');
  }

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@riskready.com' },
  });
  if (!adminUser) {
    throw new Error('Admin user not found. Run user seed first.');
  }

  const organisationId = organisation.id;
  const userId = adminUser.id;

  console.log(`Organisation: ${organisation.name} (${organisationId})`);
  console.log(`User: ${adminUser.email} (${userId})\n`);

  // ============================================
  // STEP 1: Delete existing data
  // ============================================
  console.log('📦 Cleaning existing data...');

  // Delete in reverse dependency order
  const deletedScenarioControls = await prisma.riskScenarioControl.deleteMany({});
  console.log(`  Deleted ${deletedScenarioControls.count} scenario-control links`);

  const deletedStateHistory = await prisma.scenarioStateHistory.deleteMany({});
  console.log(`  Deleted ${deletedStateHistory.count} state history records`);

  const deletedCalculationHistory = await prisma.riskCalculationHistory.deleteMany({});
  console.log(`  Deleted ${deletedCalculationHistory.count} calculation history records`);

  const deletedAcceptances = await prisma.riskAcceptance.deleteMany({});
  console.log(`  Deleted ${deletedAcceptances.count} acceptances`);

  const deletedEscalations = await prisma.riskEscalation.deleteMany({});
  console.log(`  Deleted ${deletedEscalations.count} escalations`);

  const deletedReviews = await prisma.scenarioReview.deleteMany({});
  console.log(`  Deleted ${deletedReviews.count} reviews`);

  const deletedScenarios = await prisma.riskScenario.deleteMany({});
  console.log(`  Deleted ${deletedScenarios.count} scenarios`);

  const deletedAlerts = await prisma.riskAlert.deleteMany({});
  console.log(`  Deleted ${deletedAlerts.count} alerts`);

  const deletedEventLogs = await prisma.riskEventLog.deleteMany({});
  console.log(`  Deleted ${deletedEventLogs.count} event logs`);

  const deletedSnapshots = await prisma.assessmentSnapshot.deleteMany({});
  console.log(`  Deleted ${deletedSnapshots.count} snapshots`);

  const deletedToleranceEvals = await prisma.toleranceEvaluation.deleteMany({});
  console.log(`  Deleted ${deletedToleranceEvals.count} tolerance evaluations`);

  const deletedRisks = await prisma.risk.deleteMany({});
  console.log(`  Deleted ${deletedRisks.count} risks`);

  console.log('✓ Existing data cleaned\n');

  // ============================================
  // STEP 2: Read and parse risks.md
  // ============================================
  console.log('📄 Reading risks.md...');
  const risksPath = path.join(__dirname, '../../../../../.temp/draft/risks.md');
  const risksContent = fs.readFileSync(risksPath, 'utf-8');
  const risksLines = risksContent.trim().split('\n');

  // Skip header line
  const risks: RiskData[] = risksLines.slice(1).map(line => {
    const fields = parseRiskLine(line);
    return {
      riskId: fields[0],
      title: fields[1],
      description: fields[2],
      tier: fields[3],
      orgSize: fields[4],
      controls: fields[5],
      framework: fields[6],
      soc2Criteria: fields[7],
      tscCategory: fields[8],
    };
  }).filter(r => r.riskId); // Filter out empty lines

  console.log(`  Found ${risks.length} risks\n`);

  // ============================================
  // STEP 3: Read and parse scenarios.md
  // ============================================
  console.log('📄 Reading scenarios.md...');
  const scenariosPath = path.join(__dirname, '../../../../../.temp/draft/scenarios.md');
  const scenariosContent = fs.readFileSync(scenariosPath, 'utf-8');
  const scenariosLines = scenariosContent.trim().split('\n');

  // Skip header line
  const scenarios: ScenarioData[] = scenariosLines.slice(1).map(line => {
    const fields = parseCSVLine(line);
    return {
      scenarioId: fields[0],
      parentRiskId: fields[1],
      title: fields[2],
      cause: fields[3],
      event: fields[4],
      consequence: fields[5],
      controls: fields[6],
      framework: fields[7],
    };
  }).filter(s => s.scenarioId); // Filter out empty lines

  console.log(`  Found ${scenarios.length} scenarios\n`);

  // ============================================
  // STEP 4: Seed risks
  // ============================================
  console.log('📊 Seeding risks...');

  const riskIdMap = new Map<string, string>(); // Map riskId -> database id

  for (const risk of risks) {
    const createdRisk = await prisma.risk.create({
      data: {
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        tier: parseTier(risk.tier),
        orgSize: risk.orgSize,
        framework: parseFramework(risk.framework),
        soc2Criteria: risk.soc2Criteria || null,
        tscCategory: risk.tscCategory || null,
        organisationId,
        createdById: userId,
        updatedById: userId,
      },
    });

    riskIdMap.set(risk.riskId, createdRisk.id);
  }

  console.log(`  ✓ Created ${risks.length} risks\n`);

  // ============================================
  // STEP 5: Seed scenarios
  // ============================================
  console.log('📊 Seeding scenarios...');

  let scenarioCount = 0;
  let orphanedScenarios = 0;

  for (const scenario of scenarios) {
    const parentDbId = riskIdMap.get(scenario.parentRiskId);

    if (!parentDbId) {
      console.warn(`  ⚠ Orphaned scenario: ${scenario.scenarioId} (parent ${scenario.parentRiskId} not found)`);
      orphanedScenarios++;
      continue;
    }

    await prisma.riskScenario.create({
      data: {
        scenarioId: scenario.scenarioId,
        title: scenario.title,
        cause: scenario.cause || null,
        event: scenario.event || null,
        consequence: scenario.consequence || null,
        status: 'DRAFT' as ScenarioStatus,
        framework: parseFramework(scenario.framework),
        riskId: parentDbId,
        createdById: userId,
        updatedById: userId,
      },
    });

    scenarioCount++;
  }

  console.log(`  ✓ Created ${scenarioCount} scenarios`);
  if (orphanedScenarios > 0) {
    console.log(`  ⚠ Skipped ${orphanedScenarios} orphaned scenarios`);
  }

  // ============================================
  // STEP 6: Update risk scenario counts
  // ============================================
  console.log('\n📊 Updating risk scenario counts...');

  for (const [riskId, dbId] of riskIdMap) {
    const count = await prisma.riskScenario.count({
      where: { riskId: dbId },
    });

    await prisma.risk.update({
      where: { id: dbId },
      data: { scenarioCount: count },
    });
  }

  console.log('  ✓ Updated scenario counts\n');

  // ============================================
  // Summary
  // ============================================
  console.log('📈 Summary:');
  console.log(`  Risks created: ${risks.length}`);
  console.log(`  Scenarios created: ${scenarioCount}`);
  console.log(`  Avg scenarios per risk: ${(scenarioCount / risks.length).toFixed(1)}`);

  // Framework breakdown
  const frameworkCounts: Record<string, number> = {};
  for (const risk of risks) {
    frameworkCounts[risk.framework] = (frameworkCounts[risk.framework] || 0) + 1;
  }
  console.log('\n  By Framework:');
  for (const [fw, count] of Object.entries(frameworkCounts)) {
    console.log(`    ${fw}: ${count} risks`);
  }

  console.log('\n✅ Risks and Scenarios seed complete!\n');
}

// Run if called directly
if (require.main === module) {
  seedRisksAndScenarios()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
