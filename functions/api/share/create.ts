import type { PagesFunction, KVNamespace } from '@cloudflare/workers-types';
import { getGoogleAccessTokenForUser, getSignedInUserId, makeClerkClient, type ClerkEnv } from '../../_lib/clerkGoogleToken';
import { getFolderName } from '../../_lib/drive';
import { json, randomToken } from '../../_lib/http';

interface Env extends ClerkEnv {
  SHARE_KV: KVNamespace;
}

interface ShareRecord {
  ownerUserId: string;
  folderId: string;
  createdAt: number;
}

/**
 * POST /api/share/create   body: { folderId: string }
 *
 * Creates a public, read-only share link for one of the caller's Drive
 * collections. Idempotent: calling it again for the same collection
 * returns the same link instead of creating a duplicate.
 *
 * The mapping token -> (ownerUserId, folderId) is stored in Cloudflare KV
 * (SHARE_KV) so the public viewer endpoints can resolve it without the
 * owner being signed in.
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
  const existingToken = await env.SHARE_KV.get(ownerKey);
  if (existingToken) {
    return json({ token: existingToken });
  }

  // Confirm the caller actually has Drive access to this folder before
  // creating a public link for it.
  try {
    const accessToken = await getGoogleAccessTokenForUser(clerkClient, userId);
    await getFolderName(accessToken, folderId);
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudo verificar este globo en tu Google Drive.' }, 403);
  }

  const token = randomToken();
  const record: ShareRecord = { ownerUserId: userId, folderId, createdAt: Date.now() };
  await env.SHARE_KV.put(`share:${token}`, JSON.stringify(record));
  await env.SHARE_KV.put(ownerKey, token);

  return json({ token });
};
