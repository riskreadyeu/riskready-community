import { PrismaClient, TreatmentType, TreatmentPriority, TreatmentStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to Excel file
const EXCEL_FILE = path.resolve(__dirname, '../../../../../_temp/ISO27001/ISO27001_Treatment_Plans.xlsx');

interface TreatmentPlanRow {
  Treatment_ID?: string;
  'Treatment ID'?: string;
  Title?: string;
  Description?: string;
  Treatment_Type?: string;
  'Treatment Type'?: string;
  Priority?: string;
  Status?: string;
  Risk_ID?: string;
  'Risk ID'?: string;
  Target_Residual_Score?: number;
  'Target Residual Score'?: number;
  Expected_Reduction?: number;
  'Expected Reduction'?: number;
  Estimated_Cost?: number;
  'Estimated Cost'?: number;
  Target_Start_Date?: string;
  'Target Start Date'?: string;
  Target_End_Date?: string;
  'Target End Date'?: string;
  Owner?: string;
  [key: string]: any; // Allow any other fields
}

function readExcelSheet(filePath: string, sheetName: string): any[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      // Try first sheet if named sheet not found
      const firstSheetName = workbook.SheetNames[0];
      console.log(`Sheet "${sheetName}" not found, trying "${firstSheetName}"`);
      return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
    }
    return XLSX.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error(`Error reading Excel file: ${error}`);
    return [];
  }
}

function mapTreatmentType(type: string): TreatmentType {
  const t = type?.toUpperCase().trim();
  switch (t) {
    case 'MITIGATE': return 'MITIGATE';
    case 'TRANSFER': return 'TRANSFER';
    case 'ACCEPT': return 'ACCEPT';
    case 'AVOID': return 'AVOID';
    case 'SHARE': return 'SHARE';
    default: return 'MITIGATE';
  }
}

function mapPriority(priority: string): TreatmentPriority {
  const p = priority?.toUpperCase().trim();
  switch (p) {
    case 'CRITICAL': return 'CRITICAL';
    case 'HIGH': return 'HIGH';
    case 'MEDIUM': return 'MEDIUM';
    case 'LOW': return 'LOW';
    default: return 'MEDIUM';
  }
}

function mapStatus(status: string): TreatmentStatus {
  const s = status?.toUpperCase().trim().replace(/ /g, '_');
  switch (s) {
    case 'DRAFT': return 'DRAFT';
    case 'PENDING_APPROVAL': return 'PROPOSED';
    case 'PROPOSED': return 'PROPOSED';
    case 'APPROVED': return 'APPROVED';
    case 'IN_PROGRESS': return 'IN_PROGRESS';
    case 'COMPLETED': return 'COMPLETED';
    case 'ON_HOLD': return 'ON_HOLD';
    case 'CANCELLED': return 'CANCELLED';
    default: return 'DRAFT';
  }
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

async function seedTreatmentPlans() {
  console.log('🌱 Starting Treatment Plans seed...');

  // Get organisation and user for relationships
  const org = await prisma.organisationProfile.findFirst();
  const user = await prisma.user.findFirst();

  if (!org || !user) {
    console.error('❌ Organisation or User not found. Run main seed first.');
    return;
  }

  console.log(`📋 Reading Treatment Plans from Excel...`);
  
  // Try common sheet names
  let rows = readExcelSheet(EXCEL_FILE, 'Treatment_Plans');
  if (rows.length === 0) {
    rows = readExcelSheet(EXCEL_FILE, 'TreatmentPlans');
  }
  if (rows.length === 0) {
    rows = readExcelSheet(EXCEL_FILE, 'Sheet1');
  }

  console.log(`   Found ${rows.length} treatment plans in Excel`);

  if (rows.length === 0) {
    console.log('   No treatment plans found to import');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows as TreatmentPlanRow[]) {
    const treatmentId = row['Plan_ID'] || row.Treatment_ID || row['Treatment ID'] || '';
    if (!treatmentId) {
      skipped++;
      continue;
    }

    // Check if already exists
    const existing = await prisma.treatmentPlan.findFirst({
      where: { treatmentId }
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Find linked risk - required field
    const riskIdCode = row['Risk_ID'] || row.Risk_ID || row['Risk ID'] || '';
    let risk = null;
    if (riskIdCode) {
      risk = await prisma.risk.findFirst({
        where: { riskId: riskIdCode }
      });
    }

    // If no risk found, try to find first available risk
    if (!risk) {
      risk = await prisma.risk.findFirst();
    }

    if (!risk) {
      console.log(`   Skipping ${treatmentId}: No risk found to link`);
      skipped++;
      continue;
    }

    try {
      await prisma.treatmentPlan.create({
        data: {
          treatmentId,
          title: row['Title'] || `Treatment Plan ${treatmentId}`,
          description: row['Description'] || '',
          treatmentType: mapTreatmentType(row['Treatment_Type'] || 'MITIGATE'),
          priority: mapPriority(row['Priority'] || 'MEDIUM'),
          status: mapStatus(row['Status'] || 'DRAFT'),
          estimatedCost: row['Budget_Estimated'],
          actualCost: row['Budget_Actual'] || undefined,
          targetStartDate: parseDate(row['Created_Date']),
          targetEndDate: parseDate(row['Target_Date']),
          actualEndDate: parseDate(row['Completion_Date']),
          organisationId: org.id,
          createdById: user.id,
          riskId: risk.id
        }
      });
      created++;
    } catch (error) {
      console.error(`   Error creating treatment plan ${treatmentId}:`, error);
      skipped++;
    }
  }

  console.log(`   ✅ Created ${created} treatment plans (${skipped} skipped)`);
}

async function main() {
  try {
    await seedTreatmentPlans();
    console.log('\n✅ Treatment Plans seed completed.');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();









