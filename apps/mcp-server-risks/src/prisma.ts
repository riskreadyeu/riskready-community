import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
  log: process.env['MCP_DEBUG'] ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

// Ensure clean shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
