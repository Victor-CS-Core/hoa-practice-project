import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Routing Regressions', () => {
  test('/home route resolves for authenticated users', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await page.goto('/home');

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(/welcome back, casey resident/i)).toBeVisible();
  });

  test('deprecated /events/create route redirects to /events', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await page.goto('/events/create');

    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByText(/community calendar/i)).toBeVisible();
  });

  test('deprecated /events/:id/edit route redirects to details page', async ({ page }) => {
    await installMockApi(page, { initialSession: 'admin' });

    await page.goto('/events/event-1/edit');

    await expect(page).toHaveURL(/\/events\/event-1\/?$/);
    await expect(
      page.getByRole('heading', { name: /pool safety workshop/i }),
    ).toBeVisible();
  });

  test('unknown route renders not found page for authenticated users', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await page.goto('/definitely-not-a-real-route');

    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
  });
});
