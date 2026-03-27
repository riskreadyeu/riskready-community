import { PrismaClient, EffectivenessTestType, TestResult } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to Excel files
const TESTS_DIR = path.resolve(__dirname, '../../../../../_temp/ISO27001/tests');

interface EffectivenessTestData {
  capabilityId: string;
  testType: string;
  testResult: string;
  testDate?: string;
  tester?: string;
  objective?: string;
  testSteps?: string;
  evidenceRequired?: string;
  passCriteria?: string;
  soaCriteria?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  findings?: string;
  recommendations?: string;
}

interface MaturityAssessmentData {
  capabilityId: string;
  currentMaturity?: number;
  targetMaturity?: number;
  gap?: number;
  l1Met?: boolean;
  l2Met?: boolean;
  l3Met?: boolean;
  l4Met?: boolean;
  l5Met?: boolean;
  assessor?: string;
  assessmentDate?: string;
  nextReview?: string;
  notes?: string;
}

function mapTestType(type: string): EffectivenessTestType {
  const normalized = type?.toUpperCase().trim();
  switch (normalized) {
    case 'DESIGN': return 'DESIGN';
    case 'IMPLEMENTATION': return 'IMPLEMENTATION';
    case 'OPERATING': return 'OPERATING';
    default: return 'DESIGN';
  }
}

function mapTestResult(result: string): TestResult {
  const normalized = result?.toUpperCase().trim();
  switch (normalized) {
    case 'PASS': return 'PASS';
    case 'PARTIAL': return 'PARTIAL';
    case 'FAIL': return 'FAIL';
    case 'NOT_TESTED': return 'NOT_TESTED';
    case 'NOT_APPLICABLE': 
    case 'N/A': return 'NOT_APPLICABLE';
    default: return 'NOT_TESTED';
  }
}

function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  
  // Handle Excel serial date number
  if (typeof value === 'number') {
    // Excel date serial number to JS Date
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  }
  
  // Handle string date
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

function parseBoolean(value: any): boolean | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === 'yes' || lower === '1') return true;
    if (lower === 'false' || lower === 'no' || lower === '0') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return undefined;
}

function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function readExcelSheet(filePath: string, sheetName: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`Sheet "${sheetName}" not found in ${filePath}`);
    return [];
  }
  return XLSX.utils.sheet_to_json(sheet);
}

async function buildCapabilityLookup(): Promise<Map<string, string>> {
  console.log('📍 Building capability lookup...');
  
  const capabilities = await prisma.capability.findMany({
    select: { id: true, capabilityId: true },
  });
  
  const lookup = new Map<string, string>();
  for (const cap of capabilities) {
    lookup.set(cap.capabilityId, cap.id);
  }
  
  console.log(`  Found ${lookup.size} capabilities`);
  return lookup;
}

async function importEffectivenessTests(
  capabilityLookup: Map<string, string>,
  userId: string
): Promise<number> {
  console.log('\n🧪 Importing effectiveness tests...');
  
  const testsFile = path.join(TESTS_DIR, 'ISO27001_Effectiveness_Tests_Complete (1).xlsx');
  const testsData = readExcelSheet(testsFile, 'Effectiveness_Tests');
  
  console.log(`  Found ${testsData.length} test records in Excel`);
  
  let importedCount = 0;
  let skippedCount = 0;
  
  for (const row of testsData) {
    const capabilityId = String(row['capabilityId'] || '').trim();
    
    if (!capabilityId) {
      skippedCount++;
      continue;
    }
    
    const dbCapabilityId = capabilityLookup.get(capabilityId);
    if (!dbCapabilityId) {
      console.warn(`  Capability ${capabilityId} not found in database`);
      skippedCount++;
      continue;
    }
    
    const testData: EffectivenessTestData = {
      capabilityId: dbCapabilityId,
      testType: String(row['testType'] || 'DESIGN'),
      testResult: String(row['testResult'] || 'NOT_TESTED'),
      testDate: row['testDate'],
      tester: row['tester'] ? String(row['tester']) : undefined,
      objective: row['objective'] ? String(row['objective']) : undefined,
      testSteps: row['testSteps'] ? String(row['testSteps']) : undefined,
      evidenceRequired: row['evidenceRequired'] ? String(row['evidenceRequired']) : undefined,
      passCriteria: row['passCriteria'] ? String(row['passCriteria']) : undefined,
      soaCriteria: row['soaCriteria'] ? String(row['soaCriteria']) : undefined,
      evidenceLocation: row['evidenceLocation'] ? String(row['evidenceLocation']) : undefined,
      evidenceNotes: row['evidenceNotes'] ? String(row['evidenceNotes']) : undefined,
      findings: row['findings'] ? String(row['findings']) : undefined,
      recommendations: row['recommendations'] ? String(row['recommendations']) : undefined,
    };
    
    try {
      await prisma.capabilityEffectivenessTest.create({
        data: {
          capabilityId: testData.capabilityId,
          testType: mapTestType(testData.testType),
          testResult: mapTestResult(testData.testResult),
          testDate: parseDate(testData.testDate),
          tester: testData.tester,
          // Store objective and testSteps in their dedicated fields
          objective: testData.objective,
          testSteps: testData.testSteps,
          // Keep testCriteria for backwards compatibility
          testCriteria: testData.objective || testData.testSteps,
          evidenceRequired: testData.evidenceRequired,
          passCriteria: testData.passCriteria,
          soaCriteria: testData.soaCriteria,
          evidenceLocation: testData.evidenceLocation,
          evidenceNotes: testData.evidenceNotes,
          findings: testData.findings,
          recommendations: testData.recommendations,
          createdById: userId,
          updatedById: userId,
        },
      });
      importedCount++;
    } catch (error) {
      console.error(`  Error importing test for ${capabilityId}:`, error);
      skippedCount++;
    }
  }
  
  console.log(`  ✅ Imported ${importedCount} effectiveness tests (${skippedCount} skipped)`);
  return importedCount;
}

async function importMaturityAssessments(
  capabilityLookup: Map<string, string>,
  userId: string
): Promise<number> {
  console.log('\n📊 Importing maturity assessments...');
  
  const assessmentsFile = path.join(TESTS_DIR, 'ISO27001_Maturity_Assessments_Complete.xlsx');
  const assessmentsData = readExcelSheet(assessmentsFile, 'Maturity_Assessments');
  
  console.log(`  Found ${assessmentsData.length} assessment records in Excel`);
  
  let importedCount = 0;
  let skippedCount = 0;
  
  for (const row of assessmentsData) {
    const capabilityId = String(row['capabilityId'] || '').trim();
    
    if (!capabilityId) {
      skippedCount++;
      continue;
    }
    
    const dbCapabilityId = capabilityLookup.get(capabilityId);
    if (!dbCapabilityId) {
      console.warn(`  Capability ${capabilityId} not found in database`);
      skippedCount++;
      continue;
    }
    
    const assessmentData: MaturityAssessmentData = {
      capabilityId: dbCapabilityId,
      currentMaturity: parseNumber(row['currentMaturity']),
      targetMaturity: parseNumber(row['targetMaturity']),
      gap: parseNumber(row['gap']),
      l1Met: parseBoolean(row['l1Met']),
      l2Met: parseBoolean(row['l2Met']),
      l3Met: parseBoolean(row['l3Met']),
      l4Met: parseBoolean(row['l4Met']),
      l5Met: parseBoolean(row['l5Met']),
      assessor: row['assessor'] ? String(row['assessor']) : undefined,
      assessmentDate: row['assessmentDate'],
      nextReview: row['nextReview'],
      notes: row['notes'] ? String(row['notes']) : undefined,
    };
    
    try {
      await prisma.capabilityAssessment.create({
        data: {
          capabilityId: assessmentData.capabilityId,
          currentMaturity: assessmentData.currentMaturity,
          targetMaturity: assessmentData.targetMaturity,
          gap: assessmentData.gap,
          l1Met: assessmentData.l1Met,
          l2Met: assessmentData.l2Met,
          l3Met: assessmentData.l3Met,
          l4Met: assessmentData.l4Met,
          l5Met: assessmentData.l5Met,
          assessor: assessmentData.assessor,
          assessmentDate: parseDate(assessmentData.assessmentDate),
          nextReview: parseDate(assessmentData.nextReview),
          notes: assessmentData.notes,
          createdById: userId,
          updatedById: userId,
        },
      });
      importedCount++;
    } catch (error) {
      console.error(`  Error importing assessment for ${capabilityId}:`, error);
      skippedCount++;
    }
  }
  
  console.log(`  ✅ Imported ${importedCount} maturity assessments (${skippedCount} skipped)`);
  return importedCount;
}

export async function seedTestsAndAssessments() {
  console.log('\n🚀 Starting Tests & Assessments import...\n');
  
  // Get admin user
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@riskready.com' },
  });
  
  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      where: { email: 'admin@local.test' },
    });
  }
  
  if (!adminUser) {
    throw new Error('Admin user not found. Run main seed first.');
  }
  
  const userId = adminUser.id;
  console.log(`User: ${adminUser.email} (${userId})\n`);
  
  // Build capability lookup
  const capabilityLookup = await buildCapabilityLookup();
  
  if (capabilityLookup.size === 0) {
    throw new Error('No capabilities found. Run controls seed first.');
  }
  
  // Clear existing data (optional - comment out to append)
  console.log('🗑️  Clearing existing tests and assessments...');
  await prisma.capabilityEffectivenessTest.deleteMany({});
  await prisma.capabilityAssessment.deleteMany({});
  
  // Import data
  await importEffectivenessTests(capabilityLookup, userId);
  await importMaturityAssessments(capabilityLookup, userId);
  
  // Print summary
  const testCount = await prisma.capabilityEffectivenessTest.count();
  const assessmentCount = await prisma.capabilityAssessment.count();
  
  console.log('\n📈 Final counts:');
  console.log(`  Effectiveness Tests: ${testCount}`);
  console.log(`  Maturity Assessments: ${assessmentCount}`);
  console.log('\n✅ Tests & Assessments import complete!\n');
}

// Run if called directly
if (require.main === module) {
  seedTestsAndAssessments()
    .catch((e) => {
      console.error('Import failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

