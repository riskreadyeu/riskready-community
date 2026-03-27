import { PrismaClient } from '@prisma/client';
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

// Parse risk CSV line - handles unquoted commas in Description and Org_Size
function parseRiskLine(line: string): string[] {
  const parts = parseCSVLine(line);
  const len = parts.length;

  // Find Framework position by looking for ISO/SOC2/NIS2/DORA from the end
  let frameworkIndex = -1;
  for (let i = len - 2; i >= 0; i--) {
    if (['ISO', 'SOC2', 'NIS2', 'DORA'].includes(parts[i])) {
      frameworkIndex = i;
      break;
    }
  }

  if (frameworkIndex === -1) {
    return parts;
  }

  const controlsIndex = frameworkIndex - 1;

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

  const orgSizeParts = parts.slice(tierIndex + 1, controlsIndex);
  const descriptionParts = parts.slice(2, tierIndex);

  return [
    parts[0], // Risk_ID
    parts[1], // Title
    descriptionParts.join(', '), // Description
    parts[tierIndex], // Tier
    orgSizeParts.join(','), // Org_Size
    parts[controlsIndex], // Controls
    parts[frameworkIndex], // Framework
    parts[frameworkIndex + 1] || '', // SOC2_Criteria
    parts[frameworkIndex + 2] || '', // TSC_Category
  ];
}

// Parse control IDs from a string like "A.5.1, A.5.2" or "A.5.17; A.8.5"
function parseControlIds(controlsStr: string): string[] {
  if (!controlsStr) return [];

  // Handle both comma and semicolon separators
  return controlsStr
    .split(/[,;]/)
    .map(id => id.trim())
    .filter(id => id.length > 0)
    // Normalize control IDs (remove "A." prefix if present for matching)
    .map(id => id.startsWith('A.') ? id.substring(2) : id);
}

export async function linkControlsToRisksAndScenarios() {
  console.log('\n🔗 Starting Control Linking...\n');

  // Get organisation
  const organisation = await prisma.organisationProfile.findFirst();
  if (!organisation) {
    throw new Error('No organisation found.');
  }

  const organisationId = organisation.id;
  console.log(`Organisation: ${organisation.name}\n`);

  // ============================================
  // STEP 1: Build control lookup map
  // ============================================
  console.log('📊 Building control lookup...');

  const controls = await prisma.control.findMany({
    where: { organisationId },
    select: { id: true, controlId: true },
  });

  const controlMap = new Map<string, string>(); // controlId -> database id
  for (const control of controls) {
    controlMap.set(control.controlId, control.id);
  }

  console.log(`  Found ${controls.length} controls in database\n`);

  // ============================================
  // STEP 2: Read risks.md and link controls to risks
  // ============================================
  console.log('📄 Reading risks.md for control links...');

  const risksPath = path.join(__dirname, '../../../../../.temp/draft/risks.md');
  const risksContent = fs.readFileSync(risksPath, 'utf-8');
  const risksLines = risksContent.trim().split('\n');

  const risks = await prisma.risk.findMany({
    where: { organisation: { id: organisationId } },
    select: { id: true, riskId: true },
  });

  const riskMap = new Map<string, string>(); // riskId -> database id
  for (const risk of risks) {
    riskMap.set(risk.riskId, risk.id);
  }

  let riskLinksCreated = 0;
  let riskLinksFailed = 0;

  for (const line of risksLines.slice(1)) {
    const fields = parseRiskLine(line);
    const riskId = fields[0];
    const controlsStr = fields[5];

    if (!riskId || !controlsStr) continue;

    const riskDbId = riskMap.get(riskId);
    if (!riskDbId) {
      console.warn(`  ⚠ Risk not found: ${riskId}`);
      continue;
    }

    const controlIds = parseControlIds(controlsStr);
    const validControlDbIds: string[] = [];

    for (const controlId of controlIds) {
      const controlDbId = controlMap.get(controlId);
      if (controlDbId) {
        validControlDbIds.push(controlDbId);
      } else {
        riskLinksFailed++;
      }
    }

    if (validControlDbIds.length > 0) {
      await prisma.risk.update({
        where: { id: riskDbId },
        data: {
          controls: {
            connect: validControlDbIds.map(id => ({ id })),
          },
        },
      });
      riskLinksCreated += validControlDbIds.length;
    }
  }

  console.log(`  ✓ Created ${riskLinksCreated} risk-control links`);
  if (riskLinksFailed > 0) {
    console.log(`  ⚠ ${riskLinksFailed} control IDs not found in database`);
  }

  // ============================================
  // STEP 3: Read scenarios.md and link controls to scenarios
  // ============================================
  console.log('\n📄 Reading scenarios.md for control links...');

  const scenariosPath = path.join(__dirname, '../../../../../.temp/draft/scenarios.md');
  const scenariosContent = fs.readFileSync(scenariosPath, 'utf-8');
  const scenariosLines = scenariosContent.trim().split('\n');

  // Get all scenarios
  const scenarios = await prisma.riskScenario.findMany({
    select: { id: true, scenarioId: true },
  });

  const scenarioMap = new Map<string, string>(); // scenarioId -> database id
  for (const scenario of scenarios) {
    scenarioMap.set(scenario.scenarioId, scenario.id);
  }

  let scenarioLinksCreated = 0;
  let scenarioLinksFailed = 0;

  // Parse scenarios: Scenario_ID,Parent_Risk_ID,Title,Cause,Event,Consequence,Controls,Framework
  for (const line of scenariosLines.slice(1)) {
    const fields = parseCSVLine(line);
    const scenarioId = fields[0];
    const controlsStr = fields[6]; // Controls column

    if (!scenarioId || !controlsStr) continue;

    const scenarioDbId = scenarioMap.get(scenarioId);
    if (!scenarioDbId) {
      continue;
    }

    const controlIds = parseControlIds(controlsStr);

    for (const controlId of controlIds) {
      const controlDbId = controlMap.get(controlId);
      if (!controlDbId) {
        scenarioLinksFailed++;
        continue;
      }

      // Create RiskScenarioControl junction record
      try {
        await prisma.riskScenarioControl.upsert({
          where: {
            scenarioId_controlId: {
              scenarioId: scenarioDbId,
              controlId: controlDbId,
            },
          },
          update: {},
          create: {
            scenarioId: scenarioDbId,
            controlId: controlDbId,
            effectivenessWeight: 100,
            isPrimaryControl: true,
          },
        });
        scenarioLinksCreated++;
      } catch (e) {
        // Ignore duplicate errors
      }
    }
  }

  console.log(`  ✓ Created ${scenarioLinksCreated} scenario-control links`);
  if (scenarioLinksFailed > 0) {
    console.log(`  ⚠ ${scenarioLinksFailed} control IDs not found in database`);
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n📈 Summary:');
  console.log(`  Risk-Control links: ${riskLinksCreated}`);
  console.log(`  Scenario-Control links: ${scenarioLinksCreated}`);

  console.log('\n✅ Control linking complete!\n');
}

// Run if called directly
if (require.main === module) {
  linkControlsToRisksAndScenarios()
    .catch((e) => {
      console.error('Linking failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
