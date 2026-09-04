import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Session Expiry', () => {
  test('a protected request after session expiry shows the session expired banner', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await page.goto('/events');
    await expect(page.getByText(/community calendar/i)).toBeVisible();
    const joinedButton = page.getByRole('button', { name: /joined/i }).first();
    await expect(joinedButton).toBeVisible();
    await page.context().clearCookies();
    const expiredAttendanceResponse = page.waitForResponse((response) =>
      response.status() === 401 &&
      /\/api\/attendance\/[^/]+\/leave$/.test(new URL(response.url()).pathname),
    );
    await joinedButton.click();
    await expiredAttendanceResponse;
    await expect.poll(() =>
      page.evaluate(() => sessionStorage.getItem('sessionExpired')),
    ).toBe('1');
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText(/your session expired\. please log in again\./i),
    ).toBeVisible();
  });
});
