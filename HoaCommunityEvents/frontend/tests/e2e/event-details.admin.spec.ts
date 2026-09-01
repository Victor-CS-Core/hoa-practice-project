import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Admin Event Details', () => {
  test('admin can cancel event from details and view attendees', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-admin' });

    await page.goto('/events/event-1');

    await expect(
      page.getByRole('heading', { name: /pool safety workshop/i }),
    ).toBeVisible();

    await expect(page.getByText(/attendees/i).first()).toBeVisible();
    await expect(page.getByText(/casey resident/i)).toBeVisible();

    await page.getByRole('button', { name: /cancel event/i }).click();

    await expect(page.getByRole('button', { name: /publish event/i })).toBeVisible();
  });
});
