import type { Page, Route } from '@playwright/test';
import type { EventItem, State, User } from './types';

export function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export function getApiPath(urlString: string) {
  const url = new URL(urlString);
  const marker = '/api';
  const index = url.pathname.indexOf(marker);
  if (index === -1) return null;
  const raw = url.pathname.slice(index + marker.length) || '/';
  return { path: raw, query: url.searchParams };
}

function getCookie(cookieHeader: string | undefined, name: string) {
  return cookieHeader?.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function getMockSession(route: Route) {
  return getCookie(route.request().headers().cookie, 'mock-session');
}

export function resolveCurrentUser(route: Route, state: State) {
  const session = getMockSession(route);
  return session ? state.sessions.get(session) ?? null : null;
}

export async function setMockSession(page: Page, session?: string) {
  await page.context().addCookies([{
    name: 'mock-session',
    value: session ?? '',
    url: 'http://127.0.0.1:4173',
    httpOnly: true,
    sameSite: 'Lax',
    ...(session ? {} : { expires: 0 }),
  }]);
}

export function toEventView(event: EventItem, currentUser: User | null) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    locationWithinCommunity: event.locationWithinCommunity,
    startDate: event.startDate,
    endDate: event.endDate,
    maxAttendees: event.maxAttendees,
    imageUrl: event.imageUrl,
    imagePositionX: event.imagePositionX,
    imagePositionY: event.imagePositionY,
    imageZoom: event.imageZoom,
    hostUserId: event.hostUserId,
    hostDisplayName: event.hostDisplayName,
    status: event.status,
    attendeeCount: event.attendeeCount,
    isCurrentUserAttending: currentUser
      ? event.attendingUsers.has(currentUser.username)
      : false,
  };
}
