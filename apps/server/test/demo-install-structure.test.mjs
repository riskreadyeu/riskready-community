import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const composePath = new URL('../../../docker-compose.yml', import.meta.url);
const seedPath = new URL('../prisma/seed.ts', import.meta.url);

test('gateway service inherits JWT_SECRET for local installs', async () => {
  const compose = await readFile(composePath, 'utf8');
  const gatewayBlock = compose.match(/  gateway:\n([\s\S]*?)\n  web:/);

  assert.ok(gatewayBlock, 'expected gateway service block in docker-compose.yml');
  assert.match(
    gatewayBlock[1],
    /JWT_SECRET:\s*\$\{JWT_SECRET(?::[^}]*)?\}/,
    'gateway service should receive JWT_SECRET so rebuilt installs can start',
  );
});

test('demo seed does not create the legacy Acme organisation', async () => {
  const seed = await readFile(seedPath, 'utf8');

  assert.doesNotMatch(
    seed,
    /Acme Corporation/,
    'demo install seed should only create the ClearStream organisation',
  );
});
