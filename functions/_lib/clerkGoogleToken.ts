import { createClerkClient, type ClerkClient } from '@clerk/backend';

export interface ClerkEnv {
  CLERK_SECRET_KEY: string;
  VITE_CLERK_PUBLISHABLE_KEY: string;
}

export function makeClerkClient(env: ClerkEnv): ClerkClient {
  return createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY,
  });
}

/**
 * Verifies the incoming request's Clerk session (via cookie) and returns
 * the signed-in user's id, or null if there isn't one.
 */
export async function getSignedInUserId(clerkClient: ClerkClient, request: Request): Promise<string | null> {
  const requestState = await clerkClient.authenticateRequest(request, {
    authorizedParties: [new URL(request.url).origin],
  });
  if (!requestState.isAuthenticated) return null;
  return requestState.toAuth().userId;
}

/**
 * Fetches the Drive-scoped Google OAuth access token Clerk stored for the
 * given user (works for any userId, not just the caller — this is how the
 * public share endpoints read a globe's owner's photos without the owner
 * being present in the request).
 */
export async function getGoogleAccessTokenForUser(clerkClient: ClerkClient, userId: string): Promise<string> {
  const { data: tokens } = await clerkClient.users.getUserOauthAccessToken(userId, 'google');
  const tokenData = tokens?.[0];
  if (!tokenData?.token) {
    throw new Error('El propietario de este globo no tiene Google Drive conectado.');
  }
  return tokenData.token;
}
