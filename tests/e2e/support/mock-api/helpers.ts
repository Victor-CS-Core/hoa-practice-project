import type { Route } from '@playwright/test';
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

function getTokenFromAuthHeader(authHeader: string | undefined) {
  if (!authHeader) return '';
  const [, token] = authHeader.split(' ');
  return token ?? '';
}

export function resolveCurrentUser(route: Route, state: State) {
  const token = getTokenFromAuthHeader(route.request().headers().authorization);
  if (!token) return null;
  return state.usersByToken.get(token) ?? null;
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
