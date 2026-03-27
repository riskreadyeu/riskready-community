/**
 * GRC Data Import Script
 *
 * Imports data from CSV files at .temp/grc-import/
 * Strategy: Replace existing data while keeping Threats, Loss Magnitude, and Industry Multipliers
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const IMPORT_DIR = path.join(process.cwd(), '../../.temp/grc-import');

// Helper to parse CSV file
function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

// Helper to convert string to boolean
function toBool(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

// Helper to convert string to number or null
function toNumber(value: string | undefined): number | null {
  if (!value || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Helper to convert string to date or null
function toDate(value: string | undefined): Date | null {
  if (!value || value === '') return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Parse framework string to get primary framework
function parsePrimaryFramework(frameworks: string | undefined): 'ISO' | 'SOC2' | 'NIS2' | 'DORA' {
  if (!frameworks) return 'ISO';
  const first = frameworks.split(';')[0].trim().toUpperCase();
  if (['ISO', 'SOC2', 'NIS2', 'DORA'].includes(first)) {
    return first as 'ISO' | 'SOC2' | 'NIS2' | 'DORA';
  }
  return 'ISO';
}

// Map review frequency values to enum
function mapReviewFrequency(value: string | undefined): 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL' | 'ON_CHANGE' | 'AS_NEEDED' {
  if (!value) return 'QUARTERLY';
  const upper = value.toUpperCase();
  const mapping: Record<string, string> = {
    'ANNUALLY': 'ANNUAL',
    'ANNUAL': 'ANNUAL',
    'DAILY': 'MONTHLY', // Map DAILY to MONTHLY (closest available)
    'WEEKLY': 'MONTHLY', // Map WEEKLY to MONTHLY (closest available)
    'MONTHLY': 'MONTHLY',
    'QUARTERLY': 'QUARTERLY',
    'SEMI_ANNUAL': 'SEMI_ANNUAL',
    'BIENNIAL': 'BIENNIAL',
    'TRIENNIAL': 'TRIENNIAL',
    'ON_CHANGE': 'ON_CHANGE',
    'AS_NEEDED': 'AS_NEEDED',
  };
  return (mapping[upper] || 'QUARTERLY') as any;
}

async function importGovernanceRoles(orgId: string) {
  console.log('Importing governance roles...');
  const filePath = path.join(IMPORT_DIR, 'risk/14_risk_governance_roles.csv');
  const data = parseCSV<any>(filePath);

  // Delete existing
  await prisma.rACIAssignment.deleteMany({});
  await prisma.riskGovernanceRole.deleteMany({});

  for (const row of data) {
    await prisma.riskGovernanceRole.create({
      data: {
        roleCode: row.roleCode,
        name: row.name,
        description: row.description || null,
        responsibilities: row.responsibilities || null,
        sortOrder: toNumber(row.sortOrder) || 0,
        isActive: toBool(row.isActive),
      },
    });
  }
  console.log(`  Imported ${data.length} governance roles`);
}

async function importEscalationLevels() {
  console.log('Importing escalation levels...');
  const filePath = path.join(IMPORT_DIR, 'risk/16_escalation_levels.csv');
  const data = parseCSV<any>(filePath);

  // Delete existing
  await prisma.escalationLevel.deleteMany({});

  // Get role mappings
  const roles = await prisma.riskGovernanceRole.findMany();
  const roleMap = new Map(roles.map(r => [r.roleCode, r.id]));

  for (const row of data) {
    await prisma.escalationLevel.create({
      data: {
        levelCode: row.levelCode,
        name: row.name,
        scoreRangeMin: toNumber(row.scoreRangeMin) || 0,
        scoreRangeMax: toNumber(row.scoreRangeMax) || 25,
        escalationTargetId: roleMap.get(row.escalationTarget) || null,
        responseTimeHours: toNumber(row.responseTimeHours) || 24,
        reviewFrequency: mapReviewFrequency(row.reviewFrequency),
        reportingFrequency: mapReviewFrequency(row.reportingFrequency),
        approvalRequired: toBool(row.approvalRequired),
        boardNotification: toBool(row.boardNotification),
        immediateAction: toBool(row.immediateAction),
        colorCode: row.colorCode || null,
      },
    });
  }
  console.log(`  Imported ${data.length} escalation levels`);
}

async function importControls(orgId: string) {
  console.log('Importing controls...');
  const filePath = path.join(IMPORT_DIR, 'controls/01_controls.csv');
  const data = parseCSV<any>(filePath);

  // Delete existing controls for this org
  await prisma.control.deleteMany({ where: { organisationId: orgId } });

  for (const row of data) {
    await prisma.control.create({
      data: {
        controlId: row.controlId,
        name: row.name,
        theme: row.theme || 'ORGANISATIONAL',
        description: row.description || null,
        framework: row.framework || 'ISO',
        sourceStandard: row.sourceStandard || null,
        applicable: toBool(row.applicable) !== false, // default true
        implementationStatus: row.implementationStatus || 'NOT_STARTED',
        implementationDesc: row.implementationDesc || null,
        soc2Criteria: row.soc2Criteria || null,
        tscCategory: row.tscCategory || null,
        organisationId: orgId,
      },
    });
  }
  console.log(`  Imported ${data.length} controls`);
}

async function importRisks(orgId: string) {
  console.log('Importing risks...');
  const filePath = path.join(IMPORT_DIR, 'risk/01_risks.csv');
  const data = parseCSV<any>(filePath);

  // Delete existing risks (cascades to scenarios, KRIs, etc.)
  await prisma.risk.deleteMany({ where: { organisationId: orgId } });

  for (const row of data) {
    await prisma.risk.create({
      data: {
        riskId: row.riskId,
        title: row.title,
        description: row.description || null,
        tier: row.tier || 'CORE',
        orgSize: row.orgSize || null,
        status: row.status || 'IDENTIFIED',
        framework: parsePrimaryFramework(row.framework),
        soc2Criteria: row.soc2Criteria || null,
        tscCategory: row.tscCategory || null,
        riskOwner: row.riskOwner || null,
        treatmentPlan: row.treatmentPlan || null,
        acceptanceCriteria: row.acceptanceCriteria || null,
        organisationId: orgId,
      },
    });
  }
  console.log(`  Imported ${data.length} risks`);
}

async function importScenarios(orgId: string) {
  console.log('Importing risk scenarios...');
  const filePath = path.join(IMPORT_DIR, 'risk/02_risk_scenarios.csv');
  const data = parseCSV<any>(filePath);

  // Get risk mappings
  const risks = await prisma.risk.findMany({ where: { organisationId: orgId } });
  const riskMap = new Map(risks.map(r => [r.riskId, r.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const riskDbId = riskMap.get(row.riskId);
    if (!riskDbId) {
      console.warn(`  Warning: Risk ${row.riskId} not found for scenario ${row.scenarioId}`);
      skipped++;
      continue;
    }

    await prisma.riskScenario.create({
      data: {
        scenarioId: row.scenarioId,
        title: row.title,
        cause: row.cause || null,
        event: row.event || null,
        consequence: row.consequence || null,
        status: row.status || 'DRAFT',
        framework: parsePrimaryFramework(row.framework),
        likelihood: row.likelihood || null,
        impact: row.impact || null,
        inherentScore: toNumber(row.inherentScore),
        residualLikelihood: row.residualLikelihood || null,
        residualImpact: row.residualImpact || null,
        residualScore: toNumber(row.residualScore),
        toleranceThreshold: toNumber(row.toleranceThreshold),
        toleranceStatus: row.toleranceStatus || null,
        riskId: riskDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} scenarios (${skipped} skipped)`);
}

async function importKRIs(orgId: string) {
  console.log('Importing KRIs...');
  const filePath = path.join(IMPORT_DIR, 'risk/08_key_risk_indicators.csv');
  const data = parseCSV<any>(filePath);

  // Get risk mappings
  const risks = await prisma.risk.findMany({ where: { organisationId: orgId } });
  const riskMap = new Map(risks.map(r => [r.riskId, r.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const riskDbId = riskMap.get(row.riskId);
    if (!riskDbId) {
      console.warn(`  Warning: Risk ${row.riskId} not found for KRI ${row.kriId}`);
      skipped++;
      continue;
    }

    await prisma.keyRiskIndicator.create({
      data: {
        kriId: row.kriId,
        name: row.name,
        description: row.description || null,
        formula: row.formula || null,
        unit: row.unit || '%',
        thresholdGreen: row.thresholdGreen || null,
        thresholdAmber: row.thresholdAmber || null,
        thresholdRed: row.thresholdRed || null,
        frequency: row.frequency || 'MONTHLY',
        dataSource: row.dataSource || null,
        automated: toBool(row.automated),
        tier: row.tier || 'CORE',
        currentValue: row.currentValue || null,
        status: row.status || null,
        trend: row.trend || null,
        riskId: riskDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} KRIs (${skipped} skipped)`);
}

async function importRTS(orgId: string) {
  console.log('Importing Risk Tolerance Statements...');
  const filePath = path.join(IMPORT_DIR, 'risk/10_risk_tolerance_statements.csv');
  const data = parseCSV<any>(filePath);

  // Delete existing
  await prisma.riskToleranceStatement.deleteMany({ where: { organisationId: orgId } });

  for (const row of data) {
    await prisma.riskToleranceStatement.create({
      data: {
        rtsId: row.rtsId,
        title: row.title,
        objective: row.objective || '',
        domain: row.domain || null,
        proposedToleranceLevel: mapToleranceLevel(row.proposedToleranceLevel),
        proposedRTS: row.proposedRTS || '',
        anticipatedOperationalImpact: row.anticipatedOperationalImpact || null,
        rationale: row.rationale || null,
        status: row.status || 'DRAFT',
        framework: parsePrimaryFramework(row.framework),
        effectiveDate: toDate(row.effectiveDate),
        reviewDate: toDate(row.reviewDate),
        organisationId: orgId,
      },
    });
  }
  console.log(`  Imported ${data.length} RTS`);
}

async function importTreatmentPlans(orgId: string) {
  console.log('Importing treatment plans...');
  const filePath = path.join(IMPORT_DIR, 'risk/11_treatment_plans.csv');
  const data = parseCSV<any>(filePath);

  // Get risk and scenario mappings
  const risks = await prisma.risk.findMany({ where: { organisationId: orgId } });
  const riskMap = new Map(risks.map(r => [r.riskId, r.id]));

  const scenarios = await prisma.riskScenario.findMany({
    where: { risk: { organisationId: orgId } },
  });
  const scenarioMap = new Map(scenarios.map(s => [s.scenarioId, s.id]));

  // Delete existing
  await prisma.treatmentPlan.deleteMany({ where: { organisationId: orgId } });

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const riskDbId = riskMap.get(row.riskId);
    if (!riskDbId) {
      console.warn(`  Warning: Risk ${row.riskId} not found for treatment ${row.treatmentId}`);
      skipped++;
      continue;
    }

    const scenarioDbId = row.scenarioId ? scenarioMap.get(row.scenarioId) : null;

    await prisma.treatmentPlan.create({
      data: {
        treatmentId: row.treatmentId,
        title: row.title,
        description: row.description || '',
        treatmentType: row.treatmentType || 'MITIGATE',
        priority: row.priority || 'MEDIUM',
        status: row.status || 'DRAFT',
        targetResidualScore: toNumber(row.targetResidualScore),
        currentResidualScore: toNumber(row.currentResidualScore),
        expectedReduction: toNumber(row.expectedReduction),
        estimatedCost: row.estimatedCost ? parseFloat(row.estimatedCost) : null,
        targetStartDate: toDate(row.targetStartDate),
        targetEndDate: toDate(row.targetEndDate),
        riskId: riskDbId,
        scenarioId: scenarioDbId,
        organisationId: orgId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} treatment plans (${skipped} skipped)`);
}

async function importTreatmentActions(orgId: string) {
  console.log('Importing treatment actions...');
  const filePath = path.join(IMPORT_DIR, 'risk/12_treatment_actions.csv');
  const data = parseCSV<any>(filePath);

  // Get treatment plan mappings
  const plans = await prisma.treatmentPlan.findMany({ where: { organisationId: orgId } });
  const planMap = new Map(plans.map(p => [p.treatmentId, p.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const planDbId = planMap.get(row.treatmentId);
    if (!planDbId) {
      console.warn(`  Warning: Treatment plan ${row.treatmentId} not found for action ${row.actionId}`);
      skipped++;
      continue;
    }

    await prisma.treatmentAction.create({
      data: {
        actionId: row.actionId,
        title: row.title,
        description: row.description || null,
        status: row.status || 'NOT_STARTED',
        priority: row.priority || 'MEDIUM',
        dueDate: toDate(row.dueDate),
        estimatedHours: toNumber(row.estimatedHours),
        completionNotes: row.completionNotes || null,
        blockerNotes: row.blockerNotes || null,
        treatmentPlanId: planDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} treatment actions (${skipped} skipped)`);
}

async function importRACIAssignments() {
  console.log('Importing RACI assignments...');
  const filePath = path.join(IMPORT_DIR, 'risk/15_raci_assignments.csv');
  const data = parseCSV<any>(filePath);

  // Get role mappings
  const roles = await prisma.riskGovernanceRole.findMany();
  const roleMap = new Map(roles.map(r => [r.roleCode, r.id]));

  // Create activities and assignments
  const activityMap = new Map<string, string>();

  // First pass: create activities
  const activities = new Set<string>();
  for (const row of data) {
    const key = `${row.activityCode}|${row.activityName}|${row.phase}`;
    activities.add(key);
  }

  // Delete existing activities
  await prisma.riskGovernanceActivity.deleteMany({});

  for (const key of activities) {
    const [code, name, phase] = key.split('|');
    const validPhases = ['GOVERNANCE', 'ASSESSMENT', 'TREATMENT'];
    const mappedPhase = validPhases.includes(phase) ? phase : 'GOVERNANCE';
    const activity = await prisma.riskGovernanceActivity.create({
      data: {
        activityCode: code,
        name: name,
        phase: mappedPhase as 'GOVERNANCE' | 'ASSESSMENT' | 'TREATMENT',
      },
    });
    activityMap.set(code, activity.id);
  }

  // Second pass: create RACI assignments
  let imported = 0;
  for (const row of data) {
    const activityId = activityMap.get(row.activityCode);
    const roleId = roleMap.get(row.roleCode);

    if (!activityId || !roleId) {
      console.warn(`  Warning: Missing activity or role for RACI: ${row.activityCode} / ${row.roleCode}`);
      continue;
    }

    await prisma.rACIAssignment.create({
      data: {
        activityId,
        roleId,
        raciType: row.raciType || 'INFORMED',
        notes: row.notes || null,
      },
    });
    imported++;
  }
  console.log(`  Imported ${activities.size} activities and ${imported} RACI assignments`);
}

async function importKRIHistory(orgId: string) {
  console.log('Importing KRI history...');
  const filePath = path.join(IMPORT_DIR, 'risk/09_kri_history.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No KRI history file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get KRI mappings
  const kris = await prisma.keyRiskIndicator.findMany({
    where: { risk: { organisationId: orgId } },
  });
  const kriMap = new Map(kris.map(k => [k.kriId, k.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const kriDbId = kriMap.get(row.kriId);
    if (!kriDbId) {
      skipped++;
      continue;
    }

    const status = mapKRIStatus(row.status);
    if (!status) {
      skipped++;
      continue;
    }

    await prisma.kRIHistory.create({
      data: {
        value: row.value || '',
        status: status,
        measuredAt: toDate(row.measuredAt) || new Date(),
        measuredBy: row.measuredBy || null,
        notes: row.notes || null,
        kriId: kriDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} KRI history entries (${skipped} skipped)`);
}

function mapKRIStatus(value: string | undefined): 'GREEN' | 'AMBER' | 'RED' | 'NOT_MEASURED' | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (['GREEN', 'AMBER', 'RED', 'NOT_MEASURED'].includes(upper)) {
    return upper as any;
  }
  return 'NOT_MEASURED';
}

function mapToleranceLevel(value: string | undefined): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (!value) return 'MEDIUM';
  const upper = value.toUpperCase();
  // Map risk appetite descriptors to tolerance levels
  const mapping: Record<string, string> = {
    'HIGH': 'HIGH',
    'MEDIUM': 'MEDIUM',
    'LOW': 'LOW',
    'AVERSE': 'LOW', // Risk averse = low tolerance
    'SEEKING': 'HIGH', // Risk seeking = high tolerance
    'NEUTRAL': 'MEDIUM',
    'CAUTIOUS': 'LOW',
    'AGGRESSIVE': 'HIGH',
    'VERY_HIGH': 'HIGH',
    'VERY_LOW': 'LOW',
  };
  return (mapping[upper] || 'MEDIUM') as any;
}

async function importReassessmentTriggers() {
  console.log('Importing reassessment triggers...');
  const filePath = path.join(IMPORT_DIR, 'risk/17_reassessment_triggers.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No reassessment triggers file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Delete existing
  await prisma.reassessmentTrigger.deleteMany({});

  for (const row of data) {
    await prisma.reassessmentTrigger.create({
      data: {
        triggerCode: row.triggerCode,
        name: row.name,
        description: row.description || null,
        category: row.category || 'INCIDENT',
        conditionLogic: row.conditionLogic || null,
        thresholdValue: row.thresholdValue || null,
        reassessmentScope: row.reassessmentScope || null,
        reassessmentDepth: row.reassessmentDepth || null,
        priorityLevel: toNumber(row.priorityLevel) || 2,
        isAutomatic: toBool(row.isAutomatic),
        notifyRoles: row.notifyRoles ? JSON.parse(row.notifyRoles.replace(/'/g, '"')) : [],
        isActive: toBool(row.isActive) !== false,
      },
    });
  }
  console.log(`  Imported ${data.length} reassessment triggers`);
}

async function importScenarioControls(orgId: string) {
  console.log('Importing scenario-control links...');
  const filePath = path.join(IMPORT_DIR, 'risk/03_risk_scenario_controls.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No scenario-control file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get mappings
  const scenarios = await prisma.riskScenario.findMany({
    where: { risk: { organisationId: orgId } },
  });
  const scenarioMap = new Map(scenarios.map(s => [s.scenarioId, s.id]));

  const controls = await prisma.control.findMany({ where: { organisationId: orgId } });
  const controlMap = new Map(controls.map(c => [c.controlId, c.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const scenarioDbId = scenarioMap.get(row.scenarioId);
    const controlDbId = controlMap.get(row.controlId);

    if (!scenarioDbId || !controlDbId) {
      skipped++;
      continue;
    }

    try {
      await prisma.riskScenarioControl.create({
        data: {
          scenarioId: scenarioDbId,
          controlId: controlDbId,
          effectivenessWeight: toNumber(row.effectivenessWeight) || 100,
          isPrimaryControl: toBool(row.isPrimaryControl),
          notes: row.notes || null,
        },
      });
      imported++;
    } catch (e: any) {
      // Skip duplicates
      if (!e.message?.includes('Unique constraint')) {
        throw e;
      }
    }
  }
  console.log(`  Imported ${imported} scenario-control links (${skipped} skipped)`);
}

async function importControlDomains() {
  console.log('Importing control domains...');
  const filePath = path.join(IMPORT_DIR, 'controls/09_control_domains.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No control domains file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Delete existing
  await prisma.controlDomain.deleteMany({});

  for (const row of data) {
    await prisma.controlDomain.create({
      data: {
        name: row.name,
        description: row.description || null,
        sortOrder: toNumber(row.sortOrder) || 0,
        isoControls: row.isoControls || null,
        soc2Criteria: row.soc2Criteria || null,
        nis2Articles: row.nis2Articles || null,
        doraArticles: row.doraArticles || null,
      },
    });
  }
  console.log(`  Imported ${data.length} control domains`);
}

async function importCapabilities(orgId: string) {
  console.log('Importing capabilities...');
  const filePath = path.join(IMPORT_DIR, 'controls/02_capabilities.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No capabilities file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get control mappings
  const controls = await prisma.control.findMany({ where: { organisationId: orgId } });
  const controlMap = new Map(controls.map(c => [c.controlId, c.id]));

  // Delete existing capabilities
  await prisma.capability.deleteMany({
    where: { control: { organisationId: orgId } },
  });

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const controlDbId = controlMap.get(row.controlId);
    if (!controlDbId) {
      skipped++;
      continue;
    }

    await prisma.capability.create({
      data: {
        capabilityId: row.capabilityId,
        name: row.name,
        type: row.type || 'PROCESS',
        description: row.description || null,
        testCriteria: row.testCriteria || '',
        evidenceRequired: row.evidenceRequired || '',
        maxMaturityLevel: toNumber(row.maxMaturityLevel) || 5,
        dependsOn: row.dependsOn || null,
        l1Criteria: row.l1Criteria || null,
        l1Evidence: row.l1Evidence || null,
        l2Criteria: row.l2Criteria || null,
        l2Evidence: row.l2Evidence || null,
        l3Criteria: row.l3Criteria || null,
        l3Evidence: row.l3Evidence || null,
        l4Criteria: row.l4Criteria || null,
        l4Evidence: row.l4Evidence || null,
        l5Criteria: row.l5Criteria || null,
        l5Evidence: row.l5Evidence || null,
        designTestCriteria: row.designTestCriteria || null,
        designEvidenceRequired: row.designEvidenceRequired || null,
        implementationTestCriteria: row.implementationTestCriteria || null,
        implementationEvidenceRequired: row.implementationEvidenceRequired || null,
        operatingTestCriteria: row.operatingTestCriteria || null,
        operatingEvidenceRequired: row.operatingEvidenceRequired || null,
        controlId: controlDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} capabilities (${skipped} skipped)`);
}

function mapCollectionFrequency(value: string | undefined): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'PER_EVENT' | 'PER_INCIDENT' {
  if (!value) return 'QUARTERLY';
  const upper = value.toUpperCase();
  if (['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'PER_EVENT', 'PER_INCIDENT'].includes(upper)) {
    return upper as any;
  }
  // Map common alternatives
  if (upper === 'ON_DEMAND' || upper === 'AS_NEEDED') return 'PER_EVENT';
  return 'QUARTERLY';
}

function mapRAGStatus(value: string | undefined): 'GREEN' | 'AMBER' | 'RED' | 'NOT_MEASURED' | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (['GREEN', 'AMBER', 'RED', 'NOT_MEASURED'].includes(upper)) {
    return upper as any;
  }
  // Map UNKNOWN to NOT_MEASURED
  if (upper === 'UNKNOWN') return 'NOT_MEASURED';
  return 'NOT_MEASURED';
}

function mapTrend(value: string | undefined): 'IMPROVING' | 'STABLE' | 'DECLINING' | 'NEW' | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (['IMPROVING', 'STABLE', 'DECLINING', 'NEW'].includes(upper)) {
    return upper as any;
  }
  return 'NEW';
}

async function importCapabilityMetrics(orgId: string) {
  console.log('Importing capability metrics...');
  const filePath = path.join(IMPORT_DIR, 'controls/03_capability_metrics.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No capability metrics file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get capability mappings
  const capabilities = await prisma.capability.findMany({
    where: { control: { organisationId: orgId } },
  });
  const capabilityMap = new Map(capabilities.map(c => [c.capabilityId, c.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const capabilityDbId = capabilityMap.get(row.capabilityId);
    if (!capabilityDbId) {
      skipped++;
      continue;
    }

    await prisma.capabilityMetric.create({
      data: {
        metricId: row.metricId,
        name: row.name,
        formula: row.formula || '',
        unit: row.unit || '%',
        greenThreshold: row.greenThreshold || '>=90%',
        amberThreshold: row.amberThreshold || '70-90%',
        redThreshold: row.redThreshold || '<70%',
        collectionFrequency: mapCollectionFrequency(row.collectionFrequency),
        dataSource: row.dataSource || 'Manual',
        currentValue: row.currentValue || null,
        status: mapRAGStatus(row.status),
        trend: mapTrend(row.trend),
        owner: row.owner || null,
        notes: row.notes || null,
        capabilityId: capabilityDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} capability metrics (${skipped} skipped)`);
}

async function importCapabilityAssessments(orgId: string) {
  console.log('Importing capability assessments...');
  const filePath = path.join(IMPORT_DIR, 'controls/04_capability_assessments.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No capability assessments file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get capability mappings
  const capabilities = await prisma.capability.findMany({
    where: { control: { organisationId: orgId } },
  });
  const capabilityMap = new Map(capabilities.map(c => [c.capabilityId, c.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const capabilityDbId = capabilityMap.get(row.capabilityId);
    if (!capabilityDbId) {
      skipped++;
      continue;
    }

    await prisma.capabilityAssessment.create({
      data: {
        currentMaturity: toNumber(row.currentMaturity),
        targetMaturity: toNumber(row.targetMaturity),
        l1Met: toBool(row.l1Met),
        l2Met: toBool(row.l2Met),
        l3Met: toBool(row.l3Met),
        l4Met: toBool(row.l4Met),
        l5Met: toBool(row.l5Met),
        assessor: row.assessor || null,
        assessmentDate: toDate(row.assessmentDate),
        nextReview: toDate(row.nextReview),
        notes: row.notes || null,
        capabilityId: capabilityDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} capability assessments (${skipped} skipped)`);
}

function mapTestResult(value: string | undefined): 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_TESTED' | 'NOT_APPLICABLE' {
  if (!value) return 'NOT_TESTED';
  const upper = value.toUpperCase();
  if (['PASS', 'FAIL', 'PARTIAL', 'NOT_TESTED', 'NOT_APPLICABLE'].includes(upper)) {
    return upper as any;
  }
  return 'NOT_TESTED';
}

async function importEffectivenessTests(orgId: string) {
  console.log('Importing effectiveness tests...');
  const filePath = path.join(IMPORT_DIR, 'controls/05_effectiveness_tests.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No effectiveness tests file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get capability mappings
  const capabilities = await prisma.capability.findMany({
    where: { control: { organisationId: orgId } },
  });
  const capabilityMap = new Map(capabilities.map(c => [c.capabilityId, c.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const capabilityDbId = capabilityMap.get(row.capabilityId);
    if (!capabilityDbId) {
      skipped++;
      continue;
    }

    await prisma.capabilityEffectivenessTest.create({
      data: {
        testType: row.testType || 'DESIGN',
        testResult: mapTestResult(row.testResult),
        testDate: toDate(row.testDate),
        tester: row.tester || null,
        objective: row.objective || null,
        testSteps: row.testSteps || null,
        evidenceRequired: row.evidenceRequired || null,
        evidenceLocation: row.evidenceLocation || null,
        passCriteria: row.passCriteria || null,
        findings: row.findings || null,
        recommendations: row.recommendations || null,
        capabilityId: capabilityDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} effectiveness tests (${skipped} skipped)`);
}

async function importFrameworkCrossReferences() {
  console.log('Importing framework cross-references...');
  const filePath = path.join(IMPORT_DIR, 'controls/07_framework_cross_references.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No framework cross-references file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Delete existing
  await prisma.frameworkCrossReference.deleteMany({});

  let imported = 0;
  for (const row of data) {
    try {
      await prisma.frameworkCrossReference.create({
        data: {
          sourceFramework: row.sourceFramework || 'ISO',
          sourceControlId: row.sourceControlId,
          sourceName: row.sourceName || null,
          targetFramework: row.targetFramework || 'SOC2',
          targetControlId: row.targetControlId,
          targetName: row.targetName || null,
          mappingType: row.mappingType || 'RELATED',
          mappingStrength: toNumber(row.mappingStrength) || 100,
          notes: row.notes || null,
        },
      });
      imported++;
    } catch (e: any) {
      // Skip duplicates
      if (!e.message?.includes('Unique constraint')) {
        throw e;
      }
    }
  }
  console.log(`  Imported ${imported} framework cross-references`);
}

async function importMetricHistory(orgId: string) {
  console.log('Importing metric history...');
  const filePath = path.join(IMPORT_DIR, 'controls/08_metric_history.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No metric history file found, skipping');
    return;
  }

  const data = parseCSV<any>(filePath);

  // Get metric mappings
  const metrics = await prisma.capabilityMetric.findMany({
    where: { capability: { control: { organisationId: orgId } } },
  });
  const metricMap = new Map(metrics.map(m => [m.metricId, m.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    const metricDbId = metricMap.get(row.metricId);
    if (!metricDbId) {
      skipped++;
      continue;
    }

    const status = mapRAGStatus(row.status);
    if (!status) continue; // Skip if no valid status

    await prisma.metricHistory.create({
      data: {
        value: row.value || '',
        status: status,
        collectedAt: toDate(row.collectedAt) || new Date(),
        collectedBy: row.collectedBy || null,
        notes: row.notes || null,
        metricId: metricDbId,
      },
    });
    imported++;
  }
  console.log(`  Imported ${imported} metric history entries (${skipped} skipped)`);
}

// Threat keyword mappings for auto-linking scenarios to threats
const THREAT_KEYWORDS: Record<string, string[]> = {
  'T-CRED': ['credential', 'password', 'authentication', 'login'],
  'T-BRUTE': ['brute force', 'password spray'],
  'T-PHISH': ['phishing', 'social engineering', 'spear phishing', 'pretexting'],
  'T-SESSION': ['session', 'token', 'cookie'],
  'T-PRIVESC': ['privilege escalation', 'elevated access', 'admin rights'],
  'T-ORPHAN': ['orphan', 'dormant', 'stale account', 'abandoned'],
  'T-CREEP': ['access creep', 'excessive permission', 'accumulation'],
  'T-ACCOUNT': ['accountability', 'non-repudiation', 'audit trail'],
  'T-DATAEXP': ['data exposure', 'data leak', 'sensitive data', 'pii exposure'],
  'T-INTERCEPT': ['interception', 'man-in-the-middle', 'mitm', 'eavesdrop'],
  'T-CRYPTO': ['encryption', 'cryptographic', 'key management'],
  'T-MALWARE': ['malware', 'virus', 'ransomware', 'trojan', 'worm'],
  'T-RANSOMWARE': ['ransomware', 'extortion', 'crypto-locker'],
  'T-INJECTION': ['injection', 'sql injection', 'xss', 'command injection'],
  'T-DOS': ['denial of service', 'dos', 'ddos', 'availability'],
  'T-INSIDER': ['insider', 'employee', 'internal threat', 'disgruntled'],
  'T-VENDOR': ['vendor', 'third party', 'supply chain', 'supplier'],
  'T-CONFIG': ['misconfiguration', 'configuration error', 'hardening'],
  'T-PATCH': ['patch', 'vulnerability', 'unpatched', 'cve'],
  'T-SHADOW': ['shadow it', 'unauthorized', 'unsanctioned'],
  'T-COMPLIANCE': ['compliance', 'regulatory', 'audit', 'gdpr', 'dora', 'nis2'],
  'T-GOVERNANCE': ['governance', 'policy', 'framework', 'isms'],
  'T-BCP': ['business continuity', 'disaster', 'recovery', 'resilience'],
};

async function importScenarioThreats(orgId: string) {
  console.log('Linking scenarios to threats...');

  // Get all scenarios
  const scenarios = await prisma.riskScenario.findMany({
    where: { risk: { organisationId: orgId } },
    select: { id: true, scenarioId: true, title: true, cause: true, event: true, consequence: true },
  });

  // Get all threats
  const threats = await prisma.threatCatalog.findMany({
    where: { isActive: true },
    select: { id: true, threatId: true, name: true },
  });

  // Create threat map
  const threatMap = new Map(threats.map(t => [t.threatId, t]));

  // Clear existing links
  await prisma.riskScenarioThreat.deleteMany({});

  let linked = 0;

  for (const scenario of scenarios) {
    // Combine scenario text for matching
    const scenarioText = [
      scenario.title,
      scenario.cause,
      scenario.event,
      scenario.consequence,
    ].filter(Boolean).join(' ').toLowerCase();

    // Find matching threats
    const matchedThreats: { threatId: string; isPrimary: boolean }[] = [];

    for (const [threatId, keywords] of Object.entries(THREAT_KEYWORDS)) {
      const threat = threatMap.get(threatId);
      if (!threat) continue;

      // Check if any keyword matches
      const matches = keywords.some(keyword => scenarioText.includes(keyword.toLowerCase()));
      if (matches) {
        matchedThreats.push({ threatId, isPrimary: matchedThreats.length === 0 });
      }
    }

    // Also match by threat name
    for (const threat of threats) {
      const threatNameLower = threat.name.toLowerCase();
      if (scenarioText.includes(threatNameLower) || threatNameLower.split(/[\s\/]+/).some(word => word.length > 4 && scenarioText.includes(word))) {
        if (!matchedThreats.find(m => m.threatId === threat.threatId)) {
          matchedThreats.push({ threatId: threat.threatId, isPrimary: matchedThreats.length === 0 });
        }
      }
    }

    // Create links
    for (const match of matchedThreats) {
      const threat = threatMap.get(match.threatId);
      if (threat) {
        await prisma.riskScenarioThreat.create({
          data: {
            scenarioId: scenario.id,
            threatId: threat.id,
            isPrimaryThreat: match.isPrimary,
            applicabilityNotes: `Auto-linked based on keyword matching in scenario text`,
          },
        });
        linked++;
      }
    }
  }

  console.log(`  Created ${linked} scenario-threat links for ${scenarios.length} scenarios`);
}

async function importScenarioKRIs(orgId: string) {
  console.log('Linking scenarios to KRIs...');

  // Get all scenarios with their parent risk
  const scenarios = await prisma.riskScenario.findMany({
    where: { risk: { organisationId: orgId } },
    select: { id: true, scenarioId: true, riskId: true },
  });

  // Get all KRIs with their parent risk
  const kris = await prisma.keyRiskIndicator.findMany({
    where: { risk: { organisationId: orgId } },
    select: { id: true, kriId: true, riskId: true },
  });

  // Clear existing links
  await prisma.riskScenarioKRI.deleteMany({});

  let linked = 0;

  // Link KRIs to scenarios that share the same parent risk
  for (const scenario of scenarios) {
    const matchingKRIs = kris.filter(kri => kri.riskId === scenario.riskId);

    for (let i = 0; i < matchingKRIs.length; i++) {
      const kri = matchingKRIs[i];
      await prisma.riskScenarioKRI.create({
        data: {
          scenarioId: scenario.id,
          kriId: kri.id,
          isPrimaryKRI: i === 0, // First KRI for risk is primary
          monitoringNotes: `Auto-linked: KRI ${kri.kriId} monitors parent risk of scenario`,
        },
      });
      linked++;
    }
  }

  console.log(`  Created ${linked} scenario-KRI links`);
}

async function main() {
  console.log('Starting GRC data import...\n');

  // Get the first organisation (or create one)
  let org = await prisma.organisationProfile.findFirst();
  if (!org) {
    console.log('Creating default organisation...');
    org = await prisma.organisationProfile.create({
      data: {
        name: 'Default Organisation',
        legalName: 'Default Organisation Ltd',
        industrySector: 'Technology',
        employeeCount: 100,
      },
    });
  }
  console.log(`Using organisation: ${org.name} (${org.id})\n`);

  try {
    // Import in dependency order
    await importGovernanceRoles(org.id);
    await importEscalationLevels();
    await importControlDomains();
    await importControls(org.id);
    await importCapabilities(org.id);
    await importCapabilityMetrics(org.id);
    await importCapabilityAssessments(org.id);
    await importEffectivenessTests(org.id);
    await importFrameworkCrossReferences();
    await importMetricHistory(org.id);
    await importRisks(org.id);
    await importScenarios(org.id);
    await importKRIs(org.id);
    await importKRIHistory(org.id);
    await importRTS(org.id);
    await importTreatmentPlans(org.id);
    await importTreatmentActions(org.id);
    await importRACIAssignments();
    await importReassessmentTriggers();
    await importScenarioControls(org.id);

    // Create entity links for operationalization
    await importScenarioThreats(org.id);
    await importScenarioKRIs(org.id);

    console.log('\n✅ GRC data import completed successfully!');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
