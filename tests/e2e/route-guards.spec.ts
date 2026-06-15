import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Route Guards', () => {
  test('guest is redirected from admin routes to login', async ({ page }) => {
    await installMockApi(page);

    await page.goto('/admin/events');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /welcome back, neighbor/i }),
    ).toBeVisible();
  });

  test('resident is redirected away from admin routes', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-resident' });

    await page.goto('/admin/events');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(/welcome back, casey resident/i)).toBeVisible();
  });

  test('admin can access admin dashboard', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-admin' });

    await page.goto('/admin/events');

    await expect(
      page.getByRole('heading', { name: /admin management dashboard/i }),
    ).toBeVisible();
  });
});
