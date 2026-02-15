import { PrismaClient, ControlTheme, CapabilityType, CollectionFrequency } from '@prisma/client';
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

// Determine control theme from control ID
function getControlTheme(controlId: string): ControlTheme {
  // ISO 27001:2022 Annex A structure:
  // 5.x = Organisational controls
  // 6.x = People controls
  // 7.x = Physical controls
  // 8.x = Technological controls
  if (controlId.startsWith('5.')) return 'ORGANISATIONAL';
  if (controlId.startsWith('6.')) return 'PEOPLE';
  if (controlId.startsWith('7.')) return 'PHYSICAL';
  if (controlId.startsWith('8.')) return 'TECHNOLOGICAL';
  // Default for non-ISO controls
  return 'ORGANISATIONAL';
}

// Parse capability type
function parseCapabilityType(type: string): CapabilityType {
  const typeMap: Record<string, CapabilityType> = {
    'Process': 'PROCESS',
    'Technology': 'TECHNOLOGY',
    'People': 'PEOPLE',
    'Physical': 'PHYSICAL',
  };
  return typeMap[type] || 'PROCESS';
}

// Parse collection frequency
function parseCollectionFrequency(freq: string): CollectionFrequency {
  const freqLower = freq.toLowerCase();
  if (freqLower.includes('daily')) return 'DAILY';
  if (freqLower.includes('weekly')) return 'WEEKLY';
  if (freqLower.includes('monthly')) return 'MONTHLY';
  if (freqLower.includes('quarterly')) return 'QUARTERLY';
  if (freqLower.includes('annual')) return 'ANNUAL';
  if (freqLower.includes('event')) return 'PER_EVENT';
  if (freqLower.includes('incident')) return 'PER_INCIDENT';
  return 'MONTHLY';
}

interface ControlData {
  metricId: string;
  capabilityId: string;
  controlId: string;
  controlName: string;
  capabilityName: string;
  capabilityDescription: string;
  capabilityType: string;
  metricName: string;
  metricFormula: string;
  unit: string;
  green: string;
  amber: string;
  red: string;
  collectionFrequency: string;
}

export async function seedControlsAndCapabilities() {
  console.log('\n🚀 Starting Controls and Capabilities seed...\n');

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
  // STEP 1: Read and parse controls.md
  // ============================================
  console.log('📄 Reading controls.md...');
  const controlsPath = path.join(__dirname, '../../../../../.temp/draft/controls.md');
  const controlsContent = fs.readFileSync(controlsPath, 'utf-8');
  const controlsLines = controlsContent.trim().split('\n');

  // Parse all rows (skip header)
  const rows: ControlData[] = controlsLines.slice(1).map(line => {
    const fields = parseCSVLine(line);
    return {
      metricId: fields[0],
      capabilityId: fields[1],
      controlId: fields[2],
      controlName: fields[3],
      capabilityName: fields[4],
      capabilityDescription: fields[5],
      capabilityType: fields[6],
      metricName: fields[7],
      metricFormula: fields[8],
      unit: fields[9],
      green: fields[10],
      amber: fields[11],
      red: fields[12],
      collectionFrequency: fields[13],
    };
  }).filter(r => r.controlId);

  console.log(`  Found ${rows.length} capability-metric rows\n`);

  // ============================================
  // STEP 2: Extract unique controls
  // ============================================
  const uniqueControls = new Map<string, { controlId: string; controlName: string }>();
  for (const row of rows) {
    if (!uniqueControls.has(row.controlId)) {
      uniqueControls.set(row.controlId, {
        controlId: row.controlId,
        controlName: row.controlName,
      });
    }
  }
  console.log(`  Found ${uniqueControls.size} unique controls`);

  // ============================================
  // STEP 3: Extract unique capabilities
  // ============================================
  const uniqueCapabilities = new Map<string, ControlData>();
  for (const row of rows) {
    if (!uniqueCapabilities.has(row.capabilityId)) {
      uniqueCapabilities.set(row.capabilityId, row);
    }
  }
  console.log(`  Found ${uniqueCapabilities.size} unique capabilities`);
  console.log(`  Found ${rows.length} metrics\n`);

  // ============================================
  // STEP 4: Delete existing controls (cascade deletes capabilities and metrics)
  // ============================================
  console.log('📦 Cleaning existing controls...');
  const deletedControls = await prisma.control.deleteMany({
    where: { organisationId },
  });
  console.log(`  Deleted ${deletedControls.count} existing controls\n`);

  // ============================================
  // STEP 5: Create controls
  // ============================================
  console.log('📊 Creating controls...');

  const controlDbIdMap = new Map<string, string>(); // controlId -> database id

  for (const [controlId, controlData] of uniqueControls) {
    const control = await prisma.control.create({
      data: {
        controlId: controlData.controlId,
        name: controlData.controlName,
        theme: getControlTheme(controlData.controlId),
        framework: 'ISO',
        sourceStandard: 'ISO 27001:2022 Annex A',
        implementationStatus: 'IMPLEMENTED',
        organisationId,
        createdById: userId,
        updatedById: userId,
      },
    });
    controlDbIdMap.set(controlId, control.id);
  }

  console.log(`  ✓ Created ${uniqueControls.size} controls\n`);

  // ============================================
  // STEP 6: Create capabilities
  // ============================================
  console.log('📊 Creating capabilities...');

  const capabilityDbIdMap = new Map<string, string>(); // capabilityId -> database id

  for (const [capabilityId, capData] of uniqueCapabilities) {
    const controlDbId = controlDbIdMap.get(capData.controlId);
    if (!controlDbId) {
      console.warn(`  ⚠ Control not found for capability ${capabilityId}`);
      continue;
    }

    const capability = await prisma.capability.create({
      data: {
        capabilityId: capData.capabilityId,
        name: capData.capabilityName,
        type: parseCapabilityType(capData.capabilityType),
        description: capData.capabilityDescription || null,
        testCriteria: `Verify ${capData.capabilityName.toLowerCase()}`,
        evidenceRequired: `Documentation and testing records for ${capData.capabilityName}`,
        controlId: controlDbId,
        createdById: userId,
        updatedById: userId,
      },
    });
    capabilityDbIdMap.set(capabilityId, capability.id);
  }

  console.log(`  ✓ Created ${capabilityDbIdMap.size} capabilities\n`);

  // ============================================
  // STEP 7: Create metrics
  // ============================================
  console.log('📊 Creating metrics...');

  let metricsCreated = 0;

  for (const row of rows) {
    const capabilityDbId = capabilityDbIdMap.get(row.capabilityId);
    if (!capabilityDbId) {
      console.warn(`  ⚠ Capability not found for metric ${row.metricId}`);
      continue;
    }

    await prisma.capabilityMetric.create({
      data: {
        metricId: row.metricId,
        name: row.metricName,
        formula: row.metricFormula,
        unit: row.unit,
        greenThreshold: row.green,
        amberThreshold: row.amber,
        redThreshold: row.red,
        collectionFrequency: parseCollectionFrequency(row.collectionFrequency),
        dataSource: 'Manual collection',
        capabilityId: capabilityDbId,
        createdById: userId,
        updatedById: userId,
      },
    });
    metricsCreated++;
  }

  console.log(`  ✓ Created ${metricsCreated} metrics\n`);

  // ============================================
  // Summary
  // ============================================
  console.log('📈 Summary:');
  console.log(`  Controls created: ${uniqueControls.size}`);
  console.log(`  Capabilities created: ${capabilityDbIdMap.size}`);
  console.log(`  Metrics created: ${metricsCreated}`);

  // Theme breakdown
  const themeCounts: Record<string, number> = {};
  for (const [controlId] of uniqueControls) {
    const theme = getControlTheme(controlId);
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  }
  console.log('\n  By Theme:');
  for (const [theme, count] of Object.entries(themeCounts)) {
    console.log(`    ${theme}: ${count} controls`);
  }

  console.log('\n✅ Controls and Capabilities seed complete!\n');
}

// Run if called directly
if (require.main === module) {
  seedControlsAndCapabilities()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
