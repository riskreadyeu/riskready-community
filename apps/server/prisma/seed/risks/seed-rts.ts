import { PrismaClient, ToleranceLevel, RTSStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to Excel files
const EXCEL_DIR = path.resolve(__dirname, '../../../../../.temp/ISO27001');

interface RTSDashboardRow {
  RTS_ID: string;
  'Risk Objective': string;
  Parent_Risk_ID: string;
  Linked_KRIs: string;
}

interface RTSCondition {
  level: ToleranceLevel;
  statement: string;
  conditions: string[];
}

interface RTSDetail {
  rtsId: string;
  title: string;
  objective: string;
  parentRiskId: string;
  scenarioIds: string;
  linkedKRIs: string;
  conditions: RTSCondition[];
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

function readRTSDetails(filePath: string): RTSDetail[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['RTS_Details'];
  if (!sheet) {
    console.warn('RTS_Details sheet not found');
    return [];
  }

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const results: RTSDetail[] = [];
  
  let currentRTS: RTSDetail | null = null;
  let inConditionBlock = false;
  let currentConditions: { high: string[]; medium: string[]; low: string[] } = {
    high: [],
    medium: [],
    low: [],
  };
  let statementRow: { high: string; medium: string; low: string } = { high: '', medium: '', low: '' };

  for (let row = range.s.r; row <= range.e.r; row++) {
    const cells: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      cells.push(cell ? String(cell.v).trim() : '');
    }

    const firstCell = cells[0];
    
    // Check if this is a new RTS header (e.g., "RTS-01: Information Security Governance")
    if (firstCell.match(/^RTS-\d+:/)) {
      // Save previous RTS if exists
      if (currentRTS) {
        currentRTS.conditions = [
          { level: 'HIGH', statement: statementRow.high, conditions: currentConditions.high },
          { level: 'MEDIUM', statement: statementRow.medium, conditions: currentConditions.medium },
          { level: 'LOW', statement: statementRow.low, conditions: currentConditions.low },
        ];
        results.push(currentRTS);
      }

      // Parse RTS ID and title
      const match = firstCell.match(/^(RTS-\d+):\s*(.+)$/);
      if (match) {
        currentRTS = {
          rtsId: match[1],
          title: match[2],
          objective: '',
          parentRiskId: '',
          scenarioIds: '',
          linkedKRIs: '',
          conditions: [],
        };
        currentConditions = { high: [], medium: [], low: [] };
        statementRow = { high: '', medium: '', low: '' };
        inConditionBlock = false;
      }
      continue;
    }

    if (!currentRTS) continue;

    // Parse Objective
    if (firstCell === 'Objective:') {
      currentRTS.objective = cells[1] || '';
      continue;
    }

    // Parse Parent Risk and Scenarios
    if (firstCell === 'Parent Risk:') {
      currentRTS.parentRiskId = cells[1] || '';
      if (cells[2] === 'Scenarios:') {
        currentRTS.scenarioIds = cells[3] || '';
      }
      continue;
    }

    // Parse Linked KRIs
    if (firstCell === 'Linked KRIs:') {
      currentRTS.linkedKRIs = cells[1] || '';
      continue;
    }

    // Detect condition block header
    if (cells[1] === 'HIGH Tolerance' && cells[2] === 'MEDIUM Tolerance' && cells[3] === 'LOW Tolerance') {
      inConditionBlock = true;
      continue;
    }

    // Parse condition rows
    if (inConditionBlock) {
      if (firstCell === 'Statement') {
        statementRow.high = cells[1] || '';
        statementRow.medium = cells[2] || '';
        statementRow.low = cells[3] || '';
        continue;
      }

      if (firstCell.startsWith('Condition') || (firstCell === '' && (cells[1] || cells[2] || cells[3]))) {
        if (cells[1]) currentConditions.high.push(cells[1]);
        if (cells[2]) currentConditions.medium.push(cells[2]);
        if (cells[3]) currentConditions.low.push(cells[3]);
        continue;
      }

      // End of condition block
      if (firstCell === 'CURRENT STATE ASSESSMENT' || firstCell === '') {
        if (firstCell === 'CURRENT STATE ASSESSMENT') {
          inConditionBlock = false;
        }
      }
    }
  }

  // Don't forget the last RTS
  if (currentRTS) {
    currentRTS.conditions = [
      { level: 'HIGH', statement: statementRow.high, conditions: currentConditions.high },
      { level: 'MEDIUM', statement: statementRow.medium, conditions: currentConditions.medium },
      { level: 'LOW', statement: statementRow.low, conditions: currentConditions.low },
    ];
    results.push(currentRTS);
  }

  return results;
}

export async function seedRTS(organisationId: string, userId: string): Promise<number> {
  console.log('📋 Importing Risk Tolerance Statements...');

  const rtsFile = path.join(EXCEL_DIR, 'ISO27001_Risk_Tolerance_Statements.xlsx');
  
  // Read dashboard for basic info
  const dashboardData = readExcelSheet(rtsFile, 'RTS_Dashboard') as RTSDashboardRow[];
  
  // Read detailed information
  const detailsData = readRTSDetails(rtsFile);

  console.log(`   Found ${dashboardData.length} RTS entries in dashboard`);
  console.log(`   Found ${detailsData.length} RTS entries with details`);

  // Create a map of details by RTS ID
  const detailsMap = new Map<string, RTSDetail>();
  for (const detail of detailsData) {
    detailsMap.set(detail.rtsId, detail);
  }

  let created = 0;
  let skipped = 0;

  for (const row of dashboardData) {
    const rtsId = row.RTS_ID;
    if (!rtsId) continue;

    // Check if already exists
    const existing = await prisma.riskToleranceStatement.findFirst({
      where: { rtsId, organisationId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const detail = detailsMap.get(rtsId);
    const title = row['Risk Objective'] || detail?.title || `Risk Tolerance Statement ${rtsId}`;
    const objective = detail?.objective || `Define acceptable risk tolerance levels for ${title}`;

    // Build conditions JSON
    const conditions = detail?.conditions || [];

    // Determine domain from title
    const domain = title;

    // Create the RTS
    try {
      await prisma.riskToleranceStatement.create({
        data: {
          rtsId,
          title,
          objective,
          domain,
          proposedToleranceLevel: 'MEDIUM', // Default to medium
          proposedRTS: `The organization maintains a MEDIUM tolerance for risks related to ${title}. ` +
            `This means implementing balanced controls that provide adequate protection while allowing operational flexibility.`,
          conditions: conditions.map(c => ({
            level: c.level,
            description: c.statement,
            proposedRts: c.statement,
            conditions: c.conditions.filter(cond => cond.trim() !== ''),
            anticipatedImpact: `Impacts related to ${title.toLowerCase()} risk management`,
          })),
          anticipatedOperationalImpact: `If tolerance thresholds are breached, the organization may face increased exposure to ${title.toLowerCase()} risks, potentially leading to security incidents, compliance violations, or operational disruptions.`,
          rationale: `This tolerance level was established based on organizational risk appetite, regulatory requirements, and industry best practices for ${title.toLowerCase()}.`,
          status: 'DRAFT',
          framework: 'ISO',
          controlIds: '', // Will be populated from mapping sheet if available
          organisationId,
          createdById: userId,
        },
      });
      created++;
    } catch (err) {
      console.error(`   ❌ Error creating RTS ${rtsId}:`, err);
    }
  }

  console.log(`   ✅ Created ${created} RTS entries (${skipped} skipped as existing)`);
  return created;
}

// Main execution when run directly
async function main() {
  console.log('🌱 Starting RTS seed...');

  // Get organisation and user
  const org = await prisma.organisationProfile.findFirst();
  const user = await prisma.user.findFirst();

  if (!org || !user) {
    console.error('❌ No organisation or user found. Run main seed first.');
    process.exit(1);
  }

  const count = await seedRTS(org.id, user.id);
  console.log(`\n✅ RTS seed completed. Created ${count} entries.`);
}

// Run if executed directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ RTS seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
