import { PrismaClient, LayerType, TestFrequency, CapabilityType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Four-Layer Framework Migration Script
 *
 * This script migrates existing controls and capabilities to the new Four-Layer model:
 * 1. Creates ControlLayer records (4 per control: GOVERNANCE, PLATFORM, CONSUMPTION, OVERSIGHT)
 * 2. Assigns existing Capabilities to appropriate layers based on their type and name
 * 3. Generates CapabilityTests from LayerTestTemplates for each capability
 *
 * Run with: npx ts-node prisma/seed/controls/seed-four-layer-migration.ts
 */

/**
 * Default owner roles for each layer type
 */
const DEFAULT_LAYER_ROLES: Record<LayerType, string> = {
  GOVERNANCE: 'GRC Team',
  PLATFORM: 'IT Security',
  CONSUMPTION: 'IT Operations',
  OVERSIGHT: 'Security Operations',
};

/**
 * Default test frequencies for each layer type
 */
const DEFAULT_LAYER_FREQUENCIES: Record<LayerType, TestFrequency> = {
  GOVERNANCE: 'QUARTERLY',
  PLATFORM: 'MONTHLY',
  CONSUMPTION: 'MONTHLY',
  OVERSIGHT: 'QUARTERLY',
};

/**
 * Determine which layer a capability should belong to based on its type and name
 */
function mapCapabilityToLayer(capability: { name: string; type: CapabilityType }): LayerType {
  const name = capability.name.toLowerCase();
  const type = capability.type;

  // GOVERNANCE indicators (policies, standards, procedures, RACI)
  if (
    name.includes('policy') ||
    name.includes('procedure') ||
    name.includes('standard') ||
    name.includes('guideline') ||
    name.includes('governance') ||
    name.includes('documented') ||
    name.includes('defined') ||
    name.includes('establish') ||
    name.includes('raci') ||
    name.includes('role') ||
    name.includes('responsibility')
  ) {
    return 'GOVERNANCE';
  }

  // OVERSIGHT indicators (monitoring, reviews, audits, metrics)
  if (
    name.includes('monitor') ||
    name.includes('review') ||
    name.includes('audit') ||
    name.includes('alert') ||
    name.includes('metric') ||
    name.includes('report') ||
    name.includes('log') ||
    name.includes('track') ||
    name.includes('measure') ||
    name.includes('assess')
  ) {
    return 'OVERSIGHT';
  }

  // CONSUMPTION indicators (user actions, training, compliance)
  if (
    name.includes('training') ||
    name.includes('awareness') ||
    name.includes('compliance') ||
    name.includes('follow') ||
    name.includes('user') ||
    name.includes('staff') ||
    name.includes('employee') ||
    name.includes('personnel')
  ) {
    return 'CONSUMPTION';
  }

  // Type-based mapping for remaining capabilities
  switch (type) {
    case 'TECHNOLOGY':
      return 'PLATFORM';
    case 'PHYSICAL':
      return 'PLATFORM';
    case 'PEOPLE':
      // People capabilities that aren't training/awareness go to CONSUMPTION
      return 'CONSUMPTION';
    case 'PROCESS':
      // Process capabilities default to GOVERNANCE unless they're operational
      if (
        name.includes('operati') ||
        name.includes('execut') ||
        name.includes('implement')
      ) {
        return 'CONSUMPTION';
      }
      return 'GOVERNANCE';
    default:
      return 'PLATFORM'; // Default fallback
  }
}

/**
 * Create four layers for a control
 */
async function createLayersForControl(
  controlId: string,
  userId?: string
): Promise<Map<LayerType, string>> {
  const layers: LayerType[] = ['GOVERNANCE', 'PLATFORM', 'CONSUMPTION', 'OVERSIGHT'];
  const layerIdMap = new Map<LayerType, string>();

  for (const layer of layers) {
    // Check if layer already exists
    const existing = await prisma.controlLayer.findUnique({
      where: { controlId_layer: { controlId, layer } },
    });

    if (existing) {
      layerIdMap.set(layer, existing.id);
      continue;
    }

    const created = await prisma.controlLayer.create({
      data: {
        controlId,
        layer,
        defaultOwnerRole: DEFAULT_LAYER_ROLES[layer],
        testFrequency: DEFAULT_LAYER_FREQUENCIES[layer],
        createdById: userId,
      },
    });

    layerIdMap.set(layer, created.id);
  }

  return layerIdMap;
}

/**
 * Generate tests for a capability from templates
 */
async function generateTestsForCapability(
  capabilityId: string,
  capabilityName: string,
  layer: LayerType
): Promise<number> {
  // Get templates for this layer
  const templates = await prisma.layerTestTemplate.findMany({
    where: {
      layer,
      isActive: true,
      isStandard: true,
      organisationId: null, // Global templates only
    },
  });

  let created = 0;

  for (const template of templates) {
    // Check if test already exists
    const existingTest = await prisma.capabilityTest.findUnique({
      where: {
        testCode_capabilityId: {
          testCode: template.templateCode,
          capabilityId,
        },
      },
    });

    if (existingTest) {
      continue; // Skip if test already exists
    }

    // Create test from template
    await prisma.capabilityTest.create({
      data: {
        capabilityId,
        testCode: template.templateCode,
        name: template.name.replace('{capability}', capabilityName),
        description: template.description,
        preconditions: template.preconditions,
        testSteps: template.testSteps,
        expectedResult: template.expectedResult,
        samplingMethod: template.samplingMethod,
        estimatedDuration: template.estimatedDuration,
        evidenceRequired: template.evidenceRequired,
        evidenceTypes: template.evidenceTypes,
        templateId: template.id,
      },
    });

    // Update template usage count
    await prisma.layerTestTemplate.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } },
    });

    created++;
  }

  return created;
}

/**
 * Main migration function
 */
export async function migrateToFourLayerModel(userId?: string) {
  console.log('🔄 Starting Four-Layer Framework Migration...\n');

  // Get all controls
  const controls = await prisma.control.findMany({
    include: {
      capabilities: true,
      layers: true, // Check if layers already exist
    },
  });

  console.log(`📋 Found ${controls.length} controls to process\n`);

  let totalLayersCreated = 0;
  let totalCapabilitiesMigrated = 0;
  let totalTestsCreated = 0;

  for (const control of controls) {
    console.log(`\n📌 Processing: ${control.controlId} - ${control.name}`);

    // Step 1: Create layers (if not already existing)
    const existingLayerCount = control.layers.length;
    const layerIdMap = await createLayersForControl(control.id, userId);
    const newLayersCreated = 4 - existingLayerCount;

    if (newLayersCreated > 0) {
      console.log(`   ✅ Created ${newLayersCreated} layers`);
      totalLayersCreated += newLayersCreated;
    } else {
      console.log(`   ℹ️ Layers already exist`);
    }

    // Step 2: Assign capabilities to layers
    const capabilitiesByLayer: Record<LayerType, number> = {
      GOVERNANCE: 0,
      PLATFORM: 0,
      CONSUMPTION: 0,
      OVERSIGHT: 0,
    };

    for (const capability of control.capabilities) {
      // Determine target layer
      const targetLayer = mapCapabilityToLayer(capability);
      const layerId = layerIdMap.get(targetLayer)!;

      // Only update if not already assigned
      if (!capability.layerId) {
        await prisma.capability.update({
          where: { id: capability.id },
          data: { layerId },
        });
        capabilitiesByLayer[targetLayer]++;
        totalCapabilitiesMigrated++;

        // Step 3: Generate tests for this capability
        const testsCreated = await generateTestsForCapability(
          capability.id,
          capability.name,
          targetLayer
        );
        totalTestsCreated += testsCreated;
      }
    }

    // Log capability distribution
    const distribution = Object.entries(capabilitiesByLayer)
      .filter(([_, count]) => count > 0)
      .map(([layer, count]) => `${layer}: ${count}`)
      .join(', ');

    if (distribution) {
      console.log(`   📦 Assigned capabilities: ${distribution}`);
    }
  }

  // Update layer statistics
  console.log('\n📊 Updating layer statistics...');

  const allLayers = await prisma.controlLayer.findMany();
  for (const layer of allLayers) {
    const capabilities = await prisma.capability.findMany({
      where: { layerId: layer.id },
      include: { tests: true },
    });

    let testsPassed = 0;
    let testsTotal = 0;

    for (const capability of capabilities) {
      for (const test of capability.tests) {
        if (test.result === 'NOT_APPLICABLE') continue;
        testsTotal++;
        if (test.result === 'PASS') testsPassed++;
      }
    }

    const protectionScore =
      testsTotal > 0 ? Math.round((testsPassed / testsTotal) * 100) : 0;

    await prisma.controlLayer.update({
      where: { id: layer.id },
      data: {
        testsPassed,
        testsTotal,
        protectionScore,
      },
    });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 MIGRATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`   📋 Controls processed: ${controls.length}`);
  console.log(`   📦 Layers created: ${totalLayersCreated}`);
  console.log(`   🔗 Capabilities migrated: ${totalCapabilitiesMigrated}`);
  console.log(`   🧪 Tests generated: ${totalTestsCreated}`);
  console.log('='.repeat(50));

  return {
    controlsProcessed: controls.length,
    layersCreated: totalLayersCreated,
    capabilitiesMigrated: totalCapabilitiesMigrated,
    testsGenerated: totalTestsCreated,
  };
}

/**
 * Verify migration was successful
 */
export async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');

  const controls = await prisma.control.findMany({
    include: {
      layers: {
        include: {
          capabilities: {
            include: { tests: true },
          },
        },
      },
      capabilities: true,
    },
  });

  let issues = 0;

  for (const control of controls) {
    // Check layers
    if (control.layers.length !== 4) {
      console.log(`⚠️ ${control.controlId}: Has ${control.layers.length} layers (expected 4)`);
      issues++;
    }

    // Check capabilities are assigned
    const unassigned = control.capabilities.filter((c) => !c.layerId);
    if (unassigned.length > 0) {
      console.log(`⚠️ ${control.controlId}: ${unassigned.length} capabilities not assigned to layers`);
      issues++;
    }
  }

  if (issues === 0) {
    console.log('✅ Migration verification passed!');
  } else {
    console.log(`\n⚠️ Found ${issues} issues that need attention`);
  }

  return issues;
}

// Run directly if executed as script
if (require.main === module) {
  migrateToFourLayerModel()
    .then(async (result) => {
      console.log('\n📋 Running verification...');
      await verifyMigration();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
