import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * Playwright Configuration for RiskReady Web E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup - runs first, saves login state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    // iPad tests for responsiveness
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPad Pro 11'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],

  // Run local dev servers before starting tests
  // In CI, servers are started fresh. Locally, reuse running servers.
  webServer: [
    {
      command: 'PORT=4001 npx ts-node-dev --transpile-only --respawn -r dotenv/config src/main.ts',
      url: 'http://localhost:4001/api/health',
      cwd: path.join(__dirname, '..', 'server'),
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
