/**
 * Import Appetite Levels and Risk Tolerance Statements
 *
 * Files:
 * - .temp/grc-import/risk/00_appetite_levels.csv - 4 appetite level configurations
 * - .temp/grc-import/risk/10_risk_tolerance_statements.csv - 72 RTS (18 categories × 4 levels)
 *
 * Cascade Logic:
 * 1. User selects ONE appetite level (e.g., CAUTIOUS)
 * 2. System filters to 18 RTS where appetiteLevel = 'CAUTIOUS'
 * 3. Each risk inherits threshold from its category's active RTS
 * 4. Scenario evaluates: residualScore vs threshold → WITHIN | EXCEEDS | CRITICAL
 */

import { PrismaClient, RTSStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const IMPORT_DIR = path.join(process.cwd(), '../../.temp/grc-import/risk');

// Helper to parse CSV file
function parseCSV<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  File not found: ${filePath}`);
    return [];
  }
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

// Map status string to RTSStatus enum
function mapRTSStatus(value: string | undefined): RTSStatus {
  if (!value) return 'DRAFT';
  const upper = value.toUpperCase();
  const mapping: Record<string, RTSStatus> = {
    'DRAFT': 'DRAFT',
    'PENDING_REVIEW': 'PENDING_APPROVAL',
    'PENDING_APPROVAL': 'PENDING_APPROVAL',
    'APPROVED': 'APPROVED',
    'ACTIVE': 'ACTIVE',
    'SUPERSEDED': 'SUPERSEDED',
    'RETIRED': 'RETIRED',
  };
  return mapping[upper] || 'DRAFT';
}

// Appetite Level row from CSV
interface AppetiteLevelRow {
  levelCode: string;
  name: string;
  description: string;
  sortOrder: string;
  thresholdMultiplier: string;
  reviewFrequency: string;
  defaultApprovalLevel: string;
  colorCode: string;
  icon: string;
  isDefault: string;
}

// RTS row from CSV
interface RTSRow {
  rtsId: string;
  category: string;
  appetiteLevel: string;
  title: string;
  objective: string;
  domain: string;
  proposedToleranceLevel: string;
  toleranceThreshold: string;
  proposedRTS: string;
  anticipatedOperationalImpact: string;
  rationale: string;
  acceptanceCriteria: string;
  escalationPath: string;
  reviewFrequency: string;
  approvalLevel: string;
  status: string;
  effectiveDate: string;
  reviewDate: string;
  isCriticalDomain: string;
}

/**
 * Import Appetite Levels
 */
async function importAppetiteLevels(orgId: string): Promise<number> {
  console.log('\n📊 Importing Appetite Levels...');

  const filePath = path.join(IMPORT_DIR, '00_appetite_levels.csv');
  const data = parseCSV<AppetiteLevelRow>(filePath);

  if (data.length === 0) {
    console.log('  ⚠️  No appetite levels found');
    return 0;
  }

  // Delete existing appetite levels for this org
  await prisma.organisationAppetiteLevel.deleteMany({
    where: { organisationId: orgId },
  });

  let created = 0;
  for (const row of data) {
    try {
      await prisma.organisationAppetiteLevel.create({
        data: {
          levelCode: row.levelCode,
          name: row.name,
          description: row.description || null,
          sortOrder: toNumber(row.sortOrder) || 0,
          thresholdMultiplier: parseFloat(row.thresholdMultiplier) || 1.0,
          reviewFrequency: row.reviewFrequency || null,
          defaultApprovalLevel: row.defaultApprovalLevel || null,
          colorCode: row.colorCode || null,
          icon: row.icon || null,
          isDefault: toBool(row.isDefault),
          isActive: true,
          organisationId: orgId,
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Error creating appetite level ${row.levelCode}:`, err);
    }
  }

  console.log(`  ✅ Created ${created} appetite levels`);
  return created;
}

/**
 * Import Risk Tolerance Statements
 */
async function importRTS(orgId: string, userId: string): Promise<number> {
  console.log('\n📋 Importing Risk Tolerance Statements...');

  const filePath = path.join(IMPORT_DIR, '10_risk_tolerance_statements.csv');
  const data = parseCSV<RTSRow>(filePath);

  if (data.length === 0) {
    console.log('  ⚠️  No RTS found');
    return 0;
  }

  // Delete existing RTS for this org (careful - may have relations)
  // First, disconnect from risks and scenarios
  await prisma.riskToleranceStatement.updateMany({
    where: { organisationId: orgId },
    data: {},
  });

  // Now delete
  await prisma.riskToleranceStatement.deleteMany({
    where: { organisationId: orgId },
  });

  let created = 0;
  for (const row of data) {
    try {
      // Map appetiteLevel to ToleranceLevel enum
      type ToleranceLevelType = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
      const appetiteToToleranceMap: Record<string, ToleranceLevelType> = {
        'AVERSE': 'VERY_LOW',
        'CAUTIOUS': 'LOW',
        'BALANCED': 'MEDIUM',
        'AGGRESSIVE': 'HIGH',
      };
      const toleranceLevel: ToleranceLevelType = appetiteToToleranceMap[row.appetiteLevel] || 'MEDIUM';

      await prisma.riskToleranceStatement.create({
        data: {
          rtsId: row.rtsId,
          title: row.title,
          objective: row.objective,
          domain: row.domain,
          proposedToleranceLevel: toleranceLevel,
          proposedRTS: row.proposedRTS,
          conditions: [], // Will be populated if needed
          anticipatedOperationalImpact: row.anticipatedOperationalImpact || null,
          rationale: row.rationale || null,

          // New fields
          appetiteLevel: row.appetiteLevel,
          category: row.category,
          toleranceThreshold: toNumber(row.toleranceThreshold),
          isCriticalDomain: toBool(row.isCriticalDomain),
          acceptanceCriteria: row.acceptanceCriteria || null,
          escalationPath: row.escalationPath || null,
          reviewFrequency: row.reviewFrequency || null,
          approvalLevel: row.approvalLevel || null,

          // Workflow
          status: mapRTSStatus(row.status),
          effectiveDate: toDate(row.effectiveDate),
          reviewDate: toDate(row.reviewDate),

          // Framework
          framework: 'ISO',

          // Organisation
          organisationId: orgId,
          createdById: userId,
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Error creating RTS ${row.rtsId}:`, err);
    }
  }

  console.log(`  ✅ Created ${created} Risk Tolerance Statements`);
  return created;
}

/**
 * Set default appetite level for organisation
 */
async function setDefaultAppetite(orgId: string, userId: string): Promise<void> {
  console.log('\n🎯 Setting default appetite level...');

  // Check if already has a selection
  const existing = await prisma.organisationSelectedAppetite.findUnique({
    where: { organisationId: orgId },
  });

  if (existing) {
    console.log(`  ℹ️  Organisation already has appetite level: ${existing.selectedLevel}`);
    return;
  }

  // Find the default appetite level
  const defaultLevel = await prisma.organisationAppetiteLevel.findFirst({
    where: { organisationId: orgId, isDefault: true },
  });

  if (!defaultLevel) {
    // Fall back to CAUTIOUS if no default set
    const cautiousLevel = await prisma.organisationAppetiteLevel.findFirst({
      where: { organisationId: orgId, levelCode: 'CAUTIOUS' },
    });

    if (cautiousLevel) {
      await prisma.organisationSelectedAppetite.create({
        data: {
          selectedLevel: 'CAUTIOUS',
          organisationId: orgId,
          selectedById: userId,
          changeReason: 'Initial appetite level set during import',
        },
      });
      console.log('  ✅ Set default appetite level to CAUTIOUS');
    }
    return;
  }

  await prisma.organisationSelectedAppetite.create({
    data: {
      selectedLevel: defaultLevel.levelCode,
      organisationId: orgId,
      selectedById: userId,
      changeReason: 'Initial appetite level set during import',
    },
  });
  console.log(`  ✅ Set default appetite level to ${defaultLevel.levelCode}`);
}

/**
 * Main import function
 */
export async function importAppetiteAndRTS(orgId: string, userId: string): Promise<void> {
  console.log('\n========================================');
  console.log('🚀 Importing Appetite Levels & RTS');
  console.log('========================================');

  // Import appetite levels first
  await importAppetiteLevels(orgId);

  // Import RTS
  await importRTS(orgId, userId);

  // Set default appetite
  await setDefaultAppetite(orgId, userId);

  console.log('\n========================================');
  console.log('✅ Import Complete!');
  console.log('========================================');
}

/**
 * CLI execution
 */
async function main() {
  console.log('🌱 Starting Appetite & RTS import...\n');

  // Get organisation
  const org = await prisma.organisationProfile.findFirst();
  if (!org) {
    console.error('❌ No organisation found. Run organisation seed first.');
    process.exit(1);
  }

  // Get user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No user found. Run user seed first.');
    process.exit(1);
  }

  console.log(`📍 Organisation: ${org.name}`);
  console.log(`👤 User: ${user.email}`);

  await importAppetiteAndRTS(org.id, user.id);
}

// Run if executed directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Import failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
