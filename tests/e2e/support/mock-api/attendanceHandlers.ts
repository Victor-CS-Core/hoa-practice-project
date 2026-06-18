import { json } from './helpers';
import type { ApiRouteContext } from './types';

export async function handleAttendanceRoute(context: ApiRouteContext): Promise<boolean> {
  const { path, method, route, currentUser, state, now } = context;

  const attendanceJoinMatch = path.match(/^\/attendance\/([^/]+)\/join$/);
  if (attendanceJoinMatch && method === 'POST') {
    if (!currentUser) {
      await json(route, 401, { message: 'Unauthorized' });
      return true;
    }

    const found = state.events.find((event) => event.id === attendanceJoinMatch[1]);
    if (!found) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    if (!found.attendingUsers.has(currentUser.username)) {
      found.attendingUsers.add(currentUser.username);
      found.attendeeCount += 1;
    }

    await json(route, 200, { attendeeCount: found.attendeeCount });
    return true;
  }

  const attendanceLeaveMatch = path.match(/^\/attendance\/([^/]+)\/leave$/);
  if (attendanceLeaveMatch && method === 'DELETE') {
    if (!currentUser) {
      await json(route, 401, { message: 'Unauthorized' });
      return true;
    }

    const found = state.events.find((event) => event.id === attendanceLeaveMatch[1]);
    if (!found) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    if (found.attendingUsers.has(currentUser.username)) {
      found.attendingUsers.delete(currentUser.username);
      found.attendeeCount = Math.max(0, found.attendeeCount - 1);
    }

    await json(route, 200, { attendeeCount: found.attendeeCount });
    return true;
  }

  const attendanceListMatch = path.match(/^\/attendance\/([^/]+)$/);
  if (attendanceListMatch && method === 'GET') {
    const found = state.events.find((event) => event.id === attendanceListMatch[1]);
    if (!found) {
      await json(route, 404, { message: 'Not found' });
      return true;
    }

    const attendees = [...found.attendingUsers].map((username) => {
      const profile = state.profilesByUsername.get(username);
      return {
        userId: username,
        displayName: profile?.displayName ?? username,
        profileImageUrl: profile?.profileImageUrl ?? null,
        joinedAt: new Date(now - 3600000).toISOString(),
      };
    });

    await json(route, 200, attendees);
    return true;
  }

  return false;
}
