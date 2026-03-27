/**
 * Control Activities Seed Data
 *
 * Seeds sample ControlActivity records for existing controls.
 * Activities group tests within a layer by functional activity type.
 *
 * Run standalone: npx ts-node prisma/seed/controls/seed-control-activities.ts
 */

import { PrismaClient, LayerType, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

const LAYER_ACTIVITY_TEMPLATES: Record<
  LayerType,
  Array<{ name: string; activityType: ActivityType }>
> = {
  GOVERNANCE: [
    { name: 'Policy Documentation & Approval', activityType: 'PROCESS' },
    { name: 'Standards & Guidelines', activityType: 'PROCESS' },
    { name: 'RACI Assignment', activityType: 'PEOPLE' },
  ],
  PLATFORM: [
    { name: 'Technical Configuration', activityType: 'TECHNOLOGY' },
    { name: 'Automated Enforcement', activityType: 'TECHNOLOGY' },
    { name: 'Integration Testing', activityType: 'PROCESS' },
  ],
  CONSUMPTION: [
    { name: 'User Training & Awareness', activityType: 'PEOPLE' },
    { name: 'Process Adherence Monitoring', activityType: 'PROCESS' },
    { name: 'Exception Management', activityType: 'PROCESS' },
  ],
  OVERSIGHT: [
    { name: 'Performance Monitoring', activityType: 'TECHNOLOGY' },
    { name: 'Management Review', activityType: 'PROCESS' },
    { name: 'Continuous Improvement', activityType: 'PROCESS' },
  ],
};

const LAYER_PREFIX_MAP: Record<LayerType, string> = {
  GOVERNANCE: 'GOV',
  PLATFORM: 'PLAT',
  CONSUMPTION: 'CONS',
  OVERSIGHT: 'OVR',
};

export async function seedControlActivities(prisma: PrismaClient): Promise<{
  activitiesCreated: number;
  layersProcessed: number;
}> {
  console.log('🏃 Seeding control activities...\n');

  const org = await prisma.organisationProfile.findFirst();
  if (!org) {
    console.warn('   ⚠️ No organisation found. Skipping control activities seed.');
    return { activitiesCreated: 0, layersProcessed: 0 };
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    console.warn('   ⚠️ No user found. Skipping control activities seed.');
    return { activitiesCreated: 0, layersProcessed: 0 };
  }

  // Find controls with layers (limit to first 5)
  const controls = await prisma.control.findMany({
    where: {
      organisationId: org.id,
      enabled: true,
      layers: {
        some: {},
      },
    },
    include: {
      layers: {
        include: {
          activities: true,
        },
      },
    },
    take: 5,
  });

  if (controls.length === 0) {
    console.warn('   ⚠️ No controls with layers found. Run control testing seed first.');
    return { activitiesCreated: 0, layersProcessed: 0 };
  }

  let activitiesCreated = 0;
  let layersProcessed = 0;

  for (const control of controls) {
    console.log(`   📌 ${control.controlId} - ${control.name}`);

    for (const layer of control.layers) {
      const templates = LAYER_ACTIVITY_TEMPLATES[layer.layer];
      const layerPrefix = LAYER_PREFIX_MAP[layer.layer];

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const activityNum = String(i + 1).padStart(2, '0');
        const activityId = `${control.controlId}-${layerPrefix}-A${activityNum}`;

        // Check if activity already exists
        const existing = layer.activities.find((a) => a.activityId === activityId);
        if (existing) {
          continue;
        }

        // Create activity
        await prisma.controlActivity.upsert({
          where: {
            activityId_layerId: {
              activityId,
              layerId: layer.id,
            },
          },
          update: {},
          create: {
            activityId,
            layerId: layer.id,
            name: template.name,
            activityType: template.activityType,
            description: `${template.name} for ${layer.layer.toLowerCase()} layer of ${control.name}`,
            sortOrder: i,
            createdById: user.id,
          },
        });

        activitiesCreated++;
      }

      layersProcessed++;
    }
  }

  console.log(
    `\n   ✅ Control activities: ${activitiesCreated} activities created across ${layersProcessed} layers.`
  );
  return { activitiesCreated, layersProcessed };
}

if (require.main === module) {
  seedControlActivities(prisma)
    .then((r) => {
      console.log('\n✅ Done:', r);
      process.exit(0);
    })
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
