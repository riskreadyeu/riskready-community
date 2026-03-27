/**
 * Demo Organisation Seed Script
 *
 * Run this script to seed the NexusGuard Technologies demo organisation.
 * This creates a realistic medium-sized company pursuing ISO 27001
 * certification and in scope of NIS2.
 *
 * Usage:
 *   npx ts-node prisma/seed-demo.ts
 *
 * Or add to package.json scripts:
 *   "seed:demo": "ts-node prisma/seed-demo.ts"
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedDemoOrganisation } from './seed/organisation/seed-demo-organisation';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NexusGuard Demo Organisation seed...\n');

  // Check if demo organisation already exists
  const existingOrg = await prisma.organisationProfile.findFirst({
    where: { name: 'NexusGuard Technologies' },
  });

  if (existingOrg) {
    console.log('⚠️  NexusGuard Technologies organisation already exists.');
    console.log('   To reseed, first delete the existing organisation data.');
    console.log('   Organisation ID:', existingOrg.id);
    return;
  }

  // Create password hash for demo users
  const passwordHash = await bcrypt.hash('Demo123!', 10);

  // Run the demo organisation seed
  const result = await seedDemoOrganisation(prisma, passwordHash);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 NexusGuard Demo Organisation seeded successfully!');
  console.log('='.repeat(60));
  console.log('\n📋 What was created:');
  console.log(`   • Organisation Profile: NexusGuard Technologies B.V.`);
  console.log(`   • Users: ${Object.keys(result.users).length} demo users`);
  console.log(`   • Departments: ${Object.keys(result.departments).length}`);
  console.log(`   • Locations: ${Object.keys(result.locations).length}`);
  console.log(`   • Business Processes: ${Object.keys(result.processes).length}`);
  console.log(`   • Security Committees: ${Object.keys(result.committees).length}`);

  console.log('\n🔐 Demo Login Credentials:');
  console.log('   Email: martijn.devries@nexusguard.eu (CEO)');
  console.log('   Email: jan.bakker@nexusguard.eu (CISO)');
  console.log('   Password: Demo123!');

  console.log('\n📍 Company Profile:');
  console.log('   • Industry: Digital Infrastructure / ICT Services');
  console.log('   • Size: 347 employees');
  console.log('   • HQ: Amsterdam, Netherlands');
  console.log('   • Data Center: Frankfurt, Germany');

  console.log('\n📜 Compliance Status:');
  console.log('   • ISO 27001: Planning phase (65% complete)');
  console.log('   • NIS2: Important Entity - In scope');
  console.log('   • SOC 2 Type II: Certified');
  console.log('   • GDPR: Compliant (92%)');

  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
