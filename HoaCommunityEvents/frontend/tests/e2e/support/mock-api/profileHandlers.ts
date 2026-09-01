import { json } from './helpers';
import type { ApiRouteContext } from './types';

export async function handleProfileRoute(context: ApiRouteContext): Promise<boolean> {
  const { path, method, route, currentUser, state } = context;

  const profileMatch = path.match(/^\/profiles\/([^/]+)$/);
  if (!profileMatch) {
    return false;
  }

  if (method === 'GET') {
    const username = decodeURIComponent(profileMatch[1]);
    const profile = state.profilesByUsername.get(username);
    if (!profile) {
      await json(route, 404, { message: 'Profile not found.' });
      return true;
    }

    await json(route, 200, profile);
    return true;
  }

  if (method === 'PUT') {
    if (!currentUser) {
      await json(route, 401, { message: 'Unauthorized' });
      return true;
    }

    const username = decodeURIComponent(profileMatch[1]);
    const profile = state.profilesByUsername.get(username);
    if (!profile) {
      await json(route, 404, { message: 'Profile not found.' });
      return true;
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
    return true;
  }

  return false;
}
