import { PrismaClient, ControlTheme, ControlFramework, CapabilityType, CollectionFrequency, RiskTier, RiskStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to the integrated framework Excel file
const FRAMEWORK_FILE = path.resolve(__dirname, '../../../../../_temp/ISO27001/controls/Integrated_ISO27001_SOC2_NIS2_DORA_RTS_Framework.xlsx');

function readExcelSheet(filePath: string, sheetName: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`Sheet "${sheetName}" not found in ${filePath}`);
    return [];
  }
  return XLSX.utils.sheet_to_json(sheet);
}

function mapFramework(framework: string): ControlFramework {
  const fw = framework?.toUpperCase().trim();
  switch (fw) {
    case 'ISO': return 'ISO';
    case 'SOC2': return 'SOC2';
    case 'NIS2': return 'NIS2';
    case 'DORA': return 'DORA';
    default: return 'ISO';
  }
}

function mapTheme(controlId: string, framework: string): ControlTheme {
  // For non-ISO frameworks, derive theme from control type or default to ORGANISATIONAL
  if (framework !== 'ISO') {
    // SOC2 Processing Integrity -> TECHNOLOGICAL, Privacy -> ORGANISATIONAL, etc.
    if (controlId.includes('PI.') || controlId.includes('AV.')) return 'TECHNOLOGICAL';
    if (controlId.includes('PR.')) return 'ORGANISATIONAL';
    if (controlId.includes('INC.') || controlId.includes('GOV.')) return 'ORGANISATIONAL';
    if (controlId.includes('SCM.') || controlId.includes('TPM.')) return 'ORGANISATIONAL';
    if (controlId.includes('VUL.') || controlId.includes('TEST.')) return 'TECHNOLOGICAL';
    return 'ORGANISATIONAL';
  }
  
  // For ISO controls, derive from control ID prefix
  const prefix = controlId.split('.')[0].replace('A.', '');
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

function mapRiskTier(tier: string): RiskTier {
  const normalized = tier?.toLowerCase().trim();
  switch (normalized) {
    case 'core': return 'CORE';
    case 'extended': return 'EXTENDED';
    case 'advanced': return 'ADVANCED';
    default: return 'CORE';
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

async function importControls(organisationId: string, userId: string): Promise<Map<string, string>> {
  console.log('📋 Importing multi-framework controls...');
  
  const controlsData = readExcelSheet(FRAMEWORK_FILE, '1.Controls');
  console.log(`  Found ${controlsData.length} controls in Excel`);
  
  const controlMap = new Map<string, string>(); // controlId -> database id
  let imported = 0;
  let updated = 0;
  
  for (const row of controlsData) {
    const controlId = String(row['Control_ID'] || '').trim();
    if (!controlId) continue;
    
    const framework = mapFramework(String(row['Framework'] || 'ISO'));
    const theme = mapTheme(controlId, String(row['Framework'] || 'ISO'));
    
    try {
      const control = await prisma.control.upsert({
        where: {
          controlId_organisationId: {
            controlId,
            organisationId,
          },
        },
        update: {
          name: String(row['Control_Name'] || ''),
          framework,
          sourceStandard: String(row['Source_Standard'] || ''),
          soc2Criteria: row['SOC2_Criteria'] ? String(row['SOC2_Criteria']) : undefined,
          tscCategory: row['TSC_Category'] ? String(row['TSC_Category']) : undefined,
          updatedById: userId,
        },
        create: {
          controlId,
          name: String(row['Control_Name'] || ''),
          theme,
          framework,
          sourceStandard: String(row['Source_Standard'] || ''),
          soc2Criteria: row['SOC2_Criteria'] ? String(row['SOC2_Criteria']) : undefined,
          tscCategory: row['TSC_Category'] ? String(row['TSC_Category']) : undefined,
          organisationId,
          createdById: userId,
          updatedById: userId,
        },
      });
      controlMap.set(controlId, control.id);
      if (control.createdAt.getTime() === control.updatedAt.getTime()) {
        imported++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error(`  Error importing control ${controlId}:`, error);
    }
  }
  
  console.log(`  ✅ Imported ${imported} new controls, updated ${updated} existing`);
  return controlMap;
}

async function importCapabilities(controlMap: Map<string, string>, userId: string): Promise<Map<string, string>> {
  console.log('\n🔧 Importing capabilities...');
  
  const capabilitiesData = readExcelSheet(FRAMEWORK_FILE, '2.Capabilities');
  console.log(`  Found ${capabilitiesData.length} capabilities in Excel`);
  
  const capabilityMap = new Map<string, string>();
  let imported = 0;
  let skipped = 0;
  
  for (const row of capabilitiesData) {
    const controlId = String(row['Control_ID'] || '').trim();
    const capabilityId = String(row['Capability_ID'] || '').trim();
    
    if (!controlId || !capabilityId) continue;
    
    const dbControlId = controlMap.get(controlId);
    if (!dbControlId) {
      skipped++;
      continue;
    }
    
    try {
      const capability = await prisma.capability.upsert({
        where: {
          capabilityId_controlId: {
            capabilityId,
            controlId: dbControlId,
          },
        },
        update: {
          name: String(row['Capability_Name'] || ''),
          type: mapCapabilityType(String(row['Capability_Type'] || '')),
          description: row['Description'] ? String(row['Description']) : undefined,
          testCriteria: String(row['Test_Criteria'] || ''),
          evidenceRequired: String(row['Evidence_Required'] || ''),
          updatedById: userId,
        },
        create: {
          capabilityId,
          controlId: dbControlId,
          name: String(row['Capability_Name'] || ''),
          type: mapCapabilityType(String(row['Capability_Type'] || '')),
          description: row['Description'] ? String(row['Description']) : undefined,
          testCriteria: String(row['Test_Criteria'] || ''),
          evidenceRequired: String(row['Evidence_Required'] || ''),
          createdById: userId,
          updatedById: userId,
        },
      });
      capabilityMap.set(capabilityId, capability.id);
      imported++;
    } catch (error) {
      console.error(`  Error importing capability ${capabilityId}:`, error);
      skipped++;
    }
  }
  
  console.log(`  ✅ Imported ${imported} capabilities (${skipped} skipped)`);
  return capabilityMap;
}

async function importRisks(organisationId: string, userId: string): Promise<Map<string, string>> {
  console.log('\n⚠️  Importing risks...');
  
  const risksData = readExcelSheet(FRAMEWORK_FILE, '3.Risks');
  console.log(`  Found ${risksData.length} risks in Excel`);
  
  const riskMap = new Map<string, string>();
  let imported = 0;
  
  for (const row of risksData) {
    const riskId = String(row['Risk_ID'] || '').trim();
    if (!riskId) continue;
    
    try {
      const risk = await prisma.risk.upsert({
        where: {
          riskId_organisationId: {
            riskId,
            organisationId,
          },
        },
        update: {
          title: String(row['Title'] || ''),
          description: row['Description'] ? String(row['Description']) : undefined,
          tier: mapRiskTier(String(row['Tier'] || 'Core')),
          orgSize: row['Org_Size'] ? String(row['Org_Size']) : undefined,
          framework: mapFramework(String(row['Framework'] || 'ISO')),
          soc2Criteria: row['SOC2_Criteria'] ? String(row['SOC2_Criteria']) : undefined,
          tscCategory: row['TSC_Category'] ? String(row['TSC_Category']) : undefined,
          updatedById: userId,
        },
        create: {
          riskId,
          title: String(row['Title'] || ''),
          description: row['Description'] ? String(row['Description']) : undefined,
          tier: mapRiskTier(String(row['Tier'] || 'Core')),
          orgSize: row['Org_Size'] ? String(row['Org_Size']) : undefined,
          framework: mapFramework(String(row['Framework'] || 'ISO')),
          soc2Criteria: row['SOC2_Criteria'] ? String(row['SOC2_Criteria']) : undefined,
          tscCategory: row['TSC_Category'] ? String(row['TSC_Category']) : undefined,
          organisationId,
          createdById: userId,
          updatedById: userId,
        },
      });
      riskMap.set(riskId, risk.id);
      imported++;
    } catch (error) {
      console.error(`  Error importing risk ${riskId}:`, error);
    }
  }
  
  console.log(`  ✅ Imported ${imported} risks`);
  return riskMap;
}

async function importRiskScenarios(riskMap: Map<string, string>, userId: string): Promise<number> {
  console.log('\n📊 Importing risk scenarios...');
  
  const scenariosData = readExcelSheet(FRAMEWORK_FILE, '4.Risk_Scenarios');
  console.log(`  Found ${scenariosData.length} scenarios in Excel`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of scenariosData) {
    const scenarioId = String(row['Scenario_ID'] || '').trim();
    const parentRiskId = String(row['Parent_Risk_ID'] || '').trim();
    
    if (!scenarioId || !parentRiskId) continue;
    
    const dbRiskId = riskMap.get(parentRiskId);
    if (!dbRiskId) {
      skipped++;
      continue;
    }
    
    try {
      await prisma.riskScenario.upsert({
        where: {
          scenarioId_riskId: {
            scenarioId,
            riskId: dbRiskId,
          },
        },
        update: {
          title: String(row['Title'] || ''),
          cause: row['Cause'] ? String(row['Cause']) : undefined,
          event: row['Event'] ? String(row['Event']) : undefined,
          consequence: row['Consequence'] ? String(row['Consequence']) : undefined,
          framework: mapFramework(String(row['Framework'] || 'ISO')),
          controlIds: row['Controls'] ? String(row['Controls']) : undefined,
          updatedById: userId,
        },
        create: {
          scenarioId,
          riskId: dbRiskId,
          title: String(row['Title'] || ''),
          cause: row['Cause'] ? String(row['Cause']) : undefined,
          event: row['Event'] ? String(row['Event']) : undefined,
          consequence: row['Consequence'] ? String(row['Consequence']) : undefined,
          framework: mapFramework(String(row['Framework'] || 'ISO')),
          controlIds: row['Controls'] ? String(row['Controls']) : undefined,
          createdById: userId,
          updatedById: userId,
        },
      });
      imported++;
    } catch (error) {
      console.error(`  Error importing scenario ${scenarioId}:`, error);
      skipped++;
    }
  }
  
  console.log(`  ✅ Imported ${imported} scenarios (${skipped} skipped)`);
  return imported;
}

async function importKRIs(riskMap: Map<string, string>, userId: string): Promise<number> {
  console.log('\n📈 Importing Key Risk Indicators...');
  
  const krisData = readExcelSheet(FRAMEWORK_FILE, '5.KRIs');
  console.log(`  Found ${krisData.length} KRIs in Excel`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of krisData) {
    const kriId = String(row['KRI_ID'] || '').trim();
    const parentRiskId = String(row['Parent_Risk_ID'] || '').trim();
    
    if (!kriId || !parentRiskId) continue;
    
    const dbRiskId = riskMap.get(parentRiskId);
    if (!dbRiskId) {
      skipped++;
      continue;
    }
    
    try {
      await prisma.keyRiskIndicator.upsert({
        where: {
          kriId_riskId: {
            kriId,
            riskId: dbRiskId,
          },
        },
        update: {
          name: String(row['Name'] || ''),
          description: row['Description'] ? String(row['Description']) : undefined,
          formula: row['Formula'] ? String(row['Formula']) : undefined,
          unit: String(row['Unit'] || '%'),
          thresholdGreen: row['Threshold_Green'] ? String(row['Threshold_Green']) : undefined,
          thresholdAmber: row['Threshold_Amber'] ? String(row['Threshold_Amber']) : undefined,
          thresholdRed: row['Threshold_Red'] ? String(row['Threshold_Red']) : undefined,
          frequency: mapCollectionFrequency(String(row['Frequency'] || 'Monthly')),
          dataSource: row['Data_Source'] ? String(row['Data_Source']) : undefined,
          automated: row['Automated'] === 'Yes' || row['Automated'] === true,
          tier: mapRiskTier(String(row['Tier'] || 'Core')),
          framework: mapFramework(String(row['Framework'] || 'ISO')),
          soc2Criteria: row['SOC2_Criteria'] ? String(row['SOC2_Criteria']) : undefined,
          updatedById: userId,
        },
        create: {
          kriId,
          riskId: dbRiskId,
          name: String(row['Name'] || ''),
          description: row['Description'] ? String(row['Description']) : undefined,
          formula: row['Formula'] ? String(row['Formula']) : undefined,
          unit: String(row['Unit'] || '%'),
          thresholdGreen: row['Threshold_Green'] ? String(row['Threshold_Green']) : undefined,
          thresholdAmber: row['Threshold_Amber'] ? String(row['Threshold_Amber']) : undefined,
          thresholdRed: row['Threshold_Red'] ? String(row['Threshold_Red']) : undefined,
          frequency: mapCollectionFrequency(String(row['Frequency'] || 'Monthly')),
          dataSource: row['Data_Source'] ? String(row['Data_Source']) : undefined,
          automated: row['Automated'] === 'Yes' || row['Automated'] === true,
          tier: mapRiskTier(String(row['Tier'] || 'Core')),
          framework: mapFramework(String(row['Framework'] || 'ISO')),
          soc2Criteria: row['SOC2_Criteria'] ? String(row['SOC2_Criteria']) : undefined,
          createdById: userId,
          updatedById: userId,
        },
      });
      imported++;
    } catch (error) {
      console.error(`  Error importing KRI ${kriId}:`, error);
      skipped++;
    }
  }
  
  console.log(`  ✅ Imported ${imported} KRIs (${skipped} skipped)`);
  return imported;
}

export async function seedMultiFramework() {
  console.log('\n🚀 Starting Multi-Framework Import...\n');
  
  // Get organisation
  let organisation = await prisma.organisationProfile.findFirst();
  if (!organisation) {
    throw new Error('No organisation found. Run main seed first.');
  }
  
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
  
  const organisationId = organisation.id;
  const userId = adminUser.id;
  
  console.log(`Organisation: ${organisation.name} (${organisationId})`);
  console.log(`User: ${adminUser.email} (${userId})\n`);
  
  // Import in order
  const controlMap = await importControls(organisationId, userId);
  const capabilityMap = await importCapabilities(controlMap, userId);
  const riskMap = await importRisks(organisationId, userId);
  await importRiskScenarios(riskMap, userId);
  await importKRIs(riskMap, userId);
  
  // Print summary
  const controlCount = await prisma.control.count({ where: { organisationId } });
  const capabilityCount = await prisma.capability.count();
  const riskCount = await prisma.risk.count({ where: { organisationId } });
  const scenarioCount = await prisma.riskScenario.count();
  const kriCount = await prisma.keyRiskIndicator.count();
  
  // Framework breakdown
  const byFramework = await prisma.control.groupBy({
    by: ['framework'],
    _count: true,
    where: { organisationId },
  });
  
  console.log('\n📈 Final counts:');
  console.log(`  Controls: ${controlCount}`);
  for (const fw of byFramework) {
    console.log(`    - ${fw.framework}: ${fw._count}`);
  }
  console.log(`  Capabilities: ${capabilityCount}`);
  console.log(`  Risks: ${riskCount}`);
  console.log(`  Risk Scenarios: ${scenarioCount}`);
  console.log(`  Key Risk Indicators: ${kriCount}`);
  console.log('\n✅ Multi-Framework Import complete!\n');
}

// Run if called directly
if (require.main === module) {
  seedMultiFramework()
    .catch((e) => {
      console.error('Import failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

