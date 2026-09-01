import { expect, type Locator, type Page } from '@playwright/test';

export class AdminDashboardPage {
  constructor(private readonly page: Page) {}

  rowByName(namePattern: RegExp): Locator {
    return this.page.getByRole('row', { name: namePattern });
  }

  async openActionsMenuForRow(namePattern: RegExp): Promise<void> {
    const row = this.rowByName(namePattern);
    await row.getByRole('button', { name: /open menu/i }).click();
  }

  async clickAction(namePattern: RegExp): Promise<void> {
    const menuItem = this.page.getByRole('menuitem', { name: namePattern });
    if ((await menuItem.count()) > 0) {
      await menuItem.first().click();
      return;
    }

    await this.page.getByRole('button', { name: namePattern }).click();
  }

  async publishEventFromRow(namePattern: RegExp): Promise<void> {
    await this.openActionsMenuForRow(namePattern);
    await this.clickAction(/publish event/i);
    await expect(this.page.getByText(/event published successfully/i)).toBeVisible();
  }

  async deleteEventFromRow(namePattern: RegExp): Promise<void> {
    await this.openActionsMenuForRow(namePattern);
    await this.clickAction(/delete event/i);
    await this.page.getByRole('button', { name: /yes, delete/i }).click();
    await expect(this.page.getByText(/event deleted successfully/i)).toBeVisible();
  }
}
