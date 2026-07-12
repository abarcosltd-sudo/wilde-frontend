import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('splash screen loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=WILDE')).toBeVisible();
  });

  test('sign in page is accessible', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('input[type=email]')).toBeVisible();
    await expect(page.locator('input[type=password]')).toBeVisible();
  });
});
