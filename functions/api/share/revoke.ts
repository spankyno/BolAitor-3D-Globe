import type { PagesFunction, KVNamespace } from '@cloudflare/workers-types';
import { getSignedInUserId, makeClerkClient, type ClerkEnv } from '../../_lib/clerkGoogleToken';
import { json } from '../../_lib/http';

interface Env extends ClerkEnv {
  SHARE_KV: KVNamespace;
}

/**
 * POST /api/share/revoke   body: { folderId: string }
 *
 * Deletes the share link for one of the caller's collections, if any.
 * The link stops working immediately (the public endpoints look it up by
 * token on every request, they don't cache it).
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
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

  let folderId: string;
  try {
    const body = (await request.json()) as { folderId?: string };
    if (!body.folderId) throw new Error('missing folderId');
    folderId = body.folderId;
  } catch {
    return json({ error: 'Falta folderId en la solicitud.' }, 400);
  }

  const ownerKey = `share-owner:${userId}:${folderId}`;
  const token = await env.SHARE_KV.get(ownerKey);
  if (token) {
    await env.SHARE_KV.delete(`share:${token}`);
    await env.SHARE_KV.delete(ownerKey);
  }

  return json({ revoked: true });
};
