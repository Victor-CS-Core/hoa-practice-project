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
  await expectNoA11yViolations(page, routeLabel);
}

test.describe('Section 508 / WCAG 2 AA audit', () => {
  test('guest-visible route set has no accessibility violations', async ({ page }) => {
    await installMockApi(page);

    await gotoAndAudit(page, '/login', 'guest:/login');
    await gotoAndAudit(page, '/register', 'guest:/register');
  });

  test('resident route set has no accessibility violations', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-resident' });

    await gotoAndAudit(page, '/', 'resident:/');
    await gotoAndAudit(page, '/events', 'resident:/events');
    await gotoAndAudit(page, '/events/event-1', 'resident:/events/event-1');
    await gotoAndAudit(page, '/profile/casey', 'resident:/profile/casey');
  });

  test('admin route set has no accessibility violations', async ({ page }) => {
    await installMockApi(page, { initialToken: 'token-admin' });

    await gotoAndAudit(page, '/admin/events', 'admin:/admin/events');
    await gotoAndAudit(page, '/admin/attendees', 'admin:/admin/attendees');
    await gotoAndAudit(page, '/admin/users', 'admin:/admin/users');
    await gotoAndAudit(page, '/admin/design-system', 'admin:/admin/design-system');
  });
});
