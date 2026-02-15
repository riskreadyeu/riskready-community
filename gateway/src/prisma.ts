// gateway/src/prisma.ts

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.GATEWAY_DEBUG === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
