export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Generates a URL-safe random token (used as the opaque id in share links).
 * Not a UUID on purpose — shorter and still has ~144 bits of entropy from
 * 18 random bytes, which is plenty for an unguessable share link.
 */
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
