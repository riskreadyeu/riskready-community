import { PrismaClient, ControlTheme, ImplementationStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const EXCEL_DIR = path.join(__dirname, '../../../../../_temp/ISO27001');
const SOA_FILE = 'ISO27001_Risk_Methodology_Template.xlsx';
const SOA_SHEET = '4.Statement_of_Applicability';

interface SOARow {
  control_id: string;
  theme: string;
  control_name: string;
  applicable: string;
  justification_if_na?: string;
  parent_risk_id?: string;
  scenario_ids?: string;
  implementation_status?: string;
  implementation_description?: string;
}

function mapTheme(theme: string): ControlTheme {
  const themeMap: Record<string, ControlTheme> = {
    'Organisational': 'ORGANISATIONAL',
    'Organizational': 'ORGANISATIONAL',
    'People': 'PEOPLE',
    'Physical': 'PHYSICAL',
    'Technological': 'TECHNOLOGICAL',
    'Technology': 'TECHNOLOGICAL',
  };
  return themeMap[theme] || 'ORGANISATIONAL';
}

function mapImplementationStatus(status?: string): ImplementationStatus {
  if (!status) return 'NOT_STARTED';
  const statusMap: Record<string, ImplementationStatus> = {
    'Implemented': 'IMPLEMENTED',
    'IMPLEMENTED': 'IMPLEMENTED',
    'Partial': 'PARTIAL',
    'PARTIAL': 'PARTIAL',
    'Not Started': 'NOT_STARTED',
    'NOT_STARTED': 'NOT_STARTED',
    'Not Implemented': 'NOT_STARTED',
  };
  return statusMap[status] || 'NOT_STARTED';
}

function parseApplicable(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().trim();
  return lower === 'yes' || lower === 'true' || lower === '1';
}

export async function seedSOA(organisationId: string, createdById?: string) {
  console.log('📋 Seeding Statement of Applicability...');

  const filePath = path.join(EXCEL_DIR, SOA_FILE);
  
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch (error) {
    console.error(`❌ Failed to read SOA file: ${filePath}`);
    throw error;
  }

  const sheet = workbook.Sheets[SOA_SHEET];
  if (!sheet) {
    console.error(`❌ Sheet "${SOA_SHEET}" not found in ${SOA_FILE}`);
    throw new Error(`Sheet "${SOA_SHEET}" not found`);
  }

  const rows = XLSX.utils.sheet_to_json<SOARow>(sheet);
  console.log(`   Found ${rows.length} SOA entries in Excel`);

  // Get existing controls for linking
  const controls = await prisma.control.findMany({
    where: { organisationId },
    select: { id: true, controlId: true },
  });
  const controlMap = new Map(controls.map(c => [c.controlId, c.id]));

  // Check if SOA already exists for this organisation
  const existingSoa = await prisma.statementOfApplicability.findFirst({
    where: { organisationId, version: '1.0' },
  });

  if (existingSoa) {
    console.log('   SOA v1.0 already exists, skipping seed');
    return existingSoa;
  }

  // Create SOA with entries
  const soa = await prisma.statementOfApplicability.create({
    data: {
      version: '1.0',
      name: 'Initial Statement of Applicability',
      notes: 'Imported from ISO27001_Risk_Methodology_Template.xlsx',
      status: 'DRAFT',
      organisationId,
      createdById,
      updatedById: createdById,
      entries: {
        create: rows
          .filter(row => row.control_id && row.control_name)
          .map(row => {
            // Normalize control ID (remove "A." prefix if present for matching)
            const normalizedId = row.control_id.replace(/^A\./, '');
            const controlRecordId = controlMap.get(normalizedId) || controlMap.get(row.control_id);

            return {
              controlId: row.control_id,
              controlName: row.control_name,
              theme: mapTheme(row.theme),
              applicable: parseApplicable(row.applicable),
              justificationIfNa: row.justification_if_na || null,
              implementationStatus: mapImplementationStatus(row.implementation_status),
              implementationDesc: row.implementation_description || null,
              parentRiskId: row.parent_risk_id || null,
              scenarioIds: row.scenario_ids || null,
              controlRecordId: controlRecordId || null,
            };
          }),
      },
    },
    include: {
      entries: true,
      _count: { select: { entries: true } },
    },
  });

  console.log(`   ✅ Created SOA v${soa.version} with ${soa._count.entries} entries`);

  // Also update Control records with SOA data
  let updatedControls = 0;
  for (const row of rows) {
    if (!row.control_id) continue;
    
    const normalizedId = row.control_id.replace(/^A\./, '');
    const controlRecordId = controlMap.get(normalizedId) || controlMap.get(row.control_id);
    
    if (controlRecordId) {
      await prisma.control.update({
        where: { id: controlRecordId },
        data: {
          applicable: parseApplicable(row.applicable),
          justificationIfNa: row.justification_if_na || null,
          implementationStatus: mapImplementationStatus(row.implementation_status),
          implementationDesc: row.implementation_description || null,
        },
      });
      updatedControls++;
    }
  }

  console.log(`   ✅ Updated ${updatedControls} Control records with SOA data`);

  return soa;
}

// Allow running directly
if (require.main === module) {
  (async () => {
    try {
      // Get first organisation
      const org = await prisma.organisationProfile.findFirst();
      if (!org) {
        console.error('No organisation found');
        process.exit(1);
      }

      // Get admin user
      const admin = await prisma.user.findFirst();

      await seedSOA(org.id, admin?.id);
      console.log('✅ SOA seeding complete');
    } catch (error) {
      console.error('❌ SOA seeding failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
