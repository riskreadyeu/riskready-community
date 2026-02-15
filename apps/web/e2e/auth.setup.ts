import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '..', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox').first().fill('admin@local.test');
  await page.locator('input[type="password"]').fill('admin123456');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.locator('body')).not.toBeEmpty();
  await page.context().storageState({ path: authFile });
});
