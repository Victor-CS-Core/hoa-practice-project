import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Admin Event Image Editing', () => {
  test('uploaded hosted event image URL is hidden in edit form input', async ({ page }) => {
    await installMockApi(page, { initialSession: 'admin' });

    await page.route('https://api.cloudinary.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/event-banner.png',
        }),
      });
    });

    await page.goto('/events/event-1');
    await page.getByRole('button', { name: /edit event/i }).click();

    await expect(page.getByRole('heading', { name: /edit event/i })).toBeVisible();

    const bannerSwitch = page.getByRole('switch', { name: /use event banner/i });
    await expect(bannerSwitch).toHaveAttribute('aria-checked', 'false');
    await bannerSwitch.click();
    await expect(bannerSwitch).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: /^upload$/i }).click();

    await page.locator('#event-banner-upload').setInputFiles({
      name: 'banner.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504E470D0A1A0A', 'hex'),
    });

    await page.getByRole('button', { name: /upload image/i }).click();
    await expect(page.getByText(/image uploaded successfully/i)).toBeVisible();

    await page.getByRole('button', { name: /^url$/i }).click();

    const imageUrlInput = page
      .locator('label:has-text("Image URL")')
      .locator('xpath=following::input[1]')
      .first();

    await expect(imageUrlInput).toHaveValue('');
    await expect(
      page.getByText(/the current uploaded image link is hidden\./i),
    ).toBeVisible();
  });
});
