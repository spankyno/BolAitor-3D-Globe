import type { PagesFunction, KVNamespace } from '@cloudflare/workers-types';
import { getGoogleAccessTokenForUser, makeClerkClient, type ClerkEnv } from '../../../_lib/clerkGoogleToken';
import { getFolderName, listFolderImages } from '../../../_lib/drive';
import { json } from '../../../_lib/http';

interface Env extends ClerkEnv {
  SHARE_KV: KVNamespace;
}

interface ShareRecord {
  ownerUserId: string;
  folderId: string;
}

/**
 * GET /api/share/:token/meta
 *
 * Public (no login required). Resolves the share token to its owner's
 * Drive folder, fetches a fresh Google access token for that owner via
 * Clerk's Backend API, and returns the collection's current name and
 * photo list. The photo URLs point back at
 * /api/share/:token/photo/:fileId, which proxies the actual image bytes —
 * the owner's Drive files are never made public.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const token = params.token as string;

  if (!env.CLERK_SECRET_KEY || !env.VITE_CLERK_PUBLISHABLE_KEY) {
    return json({ error: 'Clerk no está configurado en el servidor.' }, 500);
  }
  if (!env.SHARE_KV) {
    return json({ error: 'El almacenamiento de enlaces compartidos (KV) no está configurado en el servidor.' }, 500);
  }

  const raw = await env.SHARE_KV.get(`share:${token}`);
  if (!raw) {
    return json({ error: 'Este enlace no existe o ha sido revocado.' }, 404);
  }
  const record = JSON.parse(raw) as ShareRecord;

  const clerkClient = makeClerkClient(env);
  try {
    const accessToken = await getGoogleAccessTokenForUser(clerkClient, record.ownerUserId);
    const [name, files] = await Promise.all([
      getFolderName(accessToken, record.folderId),
      listFolderImages(accessToken, record.folderId),
    ]);
    return json({
      name,
      photos: files.map((f) => ({ id: f.id, name: f.name })),
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudo cargar este globo compartido.' }, 500);
  }
};
