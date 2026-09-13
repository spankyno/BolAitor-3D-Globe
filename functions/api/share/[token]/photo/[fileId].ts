import type { PagesFunction, KVNamespace } from '@cloudflare/workers-types';
import { getGoogleAccessTokenForUser, makeClerkClient, type ClerkEnv } from '../../../../_lib/clerkGoogleToken';
import { fetchFileContent, getFileMeta } from '../../../../_lib/drive';

interface Env extends ClerkEnv {
  SHARE_KV: KVNamespace;
}

interface ShareRecord {
  ownerUserId: string;
  folderId: string;
}

function text(body: string, status: number): Response {
  return new Response(body, { status });
}

/**
 * GET /api/share/:token/photo/:fileId
 *
 * Public (no login required). Streams the raw bytes of one photo from the
 * owner's Drive, after checking that the requested file actually belongs
 * to the shared folder (so a valid share token can't be used to fetch
 * arbitrary file ids from the owner's Drive).
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const token = params.token as string;
  const fileId = params.fileId as string;

  if (!env.CLERK_SECRET_KEY || !env.VITE_CLERK_PUBLISHABLE_KEY || !env.SHARE_KV) {
    return text('Not configured', 500);
  }

  const raw = await env.SHARE_KV.get(`share:${token}`);
  if (!raw) return text('Not found', 404);
  const record = JSON.parse(raw) as ShareRecord;

  const clerkClient = makeClerkClient(env);
  try {
    const accessToken = await getGoogleAccessTokenForUser(clerkClient, record.ownerUserId);

    const meta = await getFileMeta(accessToken, fileId);
    if (!meta.parents || !meta.parents.includes(record.folderId)) {
      return text('Forbidden', 403);
    }

    const contentRes = await fetchFileContent(accessToken, fileId);
    return new Response(contentRes.body, {
      headers: {
        'Content-Type': meta.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    console.error(e);
    return text('Error', 500);
  }
};
