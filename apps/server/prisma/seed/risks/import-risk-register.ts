import {
  PrismaClient,
  RiskTier,
  RiskStatus,
  ControlFramework,
  LikelihoodLevel,
  ImpactLevel,
  CollectionFrequency,
  ToleranceLevel,
  RTSStatus,
  TreatmentType,
  TreatmentStatus,
  TreatmentPriority,
  ActionStatus,
  ImpactCategory,
  ScenarioStatus,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// ============================================
// CSV PARSER UTILITIES
// ============================================

function readCSV<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: (value, context) => {
      // Handle empty strings
      if (value === '' || value === 'nan' || value === 'NaN') return undefined;
      // Handle booleans
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    },
  });
  return records as T[];
}

// ============================================
// TYPE DEFINITIONS FOR CSV RECORDS
// ============================================

interface RiskCSV {
  riskId: string;
  title: string;
  description?: string;
  tier: string;
  status: string;
  framework: string;
  riskOwner?: string;
  likelihood?: string;
  impact?: string;
  treatmentPlan?: string;
  acceptanceCriteria?: string;
  soc2Criteria?: string;
  tscCategory?: string;
}

interface ScenarioCSV {
  scenarioId: string;
  riskId: string;
  title: string;
  cause?: string;
  event?: string;
  consequence?: string;
  framework: string;
  sleLow?: string;
  sleLikely?: string;
  sleHigh?: string;
  aro?: string;
}

interface ImpactAssessmentCSV {
  scenarioId: string;
  category: string;
  level: string;
  value: string;
  rationale?: string;
  isResidual: boolean;
}

interface LikelihoodFactorCSV {
  scenarioId: string;
  f1ThreatFrequency?: string;
  f1Source?: string;
  f1Justification?: string;
  f2ControlEffectiveness?: string;
  f2Source?: string;
  f2Justification?: string;
  f3GapVulnerability?: string;
  f3Source?: string;
  f3Justification?: string;
  f4IncidentHistory?: string;
  f4Source?: string;
  f4Justification?: string;
  f5AttackSurface?: string;
  f5Source?: string;
  f5Justification?: string;
  f6Environmental?: string;
  f6Source?: string;
  f6Justification?: string;
}

interface KRICSV {
  kriId: string;
  riskId: string;
  name: string;
  description?: string;
  formula?: string;
  unit: string;
  frequency: string;
  dataSource?: string;
  automated: boolean;
  thresholdGreen?: string;
  thresholdAmber?: string;
  thresholdRed?: string;
  tier: string;
  framework: string;
}

interface TreatmentPlanCSV {
  treatmentId: string;
  riskId: string;
  scenarioId?: string;
  title: string;
  description: string;
  treatmentType: string;
  priority: string;
  status: string;
  targetResidualScore?: string;
  estimatedCost?: string;
  costBenefit?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  acceptanceRationale?: string;
  acceptanceCriteria?: string;
}

interface TreatmentActionCSV {
  actionId: string;
  treatmentPlanId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: string;
  estimatedHours?: string;
}

interface RTSCSV {
  rtsId: string;
  title: string;
  objective: string;
  domain?: string;
  proposedToleranceLevel: string;
  proposedRTS: string;
  rationale?: string;
  framework: string;
  effectiveDate?: string;
  reviewDate?: string;
}

interface ControlRiskLinkCSV {
  riskId: string;
  controlId: string;
  notes?: string;
}

interface ScenarioControlLinkCSV {
  scenarioId: string;
  controlId: string;
  effectivenessWeight?: string;
  isPrimaryControl?: boolean;
  notes?: string;
}

// ============================================
// ENUM MAPPERS
// ============================================

function mapTier(tier: string): RiskTier {
  const map: Record<string, RiskTier> = {
    CORE: 'CORE',
    EXTENDED: 'EXTENDED',
    ADVANCED: 'ADVANCED',
    Core: 'CORE',
    Extended: 'EXTENDED',
    Advanced: 'ADVANCED',
  };
  return map[tier] || 'CORE';
}

function mapRiskStatus(status: string): RiskStatus {
  const map: Record<string, RiskStatus> = {
    IDENTIFIED: 'IDENTIFIED',
    ASSESSED: 'ASSESSED',
    TREATING: 'TREATING',
    ACCEPTED: 'ACCEPTED',
    CLOSED: 'CLOSED',
  };
  return map[status] || 'IDENTIFIED';
}

function mapFramework(framework: string): ControlFramework {
  const map: Record<string, ControlFramework> = {
    ISO: 'ISO',
    SOC2: 'SOC2',
    NIS2: 'NIS2',
    DORA: 'DORA',
  };
  return map[framework] || 'ISO';
}

function mapLikelihood(level?: string): LikelihoodLevel | undefined {
  if (!level) return undefined;
  const map: Record<string, LikelihoodLevel> = {
    RARE: 'RARE',
    UNLIKELY: 'UNLIKELY',
    POSSIBLE: 'POSSIBLE',
    LIKELY: 'LIKELY',
    ALMOST_CERTAIN: 'ALMOST_CERTAIN',
  };
  return map[level];
}

function mapImpact(level?: string): ImpactLevel | undefined {
  if (!level) return undefined;
  const map: Record<string, ImpactLevel> = {
    NEGLIGIBLE: 'NEGLIGIBLE',
    MINOR: 'MINOR',
    MODERATE: 'MODERATE',
    MAJOR: 'MAJOR',
    SEVERE: 'SEVERE',
  };
  return map[level];
}

function mapFrequency(freq: string): CollectionFrequency {
  const map: Record<string, CollectionFrequency> = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    ANNUAL: 'ANNUAL',
    PER_EVENT: 'PER_EVENT',
  };
  return map[freq] || 'MONTHLY';
}

function mapToleranceLevel(level: string): ToleranceLevel {
  const map: Record<string, ToleranceLevel> = {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };
  return map[level] || 'MEDIUM';
}

function mapTreatmentType(type: string): TreatmentType {
  const map: Record<string, TreatmentType> = {
    MITIGATE: 'MITIGATE',
    TRANSFER: 'TRANSFER',
    ACCEPT: 'ACCEPT',
    AVOID: 'AVOID',
    SHARE: 'SHARE',
  };
  return map[type] || 'MITIGATE';
}

function mapTreatmentStatus(status: string): TreatmentStatus {
  const map: Record<string, TreatmentStatus> = {
    DRAFT: 'DRAFT',
    PROPOSED: 'PROPOSED',
    APPROVED: 'APPROVED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD',
    CANCELLED: 'CANCELLED',
  };
  return map[status] || 'DRAFT';
}

function mapTreatmentPriority(priority: string): TreatmentPriority {
  const map: Record<string, TreatmentPriority> = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };
  return map[priority] || 'MEDIUM';
}

function mapActionStatus(status: string): ActionStatus {
  const map: Record<string, ActionStatus> = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    BLOCKED: 'BLOCKED',
    CANCELLED: 'CANCELLED',
  };
  return map[status] || 'NOT_STARTED';
}

function mapImpactCategory(category: string): ImpactCategory {
  const map: Record<string, ImpactCategory> = {
    FINANCIAL: 'FINANCIAL',
    OPERATIONAL: 'OPERATIONAL',
    LEGAL_REGULATORY: 'LEGAL_REGULATORY',
    REPUTATIONAL: 'REPUTATIONAL',
    REPUTATION: 'REPUTATIONAL', // Legacy mapping for backwards compatibility
    STRATEGIC: 'STRATEGIC',
  };
  return map[category] || 'FINANCIAL';
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

export async function importRiskRegister(
  templatesDir: string,
  prismaArg?: PrismaClient,
): Promise<void> {
  const db = prismaArg || prisma;

  console.log('🌱 Starting Risk Register Import...');
  console.log(`📁 Templates directory: ${templatesDir}`);

  // Get organisation and user for relationships
  const org = await db.organisationProfile.findFirst();
  const user = await db.user.findFirst();

  if (!org || !user) {
    console.error('❌ Organisation or User not found. Run main seed first.');
    return;
  }

  console.log(`\n📋 Organisation: ${org.name}`);
  console.log(`👤 User: ${user.email}\n`);

  // Track created records for relationship mapping
  const riskIdMap = new Map<string, string>(); // riskId -> database id
  const scenarioIdMap = new Map<string, string>(); // scenarioId -> database id
  const treatmentIdMap = new Map<string, string>(); // treatmentId -> database id

  // ============================================
  // STEP 1: Import Risks
  // ============================================
  console.log('📝 Step 1: Importing Risks...');
  const risksFile = path.join(templatesDir, '01-risks.csv');
  const risks = readCSV<RiskCSV>(risksFile);
  let risksCreated = 0;
  let risksSkipped = 0;

  for (const row of risks) {
    if (!row.riskId || !row.title) continue;

    const existing = await db.risk.findFirst({
      where: { riskId: row.riskId, organisationId: org.id },
    });

    if (existing) {
      riskIdMap.set(row.riskId, existing.id);
      risksSkipped++;
      continue;
    }

    const risk = await db.risk.create({
      data: {
        riskId: row.riskId,
        title: row.title,
        description: row.description,
        tier: mapTier(row.tier),
        status: mapRiskStatus(row.status),
        framework: mapFramework(row.framework),
        riskOwner: row.riskOwner,
        likelihood: mapLikelihood(row.likelihood),
        impact: mapImpact(row.impact),
        treatmentPlan: row.treatmentPlan,
        acceptanceCriteria: row.acceptanceCriteria,
        soc2Criteria: row.soc2Criteria,
        tscCategory: row.tscCategory,
        organisationId: org.id,
        createdById: user.id,
      },
    });

    riskIdMap.set(row.riskId, risk.id);
    risksCreated++;
  }

  console.log(`   ✅ Created ${risksCreated} risks (${risksSkipped} skipped)`);

  // ============================================
  // STEP 2: Import Risk Scenarios
  // ============================================
  console.log('📝 Step 2: Importing Risk Scenarios...');
  const scenariosFile = path.join(templatesDir, '02-risk-scenarios.csv');
  const scenarios = readCSV<ScenarioCSV>(scenariosFile);
  let scenariosCreated = 0;
  let scenariosSkipped = 0;

  for (const row of scenarios) {
    if (!row.scenarioId || !row.riskId || !row.title) continue;

    const riskDbId = riskIdMap.get(row.riskId);
    if (!riskDbId) {
      console.log(`   ⚠️  Skipping scenario ${row.scenarioId}: Parent risk ${row.riskId} not found`);
      continue;
    }

    const existing = await db.riskScenario.findFirst({
      where: { scenarioId: row.scenarioId, riskId: riskDbId },
    });

    if (existing) {
      scenarioIdMap.set(row.scenarioId, existing.id);
      scenariosSkipped++;
      continue;
    }

    const scenario = await db.riskScenario.create({
      data: {
        scenarioId: row.scenarioId,
        title: row.title,
        cause: row.cause,
        event: row.event,
        consequence: row.consequence,
        framework: mapFramework(row.framework),
        sleLow: row.sleLow ? parseFloat(row.sleLow) : undefined,
        sleLikely: row.sleLikely ? parseFloat(row.sleLikely) : undefined,
        sleHigh: row.sleHigh ? parseFloat(row.sleHigh) : undefined,
        aro: row.aro ? parseFloat(row.aro) : undefined,
        status: 'DRAFT' as ScenarioStatus,
        riskId: riskDbId,
        createdById: user.id,
      },
    });

    scenarioIdMap.set(row.scenarioId, scenario.id);
    scenariosCreated++;
  }

  console.log(`   ✅ Created ${scenariosCreated} scenarios (${scenariosSkipped} skipped)`);

  // ============================================
  // STEP 3: Import BIRT Impact Assessments
  // ============================================
  console.log('📝 Step 3: Importing BIRT Impact Assessments...');
  const birtFile = path.join(templatesDir, '03-birt-impact-assessments.csv');
  const birtAssessments = readCSV<ImpactAssessmentCSV>(birtFile);
  let birtCreated = 0;
  let birtSkipped = 0;

  for (const row of birtAssessments) {
    if (!row.scenarioId || !row.category || !row.level) continue;

    const scenarioDbId = scenarioIdMap.get(row.scenarioId);
    if (!scenarioDbId) {
      console.log(`   ⚠️  Skipping BIRT for ${row.scenarioId}: Scenario not found`);
      continue;
    }

    const isResidual = row.isResidual === true;

    const existing = await db.scenarioImpactAssessment.findFirst({
      where: {
        scenarioId: scenarioDbId,
        category: mapImpactCategory(row.category),
        isResidual,
      },
    });

    if (existing) {
      birtSkipped++;
      continue;
    }

    await db.scenarioImpactAssessment.create({
      data: {
        scenarioId: scenarioDbId,
        category: mapImpactCategory(row.category),
        level: mapImpact(row.level) as ImpactLevel,
        value: parseInt(row.value) || 1,
        rationale: row.rationale,
        isResidual,
      },
    });

    birtCreated++;
  }

  console.log(`   ✅ Created ${birtCreated} impact assessments (${birtSkipped} skipped)`);

  // ============================================
  // STEP 4: Import Likelihood Factors (F1-F6)
  // ============================================
  console.log('📝 Step 4: Importing Likelihood Factors...');
  const factorsFile = path.join(templatesDir, '04-likelihood-factors.csv');
  const factors = readCSV<LikelihoodFactorCSV>(factorsFile);
  let factorsUpdated = 0;

  for (const row of factors) {
    if (!row.scenarioId) continue;

    const scenarioDbId = scenarioIdMap.get(row.scenarioId);
    if (!scenarioDbId) {
      console.log(`   ⚠️  Skipping factors for ${row.scenarioId}: Scenario not found`);
      continue;
    }

    await db.riskScenario.update({
      where: { id: scenarioDbId },
      data: {
        f1ThreatFrequency: row.f1ThreatFrequency ? parseInt(row.f1ThreatFrequency) : undefined,
        f1Source: row.f1Source,
        f2ControlEffectiveness: row.f2ControlEffectiveness
          ? parseInt(row.f2ControlEffectiveness)
          : undefined,
        f2Source: row.f2Source,
        f3GapVulnerability: row.f3GapVulnerability
          ? parseInt(row.f3GapVulnerability)
          : undefined,
        f3Source: row.f3Source,
        f4IncidentHistory: row.f4IncidentHistory
          ? parseInt(row.f4IncidentHistory)
          : undefined,
        f4Source: row.f4Source,
        f5AttackSurface: row.f5AttackSurface ? parseInt(row.f5AttackSurface) : undefined,
        f5Source: row.f5Source,
        f6Environmental: row.f6Environmental ? parseInt(row.f6Environmental) : undefined,
        f6Source: row.f6Source,
      },
    });

    factorsUpdated++;
  }

  console.log(`   ✅ Updated ${factorsUpdated} scenarios with likelihood factors`);

  // ============================================
  // STEP 5: Import KRIs
  // ============================================
  console.log('📝 Step 5: Importing Key Risk Indicators...');
  const krisFile = path.join(templatesDir, '05-kris.csv');
  const kris = readCSV<KRICSV>(krisFile);
  let krisCreated = 0;
  let krisSkipped = 0;

  for (const row of kris) {
    if (!row.kriId || !row.riskId || !row.name) continue;

    const riskDbId = riskIdMap.get(row.riskId);
    if (!riskDbId) {
      console.log(`   ⚠️  Skipping KRI ${row.kriId}: Parent risk ${row.riskId} not found`);
      continue;
    }

    const existing = await db.keyRiskIndicator.findFirst({
      where: { kriId: row.kriId, riskId: riskDbId },
    });

    if (existing) {
      krisSkipped++;
      continue;
    }

    await db.keyRiskIndicator.create({
      data: {
        kriId: row.kriId,
        name: row.name,
        description: row.description,
        formula: row.formula,
        unit: row.unit || '%',
        frequency: mapFrequency(row.frequency),
        dataSource: row.dataSource,
        automated: row.automated === true,
        thresholdGreen: row.thresholdGreen,
        thresholdAmber: row.thresholdAmber,
        thresholdRed: row.thresholdRed,
        tier: mapTier(row.tier),
        framework: mapFramework(row.framework),
        riskId: riskDbId,
        createdById: user.id,
      },
    });

    krisCreated++;
  }

  console.log(`   ✅ Created ${krisCreated} KRIs (${krisSkipped} skipped)`);

  // ============================================
  // STEP 6: Import Treatment Plans
  // ============================================
  console.log('📝 Step 6: Importing Treatment Plans...');
  const treatmentsFile = path.join(templatesDir, '06-treatment-plans.csv');
  const treatments = readCSV<TreatmentPlanCSV>(treatmentsFile);
  let treatmentsCreated = 0;
  let treatmentsSkipped = 0;

  for (const row of treatments) {
    if (!row.treatmentId || !row.riskId || !row.title) continue;

    const riskDbId = riskIdMap.get(row.riskId);
    if (!riskDbId) {
      console.log(`   ⚠️  Skipping treatment ${row.treatmentId}: Parent risk ${row.riskId} not found`);
      continue;
    }

    const scenarioDbId = row.scenarioId ? scenarioIdMap.get(row.scenarioId) : undefined;

    const existing = await db.treatmentPlan.findFirst({
      where: { treatmentId: row.treatmentId, riskId: riskDbId },
    });

    if (existing) {
      treatmentIdMap.set(row.treatmentId, existing.id);
      treatmentsSkipped++;
      continue;
    }

    const treatment = await db.treatmentPlan.create({
      data: {
        treatmentId: row.treatmentId,
        title: row.title,
        description: row.description || '',
        treatmentType: mapTreatmentType(row.treatmentType),
        priority: mapTreatmentPriority(row.priority),
        status: mapTreatmentStatus(row.status),
        targetResidualScore: row.targetResidualScore
          ? parseInt(row.targetResidualScore)
          : undefined,
        estimatedCost: row.estimatedCost ? parseFloat(row.estimatedCost) : undefined,
        costBenefit: row.costBenefit,
        targetStartDate: row.targetStartDate ? new Date(row.targetStartDate) : undefined,
        targetEndDate: row.targetEndDate ? new Date(row.targetEndDate) : undefined,
        acceptanceRationale: row.acceptanceRationale,
        acceptanceCriteria: row.acceptanceCriteria,
        riskId: riskDbId,
        scenarioId: scenarioDbId,
        organisationId: org.id,
        createdById: user.id,
      },
    });

    treatmentIdMap.set(row.treatmentId, treatment.id);
    treatmentsCreated++;
  }

  console.log(`   ✅ Created ${treatmentsCreated} treatment plans (${treatmentsSkipped} skipped)`);

  // ============================================
  // STEP 7: Import Treatment Actions
  // ============================================
  console.log('📝 Step 7: Importing Treatment Actions...');
  const actionsFile = path.join(templatesDir, '07-treatment-actions.csv');
  const actions = readCSV<TreatmentActionCSV>(actionsFile);
  let actionsCreated = 0;
  let actionsSkipped = 0;

  for (const row of actions) {
    if (!row.actionId || !row.treatmentPlanId || !row.title) continue;

    const treatmentDbId = treatmentIdMap.get(row.treatmentPlanId);
    if (!treatmentDbId) {
      console.log(
        `   ⚠️  Skipping action ${row.actionId}: Treatment plan ${row.treatmentPlanId} not found`,
      );
      continue;
    }

    const existing = await db.treatmentAction.findFirst({
      where: { actionId: row.actionId, treatmentPlanId: treatmentDbId },
    });

    if (existing) {
      actionsSkipped++;
      continue;
    }

    await db.treatmentAction.create({
      data: {
        actionId: row.actionId,
        title: row.title,
        description: row.description,
        status: mapActionStatus(row.status),
        priority: mapTreatmentPriority(row.priority),
        dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
        estimatedHours: row.estimatedHours ? parseInt(row.estimatedHours) : undefined,
        treatmentPlanId: treatmentDbId,
        createdById: user.id,
      },
    });

    actionsCreated++;
  }

  console.log(`   ✅ Created ${actionsCreated} treatment actions (${actionsSkipped} skipped)`);

  // ============================================
  // STEP 8: Import Risk Tolerance Statements
  // ============================================
  console.log('📝 Step 8: Importing Risk Tolerance Statements...');
  const rtsFile = path.join(templatesDir, '08-risk-tolerance-statements.csv');
  const rtsRecords = readCSV<RTSCSV>(rtsFile);
  let rtsCreated = 0;
  let rtsSkipped = 0;

  for (const row of rtsRecords) {
    if (!row.rtsId || !row.title || !row.proposedRTS) continue;

    const existing = await db.riskToleranceStatement.findFirst({
      where: { rtsId: row.rtsId, organisationId: org.id },
    });

    if (existing) {
      rtsSkipped++;
      continue;
    }

    await db.riskToleranceStatement.create({
      data: {
        rtsId: row.rtsId,
        title: row.title,
        objective: row.objective,
        domain: row.domain,
        proposedToleranceLevel: mapToleranceLevel(row.proposedToleranceLevel),
        proposedRTS: row.proposedRTS,
        rationale: row.rationale,
        framework: mapFramework(row.framework),
        status: 'APPROVED' as RTSStatus,
        effectiveDate: row.effectiveDate ? new Date(row.effectiveDate) : new Date(),
        reviewDate: row.reviewDate ? new Date(row.reviewDate) : undefined,
        organisationId: org.id,
        createdById: user.id,
      },
    });

    rtsCreated++;
  }

  console.log(`   ✅ Created ${rtsCreated} RTS (${rtsSkipped} skipped)`);

  // ============================================
  // STEP 9: Import Control-Risk Links
  // ============================================
  console.log('📝 Step 9: Importing Control-Risk Links...');
  const controlRiskFile = path.join(templatesDir, '09-control-risk-links.csv');
  const controlRiskLinks = readCSV<ControlRiskLinkCSV>(controlRiskFile);
  let controlRiskLinked = 0;
  let controlRiskSkipped = 0;

  for (const row of controlRiskLinks) {
    if (!row.riskId || !row.controlId) continue;

    const riskDbId = riskIdMap.get(row.riskId);
    if (!riskDbId) {
      controlRiskSkipped++;
      continue;
    }

    // Find control by controlId
    const control = await db.control.findFirst({
      where: { controlId: row.controlId, organisationId: org.id },
    });

    if (!control) {
      // Try to find by partial match (A.5.1 might be stored as 5.1)
      const shortId = row.controlId.replace('A.', '');
      const controlAlt = await db.control.findFirst({
        where: { controlId: shortId, organisationId: org.id },
      });

      if (!controlAlt) {
        controlRiskSkipped++;
        continue;
      }

      // Link using connect
      await db.risk.update({
        where: { id: riskDbId },
        data: {
          controls: { connect: { id: controlAlt.id } },
        },
      });
    } else {
      await db.risk.update({
        where: { id: riskDbId },
        data: {
          controls: { connect: { id: control.id } },
        },
      });
    }

    controlRiskLinked++;
  }

  console.log(`   ✅ Linked ${controlRiskLinked} control-risk pairs (${controlRiskSkipped} skipped)`);

  // ============================================
  // STEP 10: Import Scenario-Control Links
  // ============================================
  console.log('📝 Step 10: Importing Scenario-Control Links...');
  const scenarioControlFile = path.join(templatesDir, '10-scenario-control-links.csv');
  const scenarioControlLinks = readCSV<ScenarioControlLinkCSV>(scenarioControlFile);
  let scenarioControlLinked = 0;
  let scenarioControlSkipped = 0;

  for (const row of scenarioControlLinks) {
    if (!row.scenarioId || !row.controlId) continue;

    const scenarioDbId = scenarioIdMap.get(row.scenarioId);
    if (!scenarioDbId) {
      scenarioControlSkipped++;
      continue;
    }

    // Find control by controlId
    let controlId: string | undefined;
    const control = await db.control.findFirst({
      where: { controlId: row.controlId, organisationId: org.id },
    });

    if (!control) {
      // Try short ID
      const shortId = row.controlId.replace('A.', '');
      const controlAlt = await db.control.findFirst({
        where: { controlId: shortId, organisationId: org.id },
      });

      if (!controlAlt) {
        scenarioControlSkipped++;
        continue;
      }
      controlId = controlAlt.id;
    } else {
      controlId = control.id;
    }

    // Check if link exists
    const existing = await db.riskScenarioControl.findFirst({
      where: { scenarioId: scenarioDbId, controlId },
    });

    if (existing) {
      scenarioControlSkipped++;
      continue;
    }

    await db.riskScenarioControl.create({
      data: {
        scenarioId: scenarioDbId,
        controlId,
        effectivenessWeight: row.effectivenessWeight ? parseInt(row.effectivenessWeight) : 100,
        isPrimaryControl: row.isPrimaryControl === true,
        notes: row.notes,
      },
    });

    scenarioControlLinked++;
  }

  console.log(
    `   ✅ Linked ${scenarioControlLinked} scenario-control pairs (${scenarioControlSkipped} skipped)`,
  );

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Risks:              ${risksCreated} created, ${risksSkipped} skipped`);
  console.log(`   Scenarios:          ${scenariosCreated} created, ${scenariosSkipped} skipped`);
  console.log(`   Impact Assessments: ${birtCreated} created, ${birtSkipped} skipped`);
  console.log(`   Likelihood Factors: ${factorsUpdated} updated`);
  console.log(`   KRIs:               ${krisCreated} created, ${krisSkipped} skipped`);
  console.log(`   Treatment Plans:    ${treatmentsCreated} created, ${treatmentsSkipped} skipped`);
  console.log(`   Treatment Actions:  ${actionsCreated} created, ${actionsSkipped} skipped`);
  console.log(`   RTS:                ${rtsCreated} created, ${rtsSkipped} skipped`);
  console.log(`   Control-Risk Links: ${controlRiskLinked} linked, ${controlRiskSkipped} skipped`);
  console.log(
    `   Scenario-Ctrl Links:${scenarioControlLinked} linked, ${scenarioControlSkipped} skipped`,
  );
  console.log('='.repeat(50));
  console.log('✅ Risk Register Import completed.\n');
}

// ============================================
// CLI ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  // Default to docs/import-templates relative to the monorepo root (apps/server/../../docs)
  let templatesDir = path.resolve(__dirname, '../../../../../docs/import-templates');

  // Check for --dir argument
  const dirIndex = args.indexOf('--dir');
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    templatesDir = path.resolve(args[dirIndex + 1]);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🚀 RISK REGISTER CSV IMPORT');
  console.log('='.repeat(50) + '\n');

  try {
    await importRiskRegister(templatesDir);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run directly if this file is executed
main();
