import { json } from './helpers';
import type { ApiRouteContext } from './types';

export async function handleAccountRoute(context: ApiRouteContext): Promise<boolean> {
  const { path, method, route, currentUser, options, state } = context;

  if (path === '/account/current' && method === 'GET') {
    if (!currentUser) {
      await json(route, 401, { message: 'Unauthorized' });
      return true;
    }

    await json(route, 200, {
      displayName: currentUser.displayName,
      username: currentUser.username,
      email: currentUser.email,
      token: currentUser.token,
      role: currentUser.role,
      profileImageUrl: currentUser.profileImageUrl ?? null,
    });
    return true;
  }

  if (path === '/account/login' && method === 'POST') {
    if (options.forceLoginFailure) {
      await json(route, 401, { message: 'Invalid email or password.' });
      return true;
    }

    const payload = route.request().postDataJSON() as {
      email: string;
      password: string;
    };

    const user = state.usersByEmail.get(payload.email.toLowerCase());
    if (!user || user.password !== payload.password) {
      await json(route, 401, { message: 'Invalid email or password.' });
      return true;
    }

    await json(route, 200, {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      token: user.token,
      role: user.role,
      profileImageUrl: user.profileImageUrl ?? null,
    });
    return true;
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
      return true;
    }

    const token = `token-${payload.username}`;
    const user = {
      displayName: payload.displayName,
      username: payload.username,
      email: payload.email,
      token,
      role: 'resident' as const,
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
    return true;
  }

  if (path === '/account/users' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
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
    return true;
  }

  if (path === '/account/promote-admin' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
    }

    const payload = route.request().postDataJSON() as { email: string };
    const user = state.usersByEmail.get(payload.email.toLowerCase());
    if (!user) {
      await json(route, 404, { message: 'User not found.' });
      return true;
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
    return true;
  }

  if (path === '/account/delete-user' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'hoa_admin') {
      await json(route, 403, { message: 'Forbidden' });
      return true;
    }

    const payload = route.request().postDataJSON() as { email: string };
    const key = payload.email.toLowerCase();
    const user = state.usersByEmail.get(key);
    if (!user) {
      await json(route, 404, { message: 'User not found.' });
      return true;
    }

    state.usersByEmail.delete(key);
    state.usersByToken.delete(user.token);
    state.profilesByUsername.delete(user.username);

    await json(route, 200, { message: 'User deleted.' });
    return true;
  }

  return false;
}
