import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Session Expiry', () => {
  test('a protected request after session expiry shows the session expired banner', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await page.goto('/events');
    await expect(page.getByText(/community calendar/i)).toBeVisible();
    await page.context().clearCookies();
    await page.getByRole('button', { name: /joined/i }).first().click();
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText(/your session expired\. please log in again\./i),
    ).toBeVisible();
  });
});
