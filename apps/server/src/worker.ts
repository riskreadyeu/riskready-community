import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setInterval(() => {}, 60_000);
}

main();
