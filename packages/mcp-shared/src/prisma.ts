import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
  log: process.env['MCP_DEBUG'] ? ['query', 'warn', 'error'] : ['warn', 'error'],
  datasources: {
    db: {
      url: process.env['DATABASE_URL'],
    },
  },
});

// Configure connection pool via DATABASE_URL query params:
// ?connection_limit=5&pool_timeout=10

// Ensure clean shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
