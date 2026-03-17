/**
 * Scenario-Control Mapping Script
 * 
 * Maps risk scenarios to their specific controls from the spreadsheet.
 * Updates the controlIds field on each RiskScenario.
 */

const { PrismaClient } = require('../apps/server/node_modules/@prisma/client');
const prisma = new PrismaClient();

// Scenario-Control mappings from spreadsheet (ISO controls only)
// Truncated IDs are already corrected to match database IDs
const SCENARIO_CONTROL_MAPPINGS = {
  'R-01-S01': 'A.5.1',                    // Policies
  'R-01-S02': 'A.5.2, A.5.4',             // Roles & responsibilities
  'R-01-S03': 'A.5.3',                    // Segregation of duties
  'R-02-S01': 'A.5.5',                    // Authority contacts
  'R-02-S02': 'A.5.6',                    // Security communities
  'R-02-S03': 'A.5.7',                    // Threat intelligence
  'R-03-S01': 'A.5.8',                    // Security in projects
  'R-03-S02': 'A.5.37',                   // Operating procedures
  'R-03-S03': 'A.8.32',                   // Change management
  'R-04-S01': 'A.5.9',                    // Asset inventory
  'R-04-S02': 'A.5.1',                    // Acceptable use (A.5.10 → A.5.1)
  'R-04-S03': 'A.5.11',                   // Return of assets
  'R-05-S01': 'A.5.12, A.5.13',           // Classification & labeling
  'R-05-S02': 'A.5.14',                   // Information transfer
  'R-05-S03': 'A.8.1',                    // Information deletion (A.8.10 → A.8.1)
  'R-05-S04': 'A.8.11',                   // Data masking
  'R-06-S01': 'A.5.17, A.8.5',            // Authentication
  'R-06-S02': 'A.5.18, A.8.2, A.8.3',     // Access rights, networks, outsourced dev
  'R-06-S03': 'A.5.16, A.5.18',           // Identity management
  'R-06-S04': 'A.5.15, A.5.16',           // Access control
  'R-07-S01': 'A.5.19, A.5.2, A.5.22',    // Supplier relationships (A.5.20 → A.5.2)
  'R-07-S02': 'A.5.21',                   // ICT supply chain
  'R-07-S03': 'A.5.22',                   // Supplier monitoring
  'R-07-S04': 'A.5.23',                   // Cloud services
  'R-07-S05': 'A.8.3',                    // Outsourced development (A.8.30 → A.8.3)
  'R-08-S01': 'A.8.5, A.5.23',            // Cloud authentication
  'R-08-S02': 'A.8.9, A.5.23',            // Cloud configuration
  'R-08-S03': 'A.5.23',                   // Cloud services
  'R-09-S01': 'A.6.1',                    // Screening
  'R-09-S02': 'A.6.2, A.6.6',             // Terms & conditions
  'R-09-S03': 'A.6.4',                    // Disciplinary process
  'R-09-S04': 'A.6.5',                    // Termination responsibilities
  'R-10-S01': 'A.6.3',                    // Awareness training
  'R-10-S02': 'A.6.3',                    // Awareness training
  'R-10-S03': 'A.6.8',                    // Information security event reporting
  'R-11-S01': 'A.6.7',                    // Remote working
  'R-11-S02': 'A.7.9, A.8.1',             // Off-premises security
  'R-12-S01': 'A.7.1, A.7.2, A.7.3',      // Physical security perimeters
  'R-12-S02': 'A.7.4',                    // Physical security monitoring
  'R-12-S03': 'A.7.7',                    // Clear desk/screen
  'R-12-S04': 'A.7.6, A.7.8',             // Secure areas, equipment
  'R-13-S01': 'A.7.5',                    // Environmental threats
  'R-13-S02': 'A.7.11',                   // Supporting utilities
  'R-13-S03': 'A.7.12',                   // Cabling security
  'R-14-S01': 'A.7.9',                    // Off-premises security
  'R-14-S02': 'A.7.1',                    // Storage media (A.7.10 → A.7.1)
  'R-14-S03': 'A.7.14',                   // Secure disposal
  'R-15-S01': 'A.8.1',                    // User endpoint devices
  'R-15-S02': 'A.8.19',                   // Software installation
  'R-15-S03': 'A.8.1',                    // User endpoint devices
  'R-16-S01': 'A.8.7',                    // Malware protection
  'R-16-S02': 'A.8.7',                    // Malware protection
  'R-17-S01': 'A.8.22',                   // Network segregation
  'R-17-S02': 'A.8.2, A.8.21',            // Networks security (A.8.20 → A.8.2)
  'R-17-S03': 'A.8.23',                   // Web filtering
  'R-18-S01': 'A.8.8',                    // Vulnerability management
  'R-18-S02': 'A.8.9',                    // Configuration management
  'R-18-S03': 'A.8.8',                    // Vulnerability management
  'R-19-S01': 'A.8.26',                   // Application security requirements
  'R-19-S02': 'A.8.25, A.8.28',           // SDLC, secure coding
  'R-19-S03': 'A.8.29',                   // Security testing
  'R-19-S04': 'A.8.31, A.8.33',           // Separation of environments
  'R-20-S01': 'A.8.27, A.8.28',           // Secure architecture
  'R-20-S02': 'A.8.4',                    // Access to source code
  'R-20-S03': 'A.8.26, A.8.28',           // Application security
  'R-21-S01': 'A.8.24',                   // Cryptography
  'R-21-S02': 'A.8.24',                   // Cryptography
  'R-22-S01': 'A.8.15',                   // Logging
  'R-22-S02': 'A.8.16',                   // Monitoring
  'R-22-S03': 'A.8.17',                   // Clock synchronization
  'R-23-S01': 'A.5.24, A.5.26',           // Incident planning & response
  'R-23-S02': 'A.5.28',                   // Evidence collection
  'R-23-S03': 'A.5.27',                   // Learning from incidents
  'R-24-S01': 'A.8.13',                   // Backup
  'R-24-S02': 'A.5.3, A.8.14',            // ICT readiness (A.5.30 → A.5.3)
  'R-24-S03': 'A.5.29',                   // BC during disruption
  'R-25-S01': 'A.5.34',                   // Operating procedures
  'R-25-S02': 'A.5.32',                   // Independent review
  'R-25-S03': 'A.5.33',                   // Compliance with policies
  'R-25-S04': 'A.5.35, A.5.36, A.8.34',   // IPR, records, audit protection
};

// Map framework-specific scenarios to ISO controls where applicable
const FRAMEWORK_SCENARIO_MAPPINGS = {
  // SOC2 Availability - link to ISO continuity controls
  'R-AV-01-S01': 'A.8.6, A.8.13, A.8.14',   // Capacity management, backup
  'R-AV-01-S02': 'A.8.6, A.5.29',           // Capacity, BC
  'R-AV-01-S03': 'A.8.14',                   // Redundancy
  
  // NIS2 scenarios - link to ISO controls
  'R-NIS2-01-S01': 'A.5.24, A.5.25',        // Incident reporting → Incident mgmt
  'R-NIS2-01-S02': 'A.5.26, A.5.27',        // Incident response
  'R-NIS2-01-S03': 'A.5.28',                // Evidence collection
  'R-NIS2-02-S01': 'A.5.1, A.5.4',          // Management body → Governance
  'R-NIS2-02-S02': 'A.5.2, A.5.4',          // Management responsibilities
  'R-NIS2-02-S03': 'A.5.1, A.5.3',          // Governance
  'R-NIS2-03-S01': 'A.5.19, A.5.21',        // Supply chain
  'R-NIS2-03-S02': 'A.5.22, A.5.23',        // Supplier services
  'R-NIS2-03-S03': 'A.5.21',                // ICT supply chain
  'R-NIS2-04-S01': 'A.8.8',                 // Vulnerability disclosure
  'R-NIS2-04-S02': 'A.8.8',                 // Vulnerability management
  'R-NIS2-05-S01': 'A.5.31, A.5.35',        // Legal compliance
  'R-NIS2-05-S02': 'A.5.1, A.5.4',          // Governance
  'R-NIS2-05-S03': 'A.5.35, A.5.36',        // Records protection
  'R-NIS2-05-S04': 'A.5.31',                // Legal requirements
  
  // DORA scenarios - link to ISO controls
  'R-DORA-01-S01': 'A.5.24, A.5.25',        // Incident reporting
  'R-DORA-01-S02': 'A.5.26',                // Incident response
  'R-DORA-01-S03': 'A.5.28',                // Evidence collection
  'R-DORA-02-S01': 'A.8.29',                // Resilience testing
  'R-DORA-02-S02': 'A.8.8',                 // Vulnerability management
  'R-DORA-02-S03': 'A.8.29',                // Security testing
  'R-DORA-03-S01': 'A.8.29',                // TLPT → Security testing
  'R-DORA-03-S02': 'A.8.8',                 // Vulnerability testing
  'R-DORA-03-S03': 'A.8.29',                // Security testing
  'R-DORA-04-S01': 'A.5.19, A.5.22',        // Third-party concentration
  'R-DORA-04-S02': 'A.5.21',                // ICT supply chain
  'R-DORA-04-S03': 'A.5.22, A.5.23',        // Supplier monitoring
  'R-DORA-05-S01': 'A.5.19',                // Third-party register
  'R-DORA-05-S02': 'A.5.22',                // Supplier monitoring
  'R-DORA-05-S03': 'A.5.21',                // ICT supply chain
  'R-DORA-06-S01': 'A.5.19, A.5.23',        // Critical third-party
  'R-DORA-06-S02': 'A.5.21, A.5.22',        // Supply chain
  'R-DORA-06-S03': 'A.5.22, A.5.23',        // Cloud and suppliers
  
  // SOC2 Processing Integrity - link to ISO controls
  'R-PI-01-S01': 'A.8.27, A.8.28',          // Input validation → Secure coding
  'R-PI-01-S02': 'A.8.4',                   // Source code access
  'R-PI-01-S03': 'A.8.26',                  // Application security
  'R-PI-02-S01': 'A.8.25, A.8.28',          // Processing accuracy → SDLC
  'R-PI-02-S02': 'A.8.29',                  // Security testing
  'R-PI-02-S03': 'A.8.26',                  // Application security
  'R-PI-03-S01': 'A.8.13',                  // Output integrity → Backup
  'R-PI-03-S02': 'A.8.14',                  // Redundancy
  
  // SOC2 Privacy - link to ISO controls
  'R-PR-01-S01': 'A.5.33, A.5.34',          // Consent → Privacy controls
  'R-PR-01-S02': 'A.5.33',                  // Compliance
  'R-PR-01-S03': 'A.5.34',                  // Procedures
  'R-PR-02-S01': 'A.5.33, A.5.34',          // Data subject rights
  'R-PR-02-S02': 'A.5.34',                  // Procedures
  'R-PR-02-S03': 'A.5.33',                  // Compliance
  'R-PR-03-S01': 'A.5.34',                  // Disclosure notification
  'R-PR-03-S02': 'A.5.33',                  // Compliance
  'R-PR-04-S01': 'A.5.33, A.5.34',          // PII quality
  'R-PR-04-S02': 'A.5.34',                  // Procedures
};

// Combine all mappings
const ALL_MAPPINGS = { ...SCENARIO_CONTROL_MAPPINGS, ...FRAMEWORK_SCENARIO_MAPPINGS };

async function mapScenariosToControls() {
  console.log('🔗 Starting Scenario-Control Mapping...\n');
  
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  
  for (const [scenarioId, controlIds] of Object.entries(ALL_MAPPINGS)) {
    // Find scenario by scenarioId
    const scenario = await prisma.riskScenario.findFirst({
      where: { scenarioId }
    });
    
    if (!scenario) {
      // Try alternate format
      const altScenarioId = scenarioId.replace(/-S0/, '-S');
      const altScenario = await prisma.riskScenario.findFirst({
        where: { scenarioId: altScenarioId }
      });
      
      if (!altScenario) {
        console.log(`⚠️  ${scenarioId}: Scenario not found`);
        notFoundCount++;
        continue;
      }
    }
    
    const targetScenario = scenario || await prisma.riskScenario.findFirst({
      where: { scenarioId: scenarioId.replace(/-S0/, '-S') }
    });
    
    if (!targetScenario) {
      notFoundCount++;
      continue;
    }
    
    try {
      await prisma.riskScenario.update({
        where: { id: targetScenario.id },
        data: { controlIds }
      });
      
      console.log(`✅ ${scenarioId}: ${controlIds}`);
      successCount++;
    } catch (err) {
      console.log(`❌ ${scenarioId}: Error - ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MAPPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully mapped: ${successCount} scenarios`);
  console.log(`⚠️  Not found: ${notFoundCount} scenarios`);
  console.log(`❌ Errors: ${errorCount} scenarios`);
  
  // Verify
  const mappedScenarios = await prisma.riskScenario.count({
    where: { controlIds: { not: null } }
  });
  const totalScenarios = await prisma.riskScenario.count();
  
  console.log(`\n📋 Database Status: ${mappedScenarios}/${totalScenarios} scenarios have controls`);
}

mapScenariosToControls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

