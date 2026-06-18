import { json, toEventView } from './helpers';
import type { ApiRouteContext, EventItem } from './types';

export async function handleEventRoute(context: ApiRouteContext): Promise<boolean> {
  const { path, method, query, route, currentUser, state, now } = context;

  if (path === '/events' && method === 'GET') {
    const status = query.get('status');
    const category = query.get('category');
    const page = Number(query.get('page') ?? '1');
    const pageSize = Number(query.get('pageSize') ?? '10');
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;

    let items = [...state.events];
    if (status) items = items.filter((event) => event.status === status);
    if (category) items = items.filter((event) => event.category === category);

    items.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const paged = items.slice(start, start + safePageSize).map((event) => toEventView(event, currentUser));

    await json(route, 200, {
      items: paged,
      totalCount,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    });
    return true;
  }

  if (path === '/events' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
    }

    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const id = `event-${state.events.length + 1}`;
    const next: EventItem = {
      id,
      title: String(payload.title ?? 'Untitled Event'),
      description: String(payload.description ?? ''),
      category: String(payload.category ?? 'Board Meeting'),
      locationWithinCommunity: String(payload.locationWithinCommunity ?? 'Clubhouse'),
      startDate: String(payload.startDate ?? new Date(now + 86400000).toISOString()),
      endDate: String(payload.endDate ?? new Date(now + 90000000).toISOString()),
      maxAttendees: typeof payload.maxAttendees === 'number' ? payload.maxAttendees : null,
      imageUrl: (payload.imageUrl as string | null | undefined) ?? null,
      imagePositionX: typeof payload.imagePositionX === 'number' ? payload.imagePositionX : 50,
      imagePositionY: typeof payload.imagePositionY === 'number' ? payload.imagePositionY : 50,
      imageZoom: typeof payload.imageZoom === 'number' ? payload.imageZoom : 1,
      hostUserId: 'admin-1',
      hostDisplayName: currentUser.displayName,
      status: 'Pending',
      attendeeCount: 0,
      attendingUsers: new Set<string>(),
    };

    state.events.unshift(next);
    await json(route, 201, toEventView(next, currentUser));
    return true;
  }

  const eventDetailMatch = path.match(/^\/events\/([^/]+)$/);
  if (eventDetailMatch && method === 'GET') {
    const found = state.events.find((event) => event.id === eventDetailMatch[1]);
    if (!found) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    await json(route, 200, toEventView(found, currentUser));
    return true;
  }

  if (eventDetailMatch && method === 'PUT') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
    }

    const found = state.events.find((event) => event.id === eventDetailMatch[1]);
    if (!found) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    const payload = route.request().postDataJSON() as Record<string, unknown>;
    found.title = String(payload.title ?? found.title);
    found.description = String(payload.description ?? found.description);
    found.category = String(payload.category ?? found.category);
    found.locationWithinCommunity = String(payload.locationWithinCommunity ?? found.locationWithinCommunity);
    found.startDate = String(payload.startDate ?? found.startDate);
    found.endDate = String(payload.endDate ?? found.endDate);
    found.imageUrl = (payload.imageUrl as string | null | undefined) ?? found.imageUrl;

    await json(route, 200, toEventView(found, currentUser));
    return true;
  }

  if (eventDetailMatch && method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
    }

    const index = state.events.findIndex((event) => event.id === eventDetailMatch[1]);
    if (index === -1) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    state.events.splice(index, 1);
    await route.fulfill({ status: 204, body: '' });
    return true;
  }

  const eventActionMatch = path.match(/^\/events\/([^/]+)\/(publish|unpublish|cancel)$/);
  if (eventActionMatch && method === 'PATCH') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
    }

    const found = state.events.find((event) => event.id === eventActionMatch[1]);
    if (!found) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    const action = eventActionMatch[2];
    if (action === 'publish') found.status = 'Published';
    if (action === 'unpublish') found.status = 'Pending';
    if (action === 'cancel') found.status = 'Cancelled';

    await json(route, 200, toEventView(found, currentUser));
    return true;
  }

  return false;
}
