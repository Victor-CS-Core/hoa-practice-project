import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Resident Event Experience', () => {
  test('resident can filter events and join/leave from list', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-resident' });

    await page.goto('/events');

    await expect(page.getByText(/community calendar/i)).toBeVisible();

    await page.getByRole('button', { name: /^board meeting$/i }).click();
    await expect(
      page.getByRole('heading', { name: /board budget review/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /^all$/i }).first().click();
    await page.getByRole('button', { name: /^join event$/i }).first().click();
    await expect(page.getByRole('button', { name: /joined/i }).first()).toBeVisible();

    await page.getByRole('button', { name: /joined/i }).first().click();
    await expect(page.getByRole('button', { name: /^join event$/i }).first()).toBeVisible();
  });

  test('resident can open details and use attendance action card', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-resident' });

    await page.goto('/events');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await expect(page).toHaveURL(/\/events\//);
    await expect(page.getByRole('heading', { name: /pool safety workshop/i })).toBeVisible();

    const leaveButton = page.getByRole('button', { name: /leave event/i });
    if (await leaveButton.isVisible()) {
      await leaveButton.click();
      await expect(page.getByRole('button', { name: /join event/i })).toBeVisible();
    }
  });
});
