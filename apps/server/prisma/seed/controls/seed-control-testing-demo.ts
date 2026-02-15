/**
 * Control Testing Demo Data
 *
 * Seeds demo data for testing the control testing flow (Four-Layer Framework):
 * 1. Ensures selected controls have 4 ControlLayers (creates if missing).
 * 2. Generates LayerTests from LayerTestTemplates for each layer.
 * 3. Assigns a default owner to layers so "My Testing Dashboard" shows them.
 * 4. Creates sample LayerTestExecution records (PASS, PARTIAL, FAIL) so the UI
 *    shows execution history, protection scores, and due/overdue states.
 *
 * Run standalone: npx ts-node prisma/seed/controls/seed-control-testing-demo.ts
 * Or as part of full seed (after seedLayerTestTemplates).
 */

import { PrismaClient, LayerType, TestFrequency, TestResult } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_LAYER_ROLES: Record<LayerType, string> = {
  GOVERNANCE: 'GRC Team',
  PLATFORM: 'IT Security',
  CONSUMPTION: 'IT Operations',
  OVERSIGHT: 'Security Operations',
};

const DEFAULT_LAYER_FREQUENCIES: Record<LayerType, TestFrequency> = {
  GOVERNANCE: 'QUARTERLY',
  PLATFORM: 'MONTHLY',
  CONSUMPTION: 'MONTHLY',
  OVERSIGHT: 'QUARTERLY',
};

/** Control IDs to ensure have full demo data (ISO 27001:2022 Annex A examples) */
const DEMO_CONTROL_IDS = ['5.12', '5.1', '8.1', '5.2', '6.1'];

export async function seedControlTestingDemo(): Promise<{
  controlsProcessed: number;
  layersCreated: number;
  testsCreated: number;
  executionsCreated: number;
}> {
  console.log('🧪 Seeding control testing demo data...\n');

  const org = await prisma.organisationProfile.findFirst();
  if (!org) {
    console.warn('   ⚠️ No organisation found. Create an organisation first (run full seed).');
    return { controlsProcessed: 0, layersCreated: 0, testsCreated: 0, executionsCreated: 0 };
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    console.warn('   ⚠️ No user found. Create a user first.');
    return { controlsProcessed: 0, layersCreated: 0, testsCreated: 0, executionsCreated: 0 };
  }

  // Find controls for this org (by controlId in our demo list, or any controls if those don't exist)
  let controls = await prisma.control.findMany({
    where: { organisationId: org.id, enabled: true },
    include: { layers: { include: { tests: true } } },
  });

  if (controls.length === 0) {
    console.log('   📋 No controls found. Creating minimal demo controls...');
    for (const controlId of DEMO_CONTROL_IDS.slice(0, 3)) {
      const name =
        controlId === '5.12'
          ? 'Classification of information'
          : controlId === '5.1'
            ? 'Policies for information security'
            : controlId === '8.1'
              ? 'Screening'
              : `Control ${controlId}`;
      await prisma.control.create({
        data: {
          controlId,
          name,
          theme: 'ORGANISATIONAL',
          framework: 'ISO',
          sourceStandard: 'ISO 27001:2022 Annex A',
          organisationId: org.id,
          applicable: true,
          enabled: true,
          createdById: user.id,
        },
      });
    }
    controls = await prisma.control.findMany({
      where: { organisationId: org.id, enabled: true },
      include: { layers: { include: { tests: true } } },
    });
  }

  // Prefer controls that match DEMO_CONTROL_IDS so 5.12 is included when present
  const ordered = [
    ...controls.filter((c) => DEMO_CONTROL_IDS.includes(c.controlId)),
    ...controls.filter((c) => !DEMO_CONTROL_IDS.includes(c.controlId)),
  ].slice(0, 5);

  let layersCreated = 0;
  let testsCreated = 0;
  let executionsCreated = 0;

  for (const control of ordered) {
    console.log(`   📌 ${control.controlId} - ${control.name}`);

    // 1. Ensure 4 layers exist
    const layerTypes: LayerType[] = ['GOVERNANCE', 'PLATFORM', 'CONSUMPTION', 'OVERSIGHT'];
    const layerIdMap = new Map<LayerType, string>();

    for (const layerType of layerTypes) {
      const existing = control.layers.find((l) => l.layer === layerType);
      if (existing) {
        layerIdMap.set(layerType, existing.id);
      } else {
        const newLayer = await prisma.controlLayer.create({
          data: {
            controlId: control.id,
            layer: layerType,
            defaultOwnerRole: DEFAULT_LAYER_ROLES[layerType],
            testFrequency: DEFAULT_LAYER_FREQUENCIES[layerType],
            defaultOwnerId: user.id,
            createdById: user.id,
          },
        });
        layerIdMap.set(layerType, newLayer.id);
        layersCreated++;
      }
    }

    // 2. Generate LayerTests from templates for each layer
    for (const layerType of layerTypes) {
      const layerId = layerIdMap.get(layerType)!;
      const layer = await prisma.controlLayer.findUnique({
        where: { id: layerId },
        include: { control: { select: { controlId: true } }, tests: true },
      });
      if (!layer) continue;

      const templates = await prisma.layerTestTemplate.findMany({
        where: {
          layer: layerType,
          isActive: true,
          OR: [{ organisationId: null }, { organisationId: org.id }],
        },
      });

      const replacePlaceholder = (text: string | null) =>
        text?.replace(/{layer}/g, layerType).replace(/{capability}/g, layerType) || null;

      for (const template of templates) {
        const testCode = `${layer.control.controlId}-${layerType.substring(0, 3)}-${template.templateCode}`;
        const exists = layer.tests.some((t) => t.testCode === testCode);
        if (exists) continue;

        await prisma.layerTest.create({
          data: {
            layerId: layer.id,
            testCode,
            name: replacePlaceholder(template.name) || template.name,
            description: replacePlaceholder(template.description),
            preconditions: replacePlaceholder(template.preconditions),
            testSteps: replacePlaceholder(template.testSteps),
            expectedResult: replacePlaceholder(template.expectedResult),
            evidenceRequired: replacePlaceholder(template.evidenceRequired),
            evidenceTypes: template.evidenceTypes,
            samplingMethod: template.samplingMethod,
            estimatedDuration: template.estimatedDuration,
            templateId: template.id,
            createdById: user.id,
          },
        });
        testsCreated++;
      }
    }

    // 3. Create sample executions for the first control only (so we have one control with history)
    if (control.id !== ordered[0].id) continue;

    const layersWithTests = await prisma.controlLayer.findMany({
      where: { controlId: control.id },
      include: { tests: true },
    });

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    for (const layer of layersWithTests) {
      const tests = layer.tests.slice(0, 2);
      const results: TestResult[] = ['PASS', 'PASS', 'PARTIAL', 'FAIL'];
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const result = results[i % results.length];
        const executionDate = new Date(oneMonthAgo);
        executionDate.setDate(executionDate.getDate() + i * 5);

        await prisma.layerTestExecution.create({
          data: {
            testId: test.id,
            testerId: user.id,
            executionDate,
            result,
            findings: result === 'FAIL' ? 'Control not applied consistently.' : result === 'PARTIAL' ? 'Minor gaps in documentation.' : null,
            recommendations: result !== 'PASS' ? 'Re-test after remediation.' : null,
            durationMinutes: 15 + i * 5,
            samplesReviewed: 3,
            periodStart: executionDate,
            periodEnd: executionDate,
          },
        });
        executionsCreated++;

        await prisma.layerTest.update({
          where: { id: test.id },
          data: {
            status: 'COMPLETED',
            result,
            lastTestedAt: executionDate,
            lastTesterId: user.id,
            findings: result === 'FAIL' ? 'Control not applied consistently.' : result === 'PARTIAL' ? 'Minor gaps in documentation.' : null,
            recommendations: result !== 'PASS' ? 'Re-test after remediation.' : null,
          },
        });
      }

      // Recalculate layer stats
      const layerTests = await prisma.layerTest.findMany({ where: { layerId: layer.id } });
      let passed = 0;
      let total = 0;
      for (const t of layerTests) {
        if (t.result === 'NOT_APPLICABLE') continue;
        total++;
        if (t.result === 'PASS') passed++;
        else if (t.result === 'PARTIAL') passed += 0.5;
      }
      const protectionScore = total > 0 ? Math.round((passed / total) * 100) : 0;
      const lastTested = layerTests.filter((t) => t.lastTestedAt).sort((a, b) => (b.lastTestedAt!.getTime() - a.lastTestedAt!.getTime()))[0]?.lastTestedAt;

      await prisma.controlLayer.update({
        where: { id: layer.id },
        data: {
          testsPassed: Math.floor(passed),
          testsTotal: total,
          protectionScore,
          lastTestedAt: lastTested ?? null,
          nextTestDue: lastTested ? (() => {
            const next = new Date(lastTested);
            next.setDate(next.getDate() + (layer.testFrequency === 'MONTHLY' ? 30 : 90));
            return next;
          })() : new Date(),
        },
      });
    }
  }

  console.log(`\n   ✅ Control testing demo: ${ordered.length} controls, ${layersCreated} layers created, ${testsCreated} tests created, ${executionsCreated} executions created.`);
  return {
    controlsProcessed: ordered.length,
    layersCreated,
    testsCreated,
    executionsCreated,
  };
}

if (require.main === module) {
  seedControlTestingDemo()
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
