import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Re-export for use by sub-modules
export { prisma };

// Shared context passed between seed modules
export interface DemoContext {
  orgId: string;
  users: {
    admin: string;    // CEO
    cto: string;      // CTO
    ciso: string;     // CISO
    cfo: string;      // CFO
    dpo: string;      // DPO
    ismsManager: string;
    securityLead: string;
    complianceOfficer: string;
    riskAnalyst: string;
  };
  departments: {
    executive: string;
    engineering: string;
    infoSec: string;
    operations: string;
    finance: string;
    peopleCulture: string;
  };
  locations: {
    dublin: string;
    berlin: string;
    lisbon: string;
  };
  // Populated by seed-controls
  controlIds: Record<string, string>;
  // Populated by seed-risks
  riskIds: Record<string, string>;
  scenarioIds: Record<string, string>;
  // Populated by seed-itsm
  assetIds: Record<string, string>;
  changeIds: Record<string, string>;
  // Populated by seed-policies
  policyIds: Record<string, string>;
  // Populated by seed-audits
  ncIds: Record<string, string>;
  // Populated by seed-incidents
  incidentIds: Record<string, string>;
  // Populated by seed-evidence
  evidenceIds: Record<string, string>;
  // Populated by seed-organisation
  businessProcessIds: Record<string, string>;
  // Populated by seed-risks
  treatmentIds: Record<string, string>;
}

async function seedUsers(): Promise<DemoContext['users']> {
  const hash = await bcrypt.hash('password123', 10);

  const userDefs = [
    { email: 'ceo@clearstream.ie',         firstName: 'Fiona',   lastName: 'Murphy',     role: 'admin' },
    { email: 'cto@clearstream.ie',          firstName: 'Lars',    lastName: 'Becker',     role: 'cto' },
    { email: 'ciso@clearstream.ie',         firstName: 'Siobhán', lastName: 'O\'Brien',   role: 'ciso' },
    { email: 'cfo@clearstream.ie',          firstName: 'Dieter',  lastName: 'Schneider',  role: 'cfo' },
    { email: 'dpo@clearstream.ie',          firstName: 'Ana',     lastName: 'Costa',      role: 'dpo' },
    { email: 'isms.manager@clearstream.ie', firstName: 'Roisín',  lastName: 'Kelly',      role: 'ismsManager' },
    { email: 'security.lead@clearstream.ie',firstName: 'Markus',  lastName: 'Weber',      role: 'securityLead' },
    { email: 'compliance@clearstream.ie',   firstName: 'Sofia',   lastName: 'Ferreira',   role: 'complianceOfficer' },
    { email: 'risk.analyst@clearstream.ie', firstName: 'Cian',    lastName: 'Doyle',      role: 'riskAnalyst' },
  ];

  const users: Record<string, string> = {};

  // These demo roles get ADMIN access in the app
  const adminRoles = new Set(['admin', 'ciso']);

  for (const def of userDefs) {
    const dbRole = adminRoles.has(def.role) ? 'ADMIN' : 'USER';
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: { role: dbRole },
      create: {
        email: def.email,
        passwordHash: hash,
        firstName: def.firstName,
        lastName: def.lastName,
        isActive: true,
        role: dbRole,
      },
    });
    users[def.role] = user.id;
  }

  return users as DemoContext['users'];
}

export async function seedDemo() {
  // Guard: skip if demo data already exists (check for ClearStream org)
  const existingOrg = await prisma.organisationProfile.findFirst({
    where: { name: 'ClearStream Payments Ltd' },
  });
  if (existingOrg) {
    console.log('⏭️  Demo data already exists, skipping...');
    return;
  }

  console.log('🚀 Seeding ClearStream Payments demo data...\n');

  // Step 0: Create users
  console.log('👤 Creating demo users...');
  const users = await seedUsers();
  console.log('  ✅ 9 users created\n');

  // Initialise context
  const ctx: DemoContext = {
    orgId: '', // set after org creation
    users,
    departments: {} as DemoContext['departments'],
    locations: {} as DemoContext['locations'],
    controlIds: {},
    riskIds: {},
    scenarioIds: {},
    assetIds: {},
    changeIds: {},
    policyIds: {},
    ncIds: {},
    incidentIds: {},
    evidenceIds: {},
    businessProcessIds: {},
    treatmentIds: {},
  };

  // Step 1: Organisation
  console.log('🏢 Seeding organisation...');
  const { seedOrganisation } = await import('./seed-organisation');
  await seedOrganisation(prisma, ctx);
  console.log('  ✅ Organisation complete\n');

  // Step 2: Controls (before risks - risks link to controls)
  console.log('🛡️  Seeding controls framework...');
  const { seedControls } = await import('./seed-controls');
  await seedControls(prisma, ctx);
  console.log('  ✅ Controls complete\n');

  // Step 3: Risks
  console.log('⚠️  Seeding risk management...');
  const { seedRisks } = await import('./seed-risks');
  await seedRisks(prisma, ctx);
  console.log('  ✅ Risks complete\n');

  // Step 4: ITSM (assets needed by incidents)
  console.log('🖥️  Seeding ITSM / assets...');
  const { seedItsm } = await import('./seed-itsm');
  await seedItsm(prisma, ctx);
  console.log('  ✅ ITSM complete\n');

  // Step 5: Incidents
  console.log('🚨 Seeding incidents...');
  const { seedIncidentsDemo } = await import('./seed-incidents');
  await seedIncidentsDemo(prisma, ctx);
  console.log('  ✅ Incidents complete\n');

  // Step 6: Policies
  console.log('📋 Seeding policies...');
  const { seedPolicies } = await import('./seed-policies');
  await seedPolicies(prisma, ctx);
  console.log('  ✅ Policies complete\n');

  // Step 6b: ISO 27001 Policy Documents (18 additional)
  console.log('📋 Seeding ISO 27001 policy documents...');
  const { seedPoliciesIso27001 } = await import('./seed-policies-iso27001');
  await seedPoliciesIso27001(prisma, ctx);
  console.log('  ✅ ISO 27001 policies complete\n');

  // Step 7: Audits / Nonconformities
  console.log('🔍 Seeding audits...');
  const { seedAudits } = await import('./seed-audits');
  await seedAudits(prisma, ctx);
  console.log('  ✅ Audits complete\n');

  // Step 8: Evidence
  console.log('📎 Seeding evidence...');
  const { seedEvidence } = await import('./seed-evidence');
  await seedEvidence(prisma, ctx);
  console.log('  ✅ Evidence complete\n');

  // Step 9: Dashboard trend data
  console.log('📊 Seeding dashboard data...');
  const { seedDashboard } = await import('./seed-dashboard');
  await seedDashboard(prisma, ctx);
  console.log('  ✅ Dashboard complete\n');

  // Step 10: Agentic AI platform data
  console.log('🤖 Seeding agentic AI platform...');
  const { seedAgentic } = await import('./seed-agentic');
  await seedAgentic(prisma, ctx);
  console.log('  ✅ Agentic AI complete\n');

  // Step 11: Cross-entity relationships
  console.log('🔗 Seeding cross-entity relationships...');
  const { seedRelationships } = await import('./seed-relationships');
  await seedRelationships(prisma, ctx);
  console.log('  ✅ Relationships complete\n');

  console.log('🎉 ClearStream Payments demo data seeded successfully!');
  console.log('   Login: ceo@clearstream.ie / password123');
  console.log('   Or:    ciso@clearstream.ie / password123\n');
}
