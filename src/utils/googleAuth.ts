// Thin wrapper around Google Identity Services (GIS) for:
//  1. Signing the user in with their Google account.
//  2. Obtaining an OAuth access token scoped to Drive + basic profile info.
//
// Everything runs client-side. No server/backend is involved — the access
// token is kept only in memory (React state) for the current tab session.

export interface GoogleAuthUser {
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleSession {
  accessToken: string;
  expiresAt: number; // epoch ms
  user: GoogleAuthUser;
}

// "drive.file" is a non-sensitive scope: it only lets this app see/manage
// the files *it* creates in the user's Drive (not their whole Drive), which
// keeps the Google verification requirements minimal for this kind of app.
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const PROFILE_SCOPES = 'openid email profile';
const SCOPES = `${DRIVE_SCOPE} ${PROFILE_SCOPES}`;

const CLIENT_ID = (import.meta as unknown as { env: Record<string, string | undefined> }).env
  .VITE_GOOGLE_CLIENT_ID;

export function isGoogleConfigured(): boolean {
  return !!CLIENT_ID;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: { access_token?: string; expires_in?: string; error?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (accessToken: string, done: () => void) => void;
        };
      };
    };
  }
}

let gisLoadPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Identity Services solo está disponible en el navegador.'));
      return;
    }
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const onLoad = () => resolve();
    const onError = () => reject(new Error('No se pudo cargar Google Identity Services (revisa tu conexión).'));
    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      // It might already have loaded before we attached listeners.
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

async function fetchProfile(accessToken: string): Promise<GoogleAuthUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('No se pudo obtener el perfil de Google.');
  const data = await res.json();
  return { email: data.email, name: data.name || data.email, picture: data.picture };
}

/**
 * Opens the Google sign-in / consent popup and resolves with an access
 * token (scoped to Drive + profile) plus basic user info.
 *
 * @param silent When true, tries not to show any UI (used to silently
 *   restore a session on page load). Resolves to null instead of throwing
 *   if silent sign-in isn't possible.
 */
export async function signInWithGoogle(options?: { silent?: boolean }): Promise<GoogleSession | null> {
  if (!CLIENT_ID) {
    throw new Error('Google Client ID no configurado (VITE_GOOGLE_CLIENT_ID). Revisa el README.');
  }
  await loadGisScript();
  const google = window.google;
  if (!google) {
    throw new Error('Google Identity Services no está disponible.');
  }

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error || !response.access_token) {
          if (options?.silent) {
            resolve(null);
          } else {
            reject(new Error(response.error || 'No se pudo iniciar sesión con Google.'));
          }
          return;
        }
        const accessToken = response.access_token;
        const expiresAt = Date.now() + (Number(response.expires_in) || 3600) * 1000;
        try {
          const user = await fetchProfile(accessToken);
          resolve({ accessToken, expiresAt, user });
        } catch (e) {
          reject(e instanceof Error ? e : new Error('No se pudo obtener el perfil de Google.'));
        }
      },
      error_callback: (err) => {
        if (options?.silent) {
          resolve(null);
        } else {
          reject(new Error(err?.message || err?.type || 'No se pudo iniciar sesión con Google.'));
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: options?.silent ? '' : 'consent' });
  });
}

export function revokeGoogleToken(accessToken: string): void {
  const google = window.google;
  if (google?.accounts?.oauth2?.revoke) {
    google.accounts.oauth2.revoke(accessToken, () => {});
  }
}
