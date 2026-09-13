import type { PagesFunction, KVNamespace } from '@cloudflare/workers-types';
import { getSignedInUserId, makeClerkClient, type ClerkEnv } from '../../_lib/clerkGoogleToken';
import { json } from '../../_lib/http';

interface Env extends ClerkEnv {
  SHARE_KV: KVNamespace;
}

/**
 * GET /api/share/status?folderId=...
 *
 * Returns { token: string | null } — whether the caller's collection is
 * currently shared, and its token if so, without creating a new share.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.CLERK_SECRET_KEY || !env.VITE_CLERK_PUBLISHABLE_KEY) {
    return json({ error: 'Clerk no está configurado en el servidor.' }, 500);
  }
  if (!env.SHARE_KV) {
    return json({ error: 'El almacenamiento de enlaces compartidos (KV) no está configurado en el servidor.' }, 500);
  }

  const clerkClient = makeClerkClient(env);
  let userId: string | null = null;
  try {
    userId = await getSignedInUserId(clerkClient, request);
  } catch (err) {
    console.error(err);
    return json({ error: 'No se pudo verificar la sesión.' }, 401);
  }
  if (!userId) return json({ error: 'No autenticado.' }, 401);

  const folderId = new URL(request.url).searchParams.get('folderId');
  if (!folderId) return json({ error: 'Falta folderId.' }, 400);

  const token = await env.SHARE_KV.get(`share-owner:${userId}:${folderId}`);
  return json({ token: token || null });
};
