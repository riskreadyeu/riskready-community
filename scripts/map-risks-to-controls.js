/**
 * Risk-Control Mapping Script
 * 
 * Maps risks to controls based on the integrated framework spreadsheet.
 * Source: _temp/ISO27001/controls/Integrated_ISO27001_SOC2_NIS2_DORA_RTS_Framework.xlsx
 */

// Run this from apps/server directory
const { PrismaClient } = require('../apps/server/node_modules/@prisma/client');
const prisma = new PrismaClient();

// Risk-Control mappings from the spreadsheet (Sheet 3.Risks)
// Updated to match actual risk IDs in database
const RISK_CONTROL_MAPPINGS = {
  // Core ISO 27001 Risks (R-01 to R-25)
  'R-01': ['A.5.1', 'A.5.2', 'A.5.3', 'A.5.4'],
  'R-02': ['A.5.5', 'A.5.6', 'A.5.7'],
  'R-03': ['A.5.8', 'A.5.37', 'A.8.32'],
  'R-04': ['A.5.9', 'A.5.1', 'A.5.11'],      // A.5.10 → A.5.1 (truncated ID in DB)
  'R-05': ['A.5.12', 'A.5.13', 'A.5.14', 'A.8.1', 'A.8.11'],  // A.8.10 → A.8.1
  'R-06': ['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18', 'A.8.2', 'A.8.3', 'A.8.5'],
  'R-07': ['A.5.19', 'A.5.2', 'A.5.21', 'A.5.22', 'A.5.23', 'A.8.3'],  // A.5.20 → A.5.2, A.8.30 → A.8.3
  'R-08': ['A.5.23', 'A.8.9'],
  'R-09': ['A.6.1', 'A.6.2', 'A.6.4', 'A.6.5', 'A.6.6'],
  'R-10': ['A.6.3', 'A.6.8'],
  'R-11': ['A.6.7', 'A.7.9', 'A.8.1'],
  'R-12': ['A.7.1', 'A.7.2', 'A.7.3', 'A.7.4', 'A.7.6', 'A.7.7', 'A.7.8'],
  'R-13': ['A.7.5', 'A.7.11', 'A.7.12', 'A.7.13'],
  'R-14': ['A.7.9', 'A.7.1', 'A.7.13', 'A.7.14'],  // A.7.10 → A.7.1
  'R-15': ['A.8.1', 'A.8.19'],
  'R-16': ['A.8.7'],
  'R-17': ['A.8.2', 'A.8.21', 'A.8.22', 'A.8.23'],  // A.8.20 → A.8.2
  'R-18': ['A.8.8', 'A.8.9'],
  'R-19': ['A.8.25', 'A.8.26', 'A.8.27', 'A.8.28', 'A.8.29', 'A.8.31', 'A.8.33'],
  'R-20': ['A.8.4', 'A.8.27', 'A.8.28', 'A.8.3'],   // A.8.30 → A.8.3
  'R-21': ['A.8.24'],                               // Updated per spreadsheet
  'R-22': ['A.8.15', 'A.8.16', 'A.8.17', 'A.8.18'], // Updated per spreadsheet
  'R-23': ['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27', 'A.5.28'], // Updated per spreadsheet
  'R-24': ['A.5.29', 'A.5.3', 'A.8.13', 'A.8.14'],  // A.5.30 → A.5.3
  'R-25': ['A.5.31', 'A.5.32', 'A.5.33', 'A.5.34', 'A.5.35', 'A.5.36', 'A.8.34'], // Updated per spreadsheet
  
  // SOC2 Processing Integrity Risks (link to related ISO controls)
  'R-PI-01': ['A.8.4', 'A.8.27'],   // Input validation → Application security controls
  'R-PI-02': ['A.8.25', 'A.8.26'], // Processing accuracy → SDLC controls
  'R-PI-03': ['A.8.13', 'A.8.14'], // Output integrity → Backup controls
  
  // SOC2 Privacy Risks (link to related ISO controls)
  'R-PR-01': ['A.5.33', 'A.5.34'], // Consent → Privacy controls
  'R-PR-02': ['A.5.33', 'A.5.34'], // Data subject rights → Privacy controls
  'R-PR-03': ['A.5.34'],           // Disclosure → Privacy controls
  'R-PR-04': ['A.5.33', 'A.5.34'], // PII quality → Privacy controls
  
  // SOC2 Availability Risk
  'R-AV-01': ['A.8.13', 'A.8.14', 'A.5.29', 'A.5.3'],   // A.5.30 → A.5.3
  
  // NIS2 Risks (link to related ISO controls)
  'R-NIS2-01': ['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27', 'A.5.28'], // Incident reporting
  'R-NIS2-02': ['A.5.1', 'A.5.2', 'A.5.3', 'A.5.4'],               // Management body → Governance
  'R-NIS2-03': ['A.5.19', 'A.5.21', 'A.5.22', 'A.5.23'],           // Supply chain
  'R-NIS2-04': ['A.8.8'],                                           // Vulnerability disclosure
  'R-NIS2-05': ['A.5.31', 'A.5.35', 'A.5.36'],                     // Penalty exposure → Compliance
  
  // DORA Risks (link to related ISO controls)
  'R-DORA-01': ['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27', 'A.5.28'], // Incident reporting
  'R-DORA-02': ['A.8.8', 'A.8.29'],                                 // Resilience testing
  'R-DORA-03': ['A.8.8', 'A.8.29'],                                 // TLPT → Testing controls
  'R-DORA-04': ['A.5.19', 'A.5.21', 'A.5.22', 'A.5.23'],           // Third-party concentration
  'R-DORA-05': ['A.5.19', 'A.5.21', 'A.5.22'],                     // Third-party register
  'R-DORA-06': ['A.5.19', 'A.5.21', 'A.5.22', 'A.5.23'],           // Critical third-party
};

async function mapRisksToControls() {
  console.log('🔗 Starting Risk-Control Mapping...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundRisks = [];
  let notFoundControls = [];
  
  for (const [riskId, controlIds] of Object.entries(RISK_CONTROL_MAPPINGS)) {
    // Find risk by riskId
    const risk = await prisma.risk.findFirst({
      where: { riskId },
      include: { controls: { select: { id: true, controlId: true } } }
    });
    
    if (!risk) {
      notFoundRisks.push(riskId);
      continue;
    }
    
    // Find controls by controlId
    const controls = await prisma.control.findMany({
      where: { controlId: { in: controlIds } },
      select: { id: true, controlId: true }
    });
    
    const foundControlIds = controls.map(c => c.controlId);
    const missingControls = controlIds.filter(c => !foundControlIds.includes(c));
    if (missingControls.length > 0) {
      notFoundControls.push(...missingControls.map(c => `${riskId}:${c}`));
    }
    
    if (controls.length === 0) {
      console.log(`⚠️  ${riskId}: No matching controls found`);
      errorCount++;
      continue;
    }
    
    // Update risk with control connections
    try {
      await prisma.risk.update({
        where: { id: risk.id },
        data: {
          controls: {
            connect: controls.map(c => ({ id: c.id }))
          }
        }
      });
      
      console.log(`✅ ${riskId}: Linked ${controls.length} controls (${foundControlIds.join(', ')})`);
      successCount++;
    } catch (err) {
      console.log(`❌ ${riskId}: Error - ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MAPPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully mapped: ${successCount} risks`);
  console.log(`❌ Errors: ${errorCount} risks`);
  
  if (notFoundRisks.length > 0) {
    console.log(`\n⚠️  Risks not found in DB: ${notFoundRisks.join(', ')}`);
  }
  
  if (notFoundControls.length > 0) {
    console.log(`\n⚠️  Controls not found in DB:`);
    // Group by control to avoid duplicates
    const uniqueControls = [...new Set(notFoundControls.map(c => c.split(':')[1]))];
    console.log(`   ${uniqueControls.join(', ')}`);
  }
  
  // Verify final state
  console.log('\n' + '='.repeat(60));
  console.log('📋 VERIFICATION - Sample Mappings');
  console.log('='.repeat(60));
  
  const verifyRisks = await prisma.risk.findMany({
    take: 10,
    orderBy: { riskId: 'asc' },
    include: { controls: { select: { controlId: true } } }
  });
  
  for (const r of verifyRisks) {
    const controls = r.controls.map(c => c.controlId).join(', ') || 'NONE';
    console.log(`${r.riskId}: ${controls}`);
  }
}

mapRisksToControls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

