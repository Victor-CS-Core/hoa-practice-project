import { json } from './helpers';
import type { ApiRouteContext } from './types';

export async function handleUploadRoute(context: ApiRouteContext): Promise<boolean> {
  const { path, method, route, now } = context;

  if (path === '/uploads/cloudinary/signature' && method === 'POST') {
    await json(route, 200, {
      cloudName: 'demo',
      apiKey: 'demo-key',
      timestamp: Math.floor(now / 1000),
      folder: 'hoa-events',
      publicId: 'mock-public-id',
      signature: 'mock-signature',
    });
    return true;
  }

  return false;
}
