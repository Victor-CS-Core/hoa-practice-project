import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Profile Management', () => {
  test('uploaded hosted URLs are hidden in profile edit inputs', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await page.goto('/profile/casey');

    await page.getByRole('button', { name: /edit profile/i }).click();

    await expect(
      page.getByText(/the current uploaded image link is hidden\./i).first(),
    ).toBeVisible();

    const avatarUrlInput = page
      .locator('label:has-text("Avatar Image URL")')
      .locator('xpath=following::input[1]')
      .first();
    await expect(avatarUrlInput).toHaveValue('');

    await page.getByPlaceholder(/e\.g\., jane doe/i).fill('Casey Updated');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Casey Updated' }),
    ).toBeVisible();
  });
});
