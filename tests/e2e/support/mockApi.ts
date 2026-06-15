import type { Page, Route } from '@playwright/test';

type Role = 'resident' | 'hoa_admin';

type User = {
  displayName: string;
  username: string;
  email: string;
  token: string;
  role: Role;
  password: string;
  profileImageUrl?: string | null;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  locationWithinCommunity: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number | null;
  imageUrl?: string | null;
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
  hostUserId: string;
  hostDisplayName: string;
  status: string;
  attendeeCount: number;
  attendingUsers: Set<string>;
};

type Profile = {
  displayName: string;
  username: string;
  email: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  profileImagePositionX: number;
  profileImagePositionY: number;
  profileImageZoom: number;
  bannerImageUrl?: string | null;
  bannerImagePositionX: number;
  bannerImagePositionY: number;
  bannerImageZoom: number;
  role: string;
};

export type MockApiOptions = {
  initialToken?: string;
  forceLoginFailure?: boolean;
};

type State = {
  usersByToken: Map<string, User>;
  usersByEmail: Map<string, User>;
  profilesByUsername: Map<string, Profile>;
  events: EventItem[];
};

const now = Date.now();

function eventDates(startOffsetDays: number, durationHours: number) {
  const start = new Date(now + startOffsetDays * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function buildInitialState(): State {
  const resident: User = {
    displayName: 'Casey Resident',
    username: 'casey',
    email: 'casey@example.com',
    token: 'token-resident',
    role: 'resident',
    password: 'Password123!',
    profileImageUrl: null,
  };

  const admin: User = {
    displayName: 'Alex Admin',
    username: 'alexadmin',
    email: 'alexadmin@example.com',
    token: 'token-admin',
    role: 'hoa_admin',
    password: 'Password123!',
    profileImageUrl: null,
  };

  const usersByToken = new Map<string, User>([
    [resident.token, resident],
    [admin.token, admin],
  ]);

  const usersByEmail = new Map<string, User>([
    [resident.email.toLowerCase(), resident],
    [admin.email.toLowerCase(), admin],
  ]);

  const profilesByUsername = new Map<string, Profile>([
    [
      resident.username,
      {
        displayName: resident.displayName,
        username: resident.username,
        email: resident.email,
        bio: 'Resident profile bio',
        profileImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
        profileImagePositionX: 50,
        profileImagePositionY: 50,
        profileImageZoom: 1,
        bannerImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/banner.jpg',
        bannerImagePositionX: 50,
        bannerImagePositionY: 50,
        bannerImageZoom: 1,
        role: resident.role,
      },
    ],
    [
      admin.username,
      {
        displayName: admin.displayName,
        username: admin.username,
        email: admin.email,
        bio: 'Admin profile bio',
        profileImageUrl: null,
        profileImagePositionX: 50,
        profileImagePositionY: 50,
        profileImageZoom: 1,
        bannerImageUrl: null,
        bannerImagePositionX: 50,
        bannerImagePositionY: 50,
        bannerImageZoom: 1,
        role: admin.role,
      },
    ],
  ]);

  const eventOneDates = eventDates(2, 2);
  const eventTwoDates = eventDates(6, 3);
  const eventThreeDates = eventDates(10, 2);

  const events: EventItem[] = [
    {
      id: 'event-1',
      title: 'Pool Safety Workshop',
      description: 'Community workshop for summer safety.',
      category: 'Pool Event',
      locationWithinCommunity: 'Pool Deck',
      startDate: eventOneDates.startDate,
      endDate: eventOneDates.endDate,
      maxAttendees: 25,
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 1,
      hostUserId: 'admin-1',
      hostDisplayName: admin.displayName,
      status: 'Published',
      attendeeCount: 1,
      attendingUsers: new Set([resident.username]),
    },
    {
      id: 'event-2',
      title: 'Board Budget Review',
      description: 'Quarterly board budget review meeting.',
      category: 'Board Meeting',
      locationWithinCommunity: 'Clubhouse Room A',
      startDate: eventTwoDates.startDate,
      endDate: eventTwoDates.endDate,
      maxAttendees: 40,
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 1,
      hostUserId: 'admin-1',
      hostDisplayName: admin.displayName,
      status: 'Pending',
      attendeeCount: 0,
      attendingUsers: new Set<string>(),
    },
    {
      id: 'event-3',
      title: 'Neighborhood Cleanup Day',
      description: 'Bring gloves and join cleanup teams.',
      category: 'Community Cleanup',
      locationWithinCommunity: 'Main Entrance',
      startDate: eventThreeDates.startDate,
      endDate: eventThreeDates.endDate,
      maxAttendees: 100,
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 1,
      hostUserId: 'admin-1',
      hostDisplayName: admin.displayName,
      status: 'Published',
      attendeeCount: 0,
      attendingUsers: new Set<string>(),
    },
  ];

  return { usersByToken, usersByEmail, profilesByUsername, events };
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function getApiPath(urlString: string) {
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

function resolveCurrentUser(route: Route, state: State) {
  const token = getTokenFromAuthHeader(route.request().headers()['authorization']);
  if (!token) return null;
  return state.usersByToken.get(token) ?? null;
}

function toEventView(event: EventItem, currentUser: User | null) {
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

export async function installMockApi(page: Page, options: MockApiOptions = {}) {
  const state = buildInitialState();

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

    const { path, query } = parsed;
    const method = route.request().method();
    const currentUser = resolveCurrentUser(route, state);

    if (path === '/account/current' && method === 'GET') {
      if (!currentUser) {
        await json(route, 401, { message: 'Unauthorized' });
        return;
      }

      await json(route, 200, {
        displayName: currentUser.displayName,
        username: currentUser.username,
        email: currentUser.email,
        token: currentUser.token,
        role: currentUser.role,
        profileImageUrl: currentUser.profileImageUrl ?? null,
      });
      return;
    }

    if (path === '/account/login' && method === 'POST') {
      if (options.forceLoginFailure) {
        await json(route, 401, { message: 'Invalid email or password.' });
        return;
      }

      const payload = route.request().postDataJSON() as {
        email: string;
        password: string;
      };

      const user = state.usersByEmail.get(payload.email.toLowerCase());
      if (!user || user.password !== payload.password) {
        await json(route, 401, { message: 'Invalid email or password.' });
        return;
      }

      await json(route, 200, {
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        token: user.token,
        role: user.role,
        profileImageUrl: user.profileImageUrl ?? null,
      });
      return;
    }

    if (path === '/account/register' && method === 'POST') {
      const payload = route.request().postDataJSON() as {
        displayName: string;
        username: string;
        email: string;
        password: string;
      };

      if (state.usersByEmail.has(payload.email.toLowerCase())) {
        await json(route, 400, {
          code: 'validation_failed',
          message: 'A user with that email already exists.',
          details: {
            Email: ['A user with that email already exists.'],
          },
        });
        return;
      }

      const token = `token-${payload.username}`;
      const user: User = {
        displayName: payload.displayName,
        username: payload.username,
        email: payload.email,
        token,
        role: 'resident',
        password: payload.password,
        profileImageUrl: null,
      };
      state.usersByToken.set(token, user);
      state.usersByEmail.set(payload.email.toLowerCase(), user);
      state.profilesByUsername.set(payload.username, {
        displayName: payload.displayName,
        username: payload.username,
        email: payload.email,
        bio: '',
        profileImageUrl: null,
        profileImagePositionX: 50,
        profileImagePositionY: 50,
        profileImageZoom: 1,
        bannerImageUrl: null,
        bannerImagePositionX: 50,
        bannerImagePositionY: 50,
        bannerImageZoom: 1,
        role: 'resident',
      });

      await json(route, 200, {
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        token: user.token,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
      });
      return;
    }

    if (path === '/account/users' && method === 'GET') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
      }

      const users = [...state.usersByToken.values()].map((u) => ({
        displayName: u.displayName,
        username: u.username,
        email: u.email,
        role: u.role,
        profileImageUrl: u.profileImageUrl ?? null,
        isMasterAdmin: u.email === 'alexadmin@example.com',
        canDelete: u.email !== 'alexadmin@example.com',
      }));
      await json(route, 200, users);
      return;
    }

    if (path === '/account/promote-admin' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
      }

      const payload = route.request().postDataJSON() as { email: string };
      const user = state.usersByEmail.get(payload.email.toLowerCase());
      if (!user) {
        await json(route, 404, { message: 'User not found.' });
        return;
      }

      user.role = 'hoa_admin';
      const profile = state.profilesByUsername.get(user.username);
      if (profile) profile.role = 'hoa_admin';

      await json(route, 200, {
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        token: user.token,
        role: user.role,
      });
      return;
    }

    if (path === '/account/delete-user' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
      }

      const payload = route.request().postDataJSON() as { email: string };
      const key = payload.email.toLowerCase();
      const user = state.usersByEmail.get(key);
      if (!user) {
        await json(route, 404, { message: 'User not found.' });
        return;
      }

      state.usersByEmail.delete(key);
      state.usersByToken.delete(user.token);
      state.profilesByUsername.delete(user.username);
      await json(route, 200, { message: 'User deleted.' });
      return;
    }

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
      return;
    }

    if (path === '/events' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
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
      return;
    }

    const eventDetailMatch = path.match(/^\/events\/([^/]+)$/);
    if (eventDetailMatch && method === 'GET') {
      const found = state.events.find((event) => event.id === eventDetailMatch[1]);
      if (!found) {
        await json(route, 404, { message: 'Not found' });
        return;
      }
      await json(route, 200, toEventView(found, currentUser));
      return;
    }

    if (eventDetailMatch && method === 'PUT') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
      }

      const found = state.events.find((event) => event.id === eventDetailMatch[1]);
      if (!found) {
        await json(route, 404, { message: 'Not found' });
        return;
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
      return;
    }

    if (eventDetailMatch && method === 'DELETE') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
      }

      const index = state.events.findIndex((event) => event.id === eventDetailMatch[1]);
      if (index === -1) {
        await json(route, 404, { message: 'Not found' });
        return;
      }

      state.events.splice(index, 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    const eventActionMatch = path.match(/^\/events\/([^/]+)\/(publish|unpublish|cancel)$/);
    if (eventActionMatch && method === 'PATCH') {
      if (!currentUser || currentUser.role !== 'hoa_admin') {
        await json(route, 403, { message: 'Forbidden' });
        return;
      }

      const found = state.events.find((event) => event.id === eventActionMatch[1]);
      if (!found) {
        await json(route, 404, { message: 'Not found' });
        return;
      }

      const action = eventActionMatch[2];
      if (action === 'publish') found.status = 'Published';
      if (action === 'unpublish') found.status = 'Pending';
      if (action === 'cancel') found.status = 'Cancelled';
      await json(route, 200, toEventView(found, currentUser));
      return;
    }

    const attendanceJoinMatch = path.match(/^\/attendance\/([^/]+)\/join$/);
    if (attendanceJoinMatch && method === 'POST') {
      if (!currentUser) {
        await json(route, 401, { message: 'Unauthorized' });
        return;
      }

      const found = state.events.find((event) => event.id === attendanceJoinMatch[1]);
      if (!found) {
        await json(route, 404, { message: 'Not found' });
        return;
      }

      if (!found.attendingUsers.has(currentUser.username)) {
        found.attendingUsers.add(currentUser.username);
        found.attendeeCount += 1;
      }

      await json(route, 200, { attendeeCount: found.attendeeCount });
      return;
    }

    const attendanceLeaveMatch = path.match(/^\/attendance\/([^/]+)\/leave$/);
    if (attendanceLeaveMatch && method === 'DELETE') {
      if (!currentUser) {
        await json(route, 401, { message: 'Unauthorized' });
        return;
      }

      const found = state.events.find((event) => event.id === attendanceLeaveMatch[1]);
      if (!found) {
        await json(route, 404, { message: 'Not found' });
        return;
      }

      if (found.attendingUsers.has(currentUser.username)) {
        found.attendingUsers.delete(currentUser.username);
        found.attendeeCount = Math.max(0, found.attendeeCount - 1);
      }

      await json(route, 200, { attendeeCount: found.attendeeCount });
      return;
    }

    const attendanceListMatch = path.match(/^\/attendance\/([^/]+)$/);
    if (attendanceListMatch && method === 'GET') {
      const found = state.events.find((event) => event.id === attendanceListMatch[1]);
      if (!found) {
        await json(route, 404, { message: 'Not found' });
        return;
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
      return;
    }

    const profileMatch = path.match(/^\/profiles\/([^/]+)$/);
    if (profileMatch && method === 'GET') {
      const username = decodeURIComponent(profileMatch[1]);
      const profile = state.profilesByUsername.get(username);
      if (!profile) {
        await json(route, 404, { message: 'Profile not found.' });
        return;
      }
      await json(route, 200, profile);
      return;
    }

    if (profileMatch && method === 'PUT') {
      if (!currentUser) {
        await json(route, 401, { message: 'Unauthorized' });
        return;
      }

      const username = decodeURIComponent(profileMatch[1]);
      const profile = state.profilesByUsername.get(username);
      if (!profile) {
        await json(route, 404, { message: 'Profile not found.' });
        return;
      }

      const payload = route.request().postDataJSON() as Record<string, unknown>;
      profile.displayName = String(payload.displayName ?? profile.displayName);
      profile.bio = (payload.bio as string | null | undefined) ?? profile.bio ?? '';
      profile.profileImageUrl = (payload.profileImageUrl as string | null | undefined) ?? profile.profileImageUrl ?? null;
      profile.profileImagePositionX = typeof payload.profileImagePositionX === 'number' ? payload.profileImagePositionX : profile.profileImagePositionX;
      profile.profileImagePositionY = typeof payload.profileImagePositionY === 'number' ? payload.profileImagePositionY : profile.profileImagePositionY;
      profile.profileImageZoom = typeof payload.profileImageZoom === 'number' ? payload.profileImageZoom : profile.profileImageZoom;
      profile.bannerImageUrl = (payload.bannerImageUrl as string | null | undefined) ?? profile.bannerImageUrl ?? null;
      profile.bannerImagePositionX = typeof payload.bannerImagePositionX === 'number' ? payload.bannerImagePositionX : profile.bannerImagePositionX;
      profile.bannerImagePositionY = typeof payload.bannerImagePositionY === 'number' ? payload.bannerImagePositionY : profile.bannerImagePositionY;
      profile.bannerImageZoom = typeof payload.bannerImageZoom === 'number' ? payload.bannerImageZoom : profile.bannerImageZoom;

      if (currentUser.username === username) {
        currentUser.displayName = profile.displayName;
        currentUser.profileImageUrl = profile.profileImageUrl ?? null;
      }

      await json(route, 200, profile);
      return;
    }

    if (path === '/uploads/cloudinary/signature' && method === 'POST') {
      await json(route, 200, {
        cloudName: 'demo',
        apiKey: 'demo-key',
        timestamp: Math.floor(now / 1000),
        folder: 'hoa-events',
        publicId: 'mock-public-id',
        signature: 'mock-signature',
      });
      return;
    }

    await route.continue();
  });
}
