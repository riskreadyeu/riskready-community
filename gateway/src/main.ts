// gateway/src/main.ts

import { loadConfig } from './config.js';
import { Gateway } from './gateway.js';
import { logger } from './logger.js';

async function main() {
  const config = loadConfig();

  logger.info('RiskReady Gateway starting...');
  logger.info({ port: config.port }, 'Gateway port');
  logger.info({ database: config.databaseUrl.replace(/\/\/.*@/, '//***@') }, 'Database');

  const gateway = new Gateway(config);
  await gateway.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    await gateway.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal error');
  process.exit(1);
});
