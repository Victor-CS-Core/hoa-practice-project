import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Admin Workflows', () => {
  test('admin can create, publish, and delete an event from dashboard', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-admin' });

    await page.goto('/admin/events');

    await expect(
      page.getByRole('heading', { name: /admin management dashboard/i }),
    ).toBeVisible();

    const pendingRow = page.getByRole('row', {
      name: /board budget review/i,
    });
    await pendingRow.getByRole('button', { name: /open menu/i }).click();
    await page.getByRole('menuitem', { name: /publish event/i }).click();
    await expect(page.getByText(/event published successfully/i)).toBeVisible();

    await page.getByRole('button', { name: /create new event/i }).click();

    await page.getByPlaceholder(/annual hoa meeting/i).fill('Playwright HOA Test Event');
    await page.getByPlaceholder(/describe the event/i).fill('Automated test coverage event');
    await page.getByPlaceholder(/board meeting/i).fill('Board Meeting');
    await page.getByPlaceholder(/clubhouse room a/i).fill('Clubhouse');

    const now = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes(),
      ).padStart(2, '0')}`;

    await page.locator('input[type="datetime-local"]').nth(0).fill(toLocal(now));
    await page.locator('input[type="datetime-local"]').nth(1).fill(toLocal(later));

    await page.getByRole('button', { name: /^create event$/i }).click();

    await expect(page.getByText(/created event/i)).toBeVisible();
    await expect(
      page.getByText('Created event: Playwright HOA Test Event'),
    ).toBeVisible();

    const createdRow = page.getByRole('row', {
      name: /playwright hoa test event/i,
    });
    await createdRow.getByRole('button', { name: /open menu/i }).click();
    await page.getByRole('menuitem', { name: /delete event/i }).click();
    await page.getByRole('button', { name: /yes, delete/i }).click();
    await expect(page.getByText(/event deleted successfully/i)).toBeVisible();
  });

  test('admin user management supports search, promote, and delete', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-admin' });

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

    await page.getByPlaceholder(/search users/i).fill('casey');
    await expect(page.getByText(/casey resident/i)).toBeVisible();

    await page.getByRole('button', { name: /promote to admin/i }).click();
    await expect(page.getByText(/updated role/i)).toBeVisible();

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole('button', { name: /delete user/i }).click();
    await expect(page.getByText(/deleted user/i)).toBeVisible();
    await expect(page.getByText(/no users match your current search\./i)).toBeVisible();
  });
});
