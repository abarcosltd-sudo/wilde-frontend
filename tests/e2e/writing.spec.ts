import { test, expect } from '@playwright/test';

test.describe('Writing Studio', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: inject auth token / mock firebase
    await page.goto('/app/write/test-work-id');
  });

  test('writing studio toolbar is visible', async ({ page }) => {
    await expect(page.locator('text=Save Draft')).toBeVisible();
    await expect(page.locator('text=Publish')).toBeVisible();
  });
});
