import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Admin Attendees Route', () => {
  test('guest is redirected to login from /admin/attendees', async ({ page }) => {
    await installMockApi(page);

    await page.goto('/admin/attendees');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /welcome back, neighbor/i }),
    ).toBeVisible();
  });

  test('resident is redirected away from /admin/attendees', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-resident' });

    await page.goto('/admin/attendees');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(/welcome back, casey resident/i)).toBeVisible();
  });

  test('admin hitting /admin/attendees is redirected to /admin/users', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-admin' });

    await page.goto('/admin/attendees');

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
  });
});
