import type { Page } from '@playwright/test';
import { getApiPath, resolveCurrentUser } from './mock-api/helpers';
import { buildInitialState } from './mock-api/state';
import { handleAccountRoute } from './mock-api/accountHandlers';
import { handleEventRoute } from './mock-api/eventHandlers';
import { handleAttendanceRoute } from './mock-api/attendanceHandlers';
import { handleProfileRoute } from './mock-api/profileHandlers';
import { handleUploadRoute } from './mock-api/uploadHandlers';
import type { ApiRouteContext, MockApiOptions } from './mock-api/types';

export type { MockApiOptions } from './mock-api/types';

export async function installMockApi(page: Page, options: MockApiOptions = {}) {
  const now = Date.now();
  const state = buildInitialState(now);

  if (options.initialToken) {
    await page.addInitScript((token: string) => {
      window.localStorage.setItem('jwt', token);
    }, options.initialToken);
  }

  await page.route('**/*', async (route) => {
    const parsed = getApiPath(route.request().url());
    if (!parsed) {
      await route.continue();
      return;
    }

    const context: ApiRouteContext = {
      route,
      path: parsed.path,
      query: parsed.query,
      method: route.request().method(),
      currentUser: resolveCurrentUser(route, state),
      state,
      options,
      now,
    };

    const handled =
      (await handleAccountRoute(context)) ||
      (await handleEventRoute(context)) ||
      (await handleAttendanceRoute(context)) ||
      (await handleProfileRoute(context)) ||
      (await handleUploadRoute(context));

    if (handled) {
      return;
    }

    await route.continue();
  });
}
