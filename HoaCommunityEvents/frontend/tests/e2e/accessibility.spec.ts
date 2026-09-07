import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installMockApi } from './support/mockApi';

async function expectNoA11yViolations(page: Page, routeLabel: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'section508'])
    .analyze();

  const summary = results.violations
    .map((violation) => {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' > '))
        .join(' | ');
      return `${violation.id}: ${violation.help} :: ${targets}`;
    })
    .join('\n');

  expect(
    results.violations,
    `Accessibility violations found on ${routeLabel}${summary ? `\n${summary}` : ''}`,
  ).toEqual([]);
}

async function gotoAndAudit(page: Page, url: string, routeLabel: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*,*::before,*::after { transition: none !important; animation: none !important; }' });
  await expectNoA11yViolations(page, routeLabel);
}

for (const colorScheme of ['light', 'dark'] as const) {
test.describe(`Section 508 / WCAG 2 AA audit (${colorScheme})`, () => {
  test.use({ colorScheme });
  test('profile zoom sliders have distinct labels and support keyboard adjustment', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });
    await page.goto('/profile/casey');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    for (const name of ['Avatar zoom', 'Banner zoom']) {
      const slider = page.getByRole('slider', { name: new RegExp(name, 'i') });
      await expect(slider).toBeVisible();
      await slider.focus();
      await slider.press('ArrowRight');
      await expect(slider).toHaveValue('1.05');
    }
    await page.addStyleTag({ content: '*,*::before,*::after { transition: none !important; animation: none !important; }' });
    await expectNoA11yViolations(page, 'profile edit');
  });

  test('profile role badge has readable text on a controlled surface', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await installMockApi(page, { initialSession: 'resident' });
    await page.goto('/profile/casey');
    const badge = page.locator('.badge-solid');
    await expect(badge).toBeVisible();
    // Transparent image-backed badges evade automatic contrast determination.
    // Require a controlled surface, then let axe measure the real rendered pair.
    const opaque = await badge.evaluate((element) => {
      const color = getComputedStyle(element).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3] === 255;
    });
    expect(opaque, 'Role text must not depend on the uploaded banner for contrast').toBe(true);
    const results = await new AxeBuilder({ page }).include('.badge-solid')
      .withRules(['color-contrast']).analyze();
    expect(results.violations).toEqual([]);
    expect(results.incomplete).toEqual([]);
  });

  test('guest-visible route set has no accessibility violations', async ({ page }) => {
    await installMockApi(page);

    await gotoAndAudit(page, '/login', 'guest:/login');
    await gotoAndAudit(page, '/register', 'guest:/register');
  });

  test('resident route set has no accessibility violations', async ({ page }) => {
    await installMockApi(page, { initialSession: 'resident' });

    await gotoAndAudit(page, '/', 'resident:/');
    await gotoAndAudit(page, '/events', 'resident:/events');
    await gotoAndAudit(page, '/events/event-1', 'resident:/events/event-1');
    await gotoAndAudit(page, '/profile/casey', 'resident:/profile/casey');
  });

  test('admin route set has no accessibility violations', async ({ page }) => {
    await installMockApi(page, { initialSession: 'admin' });

    await gotoAndAudit(page, '/', 'admin:/');
    await gotoAndAudit(page, '/admin/events', 'admin:/admin/events');
    await gotoAndAudit(page, '/admin/attendees', 'admin:/admin/attendees');
    await gotoAndAudit(page, '/admin/users', 'admin:/admin/users');
  });
  test('admin attendee roster has readable text', async ({ page }) => {
    await installMockApi(page, { initialSession: 'admin' });
    await page.goto('/events/event-1');
    await expect(page.getByRole('heading', { name: 'Admin: Attendee Roster' })).toBeVisible();
    await page.addStyleTag({ content: '*,*::before,*::after { transition: none !important; animation: none !important; }' });
    await expectNoA11yViolations(page, 'admin:event details');
  });
});
}
