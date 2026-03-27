import { PrismaClient, ControlTheme, CapabilityType, CollectionFrequency } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to Excel files
const EXCEL_DIR = path.resolve(__dirname, '../../../../../_temp/ISO27001');

interface ControlData {
  controlId: string;
  name: string;
  theme: ControlTheme;
  description?: string;
  capabilityTypes?: string;
}

interface CapabilityData {
  controlId: string;
  capabilityId: string;
  name: string;
  type: CapabilityType;
  description?: string;
  testCriteria: string;
  evidenceRequired: string;
  maxMaturityLevel: number;
  dependsOn?: string;
  l1Criteria?: string;
  l1Evidence?: string;
  l2Criteria?: string;
  l2Evidence?: string;
  l3Criteria?: string;
  l3Evidence?: string;
  l4Criteria?: string;
  l4Evidence?: string;
  l5Criteria?: string;
  l5Evidence?: string;
}

interface MetricData {
  metricId: string;
  capabilityId: string;
  name: string;
  formula: string;
  unit: string;
  greenThreshold: string;
  amberThreshold: string;
  redThreshold: string;
  collectionFrequency: CollectionFrequency;
  dataSource: string;
}

function deriveTheme(controlId: string): ControlTheme {
  const prefix = controlId.split('.')[0];
  switch (prefix) {
    case '5': return 'ORGANISATIONAL';
    case '6': return 'PEOPLE';
    case '7': return 'PHYSICAL';
    case '8': return 'TECHNOLOGICAL';
    default: return 'ORGANISATIONAL';
  }
}

function mapCapabilityType(type: string): CapabilityType {
  const normalized = type?.toLowerCase().trim();
  switch (normalized) {
    case 'process': return 'PROCESS';
    case 'technology': return 'TECHNOLOGY';
    case 'people': return 'PEOPLE';
    case 'physical': return 'PHYSICAL';
    default: return 'PROCESS';
  }
}

function mapCollectionFrequency(freq: string): CollectionFrequency {
  const normalized = freq?.toLowerCase().trim();
  if (normalized?.includes('daily')) return 'DAILY';
  if (normalized?.includes('weekly')) return 'WEEKLY';
  if (normalized?.includes('monthly')) return 'MONTHLY';
  if (normalized?.includes('quarterly')) return 'QUARTERLY';
  if (normalized?.includes('annual')) return 'ANNUAL';
  if (normalized?.includes('per event')) return 'PER_EVENT';
  if (normalized?.includes('per incident')) return 'PER_INCIDENT';
  return 'MONTHLY';
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

async function importControls(organisationId: string, userId: string): Promise<Map<string, string>> {
  console.log('📋 Importing controls...');
  
  const controlAssuranceFile = path.join(EXCEL_DIR, 'ISO27001_Control_Assurance_Enhanced.xlsx');
  const controlSummaryData = readExcelSheet(controlAssuranceFile, 'Control_Summary');
  
  const controlMap = new Map<string, string>(); // controlId -> database id
  const uniqueControls = new Map<string, ControlData>();
  
  // Extract unique controls from Control_Summary
  for (const row of controlSummaryData) {
    const controlId = String(row['Control_ID'] || '').trim();
    if (!controlId) continue;
    
    if (!uniqueControls.has(controlId)) {
      uniqueControls.set(controlId, {
        controlId,
        name: String(row['Control_Name'] || ''),
        theme: deriveTheme(controlId),
        capabilityTypes: String(row['Capability_Types'] || ''),
      });
    }
  }
  
  console.log(`  Found ${uniqueControls.size} unique controls`);
  
  // Insert controls
  for (const [controlId, data] of uniqueControls) {
    try {
      const control = await prisma.control.upsert({
        where: {
          controlId_organisationId: {
            controlId: data.controlId,
            organisationId,
          },
        },
        update: {
          name: data.name,
          theme: data.theme,
          description: data.capabilityTypes,
          updatedById: userId,
        },
        create: {
          controlId: data.controlId,
          name: data.name,
          theme: data.theme,
          description: data.capabilityTypes,
          organisationId,
          createdById: userId,
          updatedById: userId,
        },
      });
      controlMap.set(controlId, control.id);
    } catch (error) {
      console.error(`  Error importing control ${controlId}:`, error);
    }
  }
  
  console.log(`  ✅ Imported ${controlMap.size} controls`);
  return controlMap;
}

async function importCapabilities(
  controlMap: Map<string, string>,
  userId: string
): Promise<Map<string, string>> {
  console.log('🔧 Importing capabilities...');
  
  const controlAssuranceFile = path.join(EXCEL_DIR, 'ISO27001_Control_Assurance_Enhanced.xlsx');
  const maturityFile = path.join(EXCEL_DIR, 'ISO27001_Maturity_Assessment.xlsx');
  
  const capabilitiesData = readExcelSheet(controlAssuranceFile, 'Control_Capabilities');
  const maturityData = readExcelSheet(maturityFile, 'Maturity_Assessment');
  
  // Create maturity lookup by capability ID
  const maturityLookup = new Map<string, any>();
  for (const row of maturityData) {
    const capId = String(row['Capability_ID'] || '').trim();
    if (capId) {
      maturityLookup.set(capId, row);
    }
  }
  
  const capabilityMap = new Map<string, string>(); // capabilityId -> database id
  let importedCount = 0;
  
  for (const row of capabilitiesData) {
    const controlId = String(row['Control_ID'] || '').trim();
    const capabilityId = String(row['Capability_ID'] || '').trim();
    
    if (!controlId || !capabilityId) continue;
    
    const dbControlId = controlMap.get(controlId);
    if (!dbControlId) {
      console.warn(`  Control ${controlId} not found for capability ${capabilityId}`);
      continue;
    }
    
    // Get maturity data
    const maturity = maturityLookup.get(capabilityId) || {};
    
    const capabilityData: CapabilityData = {
      controlId: dbControlId,
      capabilityId,
      name: String(row['Capability_Name'] || ''),
      type: mapCapabilityType(String(row['Capability_Type'] || '')),
      description: String(row['Description'] || ''),
      testCriteria: String(row['Test_Criteria'] || ''),
      evidenceRequired: String(row['Evidence_Required'] || ''),
      maxMaturityLevel: parseInt(String(maturity['Max_Level'] || '5')) || 5,
      dependsOn: String(maturity['Depends_On'] || '') || undefined,
      l1Criteria: String(maturity['L1_Criteria'] || '') || undefined,
      l1Evidence: String(maturity['L1_Evidence'] || '') || undefined,
      l2Criteria: String(maturity['L2_Criteria'] || '') || undefined,
      l2Evidence: String(maturity['L2_Evidence'] || '') || undefined,
      l3Criteria: String(maturity['L3_Criteria'] || '') || undefined,
      l3Evidence: String(maturity['L3_Evidence'] || '') || undefined,
      l4Criteria: String(maturity['L4_Criteria'] || '') || undefined,
      l4Evidence: String(maturity['L4_Evidence'] || '') || undefined,
      l5Criteria: String(maturity['L5_Criteria'] || '') || undefined,
      l5Evidence: String(maturity['L5_Evidence'] || '') || undefined,
    };
    
    try {
      const capability = await prisma.capability.upsert({
        where: {
          capabilityId_controlId: {
            capabilityId: capabilityData.capabilityId,
            controlId: capabilityData.controlId,
          },
        },
        update: {
          name: capabilityData.name,
          type: capabilityData.type,
          description: capabilityData.description,
          testCriteria: capabilityData.testCriteria,
          evidenceRequired: capabilityData.evidenceRequired,
          maxMaturityLevel: capabilityData.maxMaturityLevel,
          dependsOn: capabilityData.dependsOn,
          l1Criteria: capabilityData.l1Criteria,
          l1Evidence: capabilityData.l1Evidence,
          l2Criteria: capabilityData.l2Criteria,
          l2Evidence: capabilityData.l2Evidence,
          l3Criteria: capabilityData.l3Criteria,
          l3Evidence: capabilityData.l3Evidence,
          l4Criteria: capabilityData.l4Criteria,
          l4Evidence: capabilityData.l4Evidence,
          l5Criteria: capabilityData.l5Criteria,
          l5Evidence: capabilityData.l5Evidence,
          updatedById: userId,
        },
        create: {
          capabilityId: capabilityData.capabilityId,
          controlId: capabilityData.controlId,
          name: capabilityData.name,
          type: capabilityData.type,
          description: capabilityData.description,
          testCriteria: capabilityData.testCriteria,
          evidenceRequired: capabilityData.evidenceRequired,
          maxMaturityLevel: capabilityData.maxMaturityLevel,
          dependsOn: capabilityData.dependsOn,
          l1Criteria: capabilityData.l1Criteria,
          l1Evidence: capabilityData.l1Evidence,
          l2Criteria: capabilityData.l2Criteria,
          l2Evidence: capabilityData.l2Evidence,
          l3Criteria: capabilityData.l3Criteria,
          l3Evidence: capabilityData.l3Evidence,
          l4Criteria: capabilityData.l4Criteria,
          l4Evidence: capabilityData.l4Evidence,
          l5Criteria: capabilityData.l5Criteria,
          l5Evidence: capabilityData.l5Evidence,
          createdById: userId,
          updatedById: userId,
        },
      });
      capabilityMap.set(capabilityId, capability.id);
      importedCount++;
    } catch (error) {
      console.error(`  Error importing capability ${capabilityId}:`, error);
    }
  }
  
  console.log(`  ✅ Imported ${importedCount} capabilities`);
  return capabilityMap;
}

async function importMetrics(
  capabilityMap: Map<string, string>,
  userId: string
): Promise<number> {
  console.log('📊 Importing metrics...');
  
  const metricsFile = path.join(EXCEL_DIR, 'ISO27001_Capability_Metrics (1).xlsx');
  const metricsData = readExcelSheet(metricsFile, 'Capability_Metrics');
  
  let importedCount = 0;
  
  for (const row of metricsData) {
    const metricId = String(row['Metric_ID'] || '').trim();
    const capabilityId = String(row['Capability_ID'] || '').trim();
    
    if (!metricId || !capabilityId) continue;
    
    const dbCapabilityId = capabilityMap.get(capabilityId);
    if (!dbCapabilityId) {
      console.warn(`  Capability ${capabilityId} not found for metric ${metricId}`);
      continue;
    }
    
    const metricData: MetricData = {
      metricId,
      capabilityId: dbCapabilityId,
      name: String(row['Metric_Name'] || ''),
      formula: String(row['Metric_Formula'] || ''),
      unit: String(row['Unit'] || '%'),
      greenThreshold: String(row['Green'] || ''),
      amberThreshold: String(row['Amber'] || ''),
      redThreshold: String(row['Red'] || ''),
      collectionFrequency: mapCollectionFrequency(String(row['Collection_Frequency'] || '')),
      dataSource: String(row['Data_Source'] || ''),
    };
    
    try {
      await prisma.capabilityMetric.upsert({
        where: {
          metricId_capabilityId: {
            metricId: metricData.metricId,
            capabilityId: metricData.capabilityId,
          },
        },
        update: {
          name: metricData.name,
          formula: metricData.formula,
          unit: metricData.unit,
          greenThreshold: metricData.greenThreshold,
          amberThreshold: metricData.amberThreshold,
          redThreshold: metricData.redThreshold,
          collectionFrequency: metricData.collectionFrequency,
          dataSource: metricData.dataSource,
          updatedById: userId,
        },
        create: {
          metricId: metricData.metricId,
          capabilityId: metricData.capabilityId,
          name: metricData.name,
          formula: metricData.formula,
          unit: metricData.unit,
          greenThreshold: metricData.greenThreshold,
          amberThreshold: metricData.amberThreshold,
          redThreshold: metricData.redThreshold,
          collectionFrequency: metricData.collectionFrequency,
          dataSource: metricData.dataSource,
          createdById: userId,
          updatedById: userId,
        },
      });
      importedCount++;
    } catch (error) {
      console.error(`  Error importing metric ${metricId}:`, error);
    }
  }
  
  console.log(`  ✅ Imported ${importedCount} metrics`);
  return importedCount;
}

export async function seedControls() {
  console.log('\n🚀 Starting Controls module seed...\n');
  
  // Get or create organisation
  let organisation = await prisma.organisationProfile.findFirst();
  if (!organisation) {
    console.log('Creating default organisation...');
    organisation = await prisma.organisationProfile.create({
      data: {
        name: 'Default Organisation',
        legalName: 'Default Organisation Ltd',
        employeeCount: 100,
      },
    });
  }
  
  // Get admin user
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@riskready.com' },
  });
  if (!adminUser) {
    console.log('Admin user not found, creating...');
    const bcrypt = await import('bcryptjs');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@riskready.com',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      },
    });
  }
  
  const organisationId = organisation.id;
  const userId = adminUser.id;
  
  console.log(`Organisation: ${organisation.name} (${organisationId})`);
  console.log(`User: ${adminUser.email} (${userId})\n`);
  
  // Import in order: Controls -> Capabilities -> Metrics -> SOA
  const controlMap = await importControls(organisationId, userId);
  const capabilityMap = await importCapabilities(controlMap, userId);
  await importMetrics(capabilityMap, userId);
  
  // Import SOA
  const { seedSOA } = await import('./seed-soa');
  await seedSOA(organisationId, userId);
  
  // Print summary
  const controlCount = await prisma.control.count({ where: { organisationId } });
  const capabilityCount = await prisma.capability.count();
  const metricCount = await prisma.capabilityMetric.count();
  const soaCount = await prisma.statementOfApplicability.count({ where: { organisationId } });
  const soaEntryCount = await prisma.sOAEntry.count();
  
  console.log('\n📈 Final counts:');
  console.log(`  Controls: ${controlCount}`);
  console.log(`  Capabilities: ${capabilityCount}`);
  console.log(`  Metrics: ${metricCount}`);
  console.log(`  SOA Versions: ${soaCount}`);
  console.log(`  SOA Entries: ${soaEntryCount}`);
  console.log('\n✅ Controls module seed complete!\n');
}

// Run if called directly
if (require.main === module) {
  seedControls()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
