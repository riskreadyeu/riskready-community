import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { seedDemo } from './seed/demo/index';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@riskready.com' },
      update: { role: 'ADMIN' },
      create: {
        email: 'admin@riskready.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@local.test' },
      update: { role: 'ADMIN' },
      create: {
        email: 'admin@local.test',
        passwordHash,
        firstName: 'Local',
        lastName: 'Admin',
        isActive: true,
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'john.smith@riskready.com' },
      update: {},
      create: {
        email: 'john.smith@riskready.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Smith',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.jones@riskready.com' },
      update: {},
      create: {
        email: 'sarah.jones@riskready.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Jones',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike.wilson@riskready.com' },
      update: {},
      create: {
        email: 'mike.wilson@riskready.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Wilson',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'emma.brown@riskready.com' },
      update: {},
      create: {
        email: 'emma.brown@riskready.com',
        passwordHash,
        firstName: 'Emma',
        lastName: 'Brown',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  await seedDemo();

  // Ensure admin roles are set via raw SQL (ts-node compilation can strip
  // Prisma upsert role fields depending on tsconfig settings)
  const adminEmail = process.env['ADMIN_EMAIL']?.trim().toLowerCase();
  const adminEmails = [
    'admin@riskready.com',
    'admin@local.test',
    'ceo@clearstream.ie',
    'ciso@clearstream.ie',
    ...(adminEmail ? [adminEmail] : []),
  ];
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = ANY($1)`,
    adminEmails,
  );
  console.log(`✅ Set ADMIN role for: ${adminEmails.join(', ')}`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - ${users.length} users`);
  console.log('   - ClearStream Payments demo dataset');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
