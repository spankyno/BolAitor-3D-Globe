import { createContext, useContext, type ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';

export interface DriveAuthValue {
  /** Whether Clerk (VITE_CLERK_PUBLISHABLE_KEY) is configured at all. */
  configured: boolean;
  isSignedIn: boolean;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  /** Whether the signed-in user has a Google account connected via Clerk. */
  hasGoogleAccount: boolean;
  /**
   * Calls our `/api/google-token` serverless function, which uses the
   * Clerk Secret Key (server-side only) to fetch a Drive-scoped Google
   * access token for the current signed-in user.
   */
  getDriveAccessToken: () => Promise<string>;
}

const DEFAULT_VALUE: DriveAuthValue = {
  configured: false,
  isSignedIn: false,
  userName: null,
  userEmail: null,
  userImage: null,
  hasGoogleAccount: false,
  getDriveAccessToken: async () => {
    throw new Error('El login con Google no está configurado (falta VITE_CLERK_PUBLISHABLE_KEY).');
  },
};

const DriveAuthContext = createContext<DriveAuthValue>(DEFAULT_VALUE);

export const useDriveAuth = () => useContext(DriveAuthContext);

export const CLERK_CONFIGURED = !!(import.meta as unknown as { env: Record<string, string | undefined> }).env
  .VITE_CLERK_PUBLISHABLE_KEY;

async function requestDriveAccessToken(): Promise<string> {
  const res = await fetch('/api/google-token', { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo obtener acceso a Google Drive.');
  }
  return data.accessToken as string;
}

// Only ever mounted when CLERK_CONFIGURED is true, so useUser() always has
// a ClerkProvider ancestor (see main.tsx).
function RealDriveAuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const googleAccount = user?.externalAccounts.find((a) => a.provider === 'google');

  const value: DriveAuthValue = {
    configured: true,
    isSignedIn: !!isSignedIn,
    userName: user?.fullName || user?.primaryEmailAddress?.emailAddress || null,
    userEmail: user?.primaryEmailAddress?.emailAddress || null,
    userImage: user?.imageUrl || null,
    hasGoogleAccount: !!googleAccount,
    getDriveAccessToken: requestDriveAccessToken,
  };

  return <DriveAuthContext.Provider value={value}>{children}</DriveAuthContext.Provider>;
}

export function DriveAuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_CONFIGURED) {
    return <DriveAuthContext.Provider value={DEFAULT_VALUE}>{children}</DriveAuthContext.Provider>;
  }
  return <RealDriveAuthProvider>{children}</RealDriveAuthProvider>;
}
