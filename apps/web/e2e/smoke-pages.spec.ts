/**
 * Smoke Tests: Page Load Verification
 *
 * Navigates to every list/dashboard page as a logged-in user and asserts:
 * - Page renders visible content (not blank)
 * - No ErrorBoundary "Something went wrong" message
 * - No uncaught JS exceptions
 *
 * Run with: npx playwright test smoke-pages
 */

import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect JS errors during a page visit. */
async function expectPageLoads(page: Page, path: string) {
  const jsErrors: string[] = [];
  const onError = (err: Error) => jsErrors.push(err.message);
  page.on('pageerror', onError);

  await page.goto(path);

  // Wait for network to settle so async-loaded content appears
  await page.waitForLoadState('networkidle');

  // Page should not be blank
  const body = page.locator('body');
  await expect(body).not.toBeEmpty();

  // No ErrorBoundary crash screen
  const errorBoundary = page.getByText('Something went wrong');
  await expect(errorBoundary).not.toBeVisible();

  // No uncaught JS exceptions
  expect(jsErrors, `JS errors on ${path}: ${jsErrors.join(', ')}`).toHaveLength(0);

  page.off('pageerror', onError);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

test.describe('Dashboard', () => {
  test('loads main dashboard', async ({ page }) => {
    await expectPageLoads(page, '/dashboard');
  });
});

// ---------------------------------------------------------------------------
// Risks Module
// ---------------------------------------------------------------------------

test.describe('Risks Module', () => {
  test('loads risks dashboard', async ({ page }) => {
    await expectPageLoads(page, '/risks');
  });

  test('loads risk register', async ({ page }) => {
    await expectPageLoads(page, '/risks/register');
  });

  test('loads risk tolerance list', async ({ page }) => {
    await expectPageLoads(page, '/risks/tolerance');
  });

  test('loads treatment plans list', async ({ page }) => {
    await expectPageLoads(page, '/risks/treatments');
  });
});

// ---------------------------------------------------------------------------
// Controls Module
// ---------------------------------------------------------------------------

test.describe('Controls Module', () => {
  test('loads controls command center', async ({ page }) => {
    await expectPageLoads(page, '/controls');
  });

  test('loads controls dashboard', async ({ page }) => {
    await expectPageLoads(page, '/controls/dashboard');
  });

  test('loads controls library', async ({ page }) => {
    await expectPageLoads(page, '/controls/library');
  });

  test('loads SOA list', async ({ page }) => {
    await expectPageLoads(page, '/controls/soa');
  });

  test('loads scope registry', async ({ page }) => {
    await expectPageLoads(page, '/controls/scope');
  });
});

// ---------------------------------------------------------------------------
// Policies Module
// ---------------------------------------------------------------------------

test.describe('Policies Module', () => {
  test('loads policies dashboard', async ({ page }) => {
    await expectPageLoads(page, '/policies');
  });

  test('loads policy documents', async ({ page }) => {
    await expectPageLoads(page, '/policies/documents');
  });

  test('loads document hierarchy', async ({ page }) => {
    await expectPageLoads(page, '/policies/hierarchy');
  });

  test('loads version history', async ({ page }) => {
    await expectPageLoads(page, '/policies/versions');
  });

  test('loads approvals', async ({ page }) => {
    await expectPageLoads(page, '/policies/approvals');
  });

  test('loads change requests', async ({ page }) => {
    await expectPageLoads(page, '/policies/changes');
  });

  test('loads exceptions', async ({ page }) => {
    await expectPageLoads(page, '/policies/exceptions');
  });

  test('loads acknowledgments', async ({ page }) => {
    await expectPageLoads(page, '/policies/acknowledgments');
  });

  test('loads reviews', async ({ page }) => {
    await expectPageLoads(page, '/policies/reviews');
  });

  test('loads control mappings', async ({ page }) => {
    await expectPageLoads(page, '/policies/mappings');
  });
});

// ---------------------------------------------------------------------------
// Incidents Module
// ---------------------------------------------------------------------------

test.describe('Incidents Module', () => {
  test('loads incidents dashboard', async ({ page }) => {
    await expectPageLoads(page, '/incidents');
  });

  test('loads incident register', async ({ page }) => {
    await expectPageLoads(page, '/incidents/register');
  });

  test('loads lessons learned', async ({ page }) => {
    await expectPageLoads(page, '/incidents/lessons');
  });
});

// ---------------------------------------------------------------------------
// Evidence Module
// ---------------------------------------------------------------------------

test.describe('Evidence Module', () => {
  test('loads evidence dashboard', async ({ page }) => {
    await expectPageLoads(page, '/evidence');
  });

  test('loads evidence repository', async ({ page }) => {
    await expectPageLoads(page, '/evidence/repository');
  });

  test('loads evidence requests', async ({ page }) => {
    await expectPageLoads(page, '/evidence/requests');
  });
});

// ---------------------------------------------------------------------------
// ITSM Module
// ---------------------------------------------------------------------------

test.describe('ITSM Module', () => {
  test('loads ITSM dashboard', async ({ page }) => {
    await expectPageLoads(page, '/itsm');
  });

  test('loads asset register', async ({ page }) => {
    await expectPageLoads(page, '/itsm/assets');
  });

  test('loads data quality', async ({ page }) => {
    await expectPageLoads(page, '/itsm/data-quality');
  });

  test('loads change register', async ({ page }) => {
    await expectPageLoads(page, '/itsm/changes');
  });

  test('loads change calendar', async ({ page }) => {
    await expectPageLoads(page, '/itsm/changes/calendar');
  });

  test('loads CAB dashboard', async ({ page }) => {
    await expectPageLoads(page, '/itsm/changes/cab');
  });
});

// ---------------------------------------------------------------------------
// Audits Module
// ---------------------------------------------------------------------------

test.describe('Audits Module', () => {
  test('loads audits dashboard', async ({ page }) => {
    await expectPageLoads(page, '/audits');
  });

  test('loads nonconformity register', async ({ page }) => {
    await expectPageLoads(page, '/audits/nonconformities');
  });
});

// ---------------------------------------------------------------------------
// Organisation Module
// ---------------------------------------------------------------------------

test.describe('Organisation Module', () => {
  test('loads organisation dashboard', async ({ page }) => {
    await expectPageLoads(page, '/organisation');
  });

  test('loads departments', async ({ page }) => {
    await expectPageLoads(page, '/organisation/departments');
  });

  test('loads locations', async ({ page }) => {
    await expectPageLoads(page, '/organisation/locations');
  });

  test('loads business processes', async ({ page }) => {
    await expectPageLoads(page, '/organisation/processes');
  });

  test('loads external dependencies', async ({ page }) => {
    await expectPageLoads(page, '/organisation/dependencies');
  });

  test('loads security committees', async ({ page }) => {
    await expectPageLoads(page, '/organisation/security-committees');
  });

  test('loads regulators', async ({ page }) => {
    await expectPageLoads(page, '/organisation/regulators');
  });

  test('loads executive positions', async ({ page }) => {
    await expectPageLoads(page, '/organisation/executive-positions');
  });

  test('loads security champions', async ({ page }) => {
    await expectPageLoads(page, '/organisation/security-champions');
  });

  test('loads organisation profiles', async ({ page }) => {
    await expectPageLoads(page, '/organisation/profiles');
  });

  test('loads products and services', async ({ page }) => {
    await expectPageLoads(page, '/organisation/products-services');
  });

  test('loads technology platforms', async ({ page }) => {
    await expectPageLoads(page, '/organisation/technology-platforms');
  });

  test('loads interested parties', async ({ page }) => {
    await expectPageLoads(page, '/organisation/interested-parties');
  });

  test('loads context issues', async ({ page }) => {
    await expectPageLoads(page, '/organisation/context-issues');
  });

  test('loads key personnel', async ({ page }) => {
    await expectPageLoads(page, '/organisation/key-personnel');
  });

  test('loads applicable frameworks', async ({ page }) => {
    await expectPageLoads(page, '/organisation/applicable-frameworks');
  });

  test('loads organisational units', async ({ page }) => {
    await expectPageLoads(page, '/organisation/organisational-units');
  });

  test('loads onboarding wizard', async ({ page }) => {
    await expectPageLoads(page, '/organisation/wizard');
  });
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

test.describe('Settings', () => {
  test('loads settings page', async ({ page }) => {
    await expectPageLoads(page, '/settings');
  });
});
