import { expect, test } from '@playwright/test';
import { installMockApi } from './support/mockApi';

test.describe('Auth Flows', () => {
  test('guest is redirected to login when opening protected route', async ({ page }) => {
    await installMockApi(page);

    await page.goto('/events');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /welcome back, neighbor/i }),
    ).toBeVisible();
  });

  test('resident can log in and land on home with authenticated actions', async ({ page }) => {
    await installMockApi(page);

    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('casey@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /^log in$/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: /browse events/i })).toBeVisible();
  });

  test('register creates an account and signs in', async ({ page }) => {
    await installMockApi(page);

    await page.goto('/register');
    await page.getByLabel(/display name/i).fill('Taylor Neighbor');
    await page.getByLabel(/^username$/i).fill('taylor');
    await page.getByLabel(/email address/i).fill('taylor@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(/welcome back, taylor neighbor/i)).toBeVisible();
  });

  test('shows login error when credentials are rejected', async ({ page }) => {
    await installMockApi(page, { forceLoginFailure: true });

    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('casey@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword!');
    await page.getByRole('button', { name: /^log in$/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
