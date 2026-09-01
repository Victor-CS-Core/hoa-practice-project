import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Session Expiry', () => {
  test('invalid token redirects to login and shows session expired banner', async ({ page }) => {
    await installMockApi(page, { initialToken: 'expired-token' });

    await page.goto('/events');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText(/your session expired\. please log in again\./i),
    ).toBeVisible();
  });
});
