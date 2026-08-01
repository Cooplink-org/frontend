/**
 * Parse an auth callback hash fragment.
 *
 * The backend redirects OAuth results to FRONTEND_URL with a hash fragment:
 *   Success: #auth/callback&access=<JWT>&refresh=<JWT>
 *   Error:   #auth/callback&error=<message>
 *
 * Returns null if the hash doesn't look like an auth callback.
 */
export function handleAuthHash(
  hash: string,
): { access: string | null; refresh: string | null; error: string | null } | null {
  if (!hash) return null;

  // Strip leading '#'
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;

  // Only handle auth callbacks — the path portion is "auth/callback"
  if (!raw.startsWith("auth/callback")) return null;

  const params = new URLSearchParams(raw);
  const access = params.get("access");
  const refresh = params.get("refresh");
  const error = params.get("error");

  if (!access && !error) return null;

  return { access, refresh, error };
}
