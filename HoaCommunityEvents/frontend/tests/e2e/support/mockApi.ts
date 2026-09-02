import type { Page } from '@playwright/test';
import { getApiPath, resolveCurrentUser, setMockSession } from './mock-api/helpers';
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

  if (options.initialSession) {
    await setMockSession(page, options.initialSession);
  }

  await page.route('**/*', async (route) => {
    const parsed = getApiPath(route.request().url());
    if (!parsed) {
      await route.continue();
      return;
    }

    const context: ApiRouteContext = {
      route,
      page,
      path: parsed.path,
      query: parsed.query,
      method: route.request().method(),
      currentUser: resolveCurrentUser(route, state),
      state,
      options,
      now,
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.method) &&
      route.request().headers()['x-csrf-token'] !== state.csrfToken) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid antiforgery token.' }) });
      return;
    }

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
