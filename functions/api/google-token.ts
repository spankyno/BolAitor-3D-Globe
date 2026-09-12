import type { PagesFunction } from '@cloudflare/workers-types';
import { createClerkClient } from '@clerk/backend';

interface Env {
  CLERK_SECRET_KEY: string;
  VITE_CLERK_PUBLISHABLE_KEY: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/google-token
 *
 * Verifies the caller's Clerk session (via the `__session` cookie, sent
 * automatically for same-origin requests) and, if valid, asks Clerk's
 * Backend API for the Google OAuth access token associated with that
 * user's connected Google account — the same token Google issued with the
 * `drive.file` scope configured on the Google SSO connection in the Clerk
 * dashboard.
 *
 * The Clerk Secret Key never reaches the browser: it's only used here, on
 * the server side.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.CLERK_SECRET_KEY || !env.VITE_CLERK_PUBLISHABLE_KEY) {
    return json({ error: 'Clerk no está configurado en el servidor (faltan CLERK_SECRET_KEY / VITE_CLERK_PUBLISHABLE_KEY).' }, 500);
  }

  const clerkClient = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY,
  });

  let userId: string | null = null;
  try {
    const requestState = await clerkClient.authenticateRequest(request, {
      authorizedParties: [new URL(request.url).origin],
    });
    if (requestState.isAuthenticated) {
      userId = requestState.toAuth().userId;
    }
  } catch (err) {
    console.error('Error verificando la sesión de Clerk', err);
    return json({ error: 'No se pudo verificar la sesión.' }, 401);
  }

  if (!userId) {
    return json({ error: 'No autenticado.' }, 401);
  }

  try {
    const { data: tokens } = await clerkClient.users.getUserOauthAccessToken(userId, 'google');
    const tokenData = tokens?.[0];
    if (!tokenData?.token) {
      return json(
        { error: 'Tu cuenta no tiene Google conectado con acceso a Drive. Conéctala desde el menú de la app.' },
        404
      );
    }
    return json({ accessToken: tokenData.token });
  } catch (err) {
    console.error('Error obteniendo el token de Google desde Clerk', err);
    return json({ error: 'No se pudo obtener el token de Google Drive.' }, 500);
  }
};
