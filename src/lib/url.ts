/**
 * URL helpers for server-side redirects behind a reverse proxy.
 *
 * Why this exists: under Coolify (and any reverse-proxy deployment), the
 * `Host` header on the request the Next.js server sees is the *internal*
 * container hostname — something like `e5bbf3dce0b3:3000`. If we call
 * `new URL('/foo', req.url)` and return it as a Location header, the
 * browser dutifully follows the redirect to the container's internal
 * address, gets DNS_PROBE_FINISHED_NXDOMAIN, and dead-ends.
 *
 * Resolution order (most authoritative first):
 *  1. `NEXTAUTH_URL` env — explicit, set in the prod env file.
 *  2. `X-Forwarded-Proto` + `X-Forwarded-Host` — Coolify/Traefik/nginx set
 *     these to the public scheme + host the client hit.
 *  3. Fall back to the origin of `req.url` — fine for local dev where
 *     there is no proxy in between.
 *
 * Used by route handlers that issue redirects (teaser launch, admin
 * impersonate exit, Gmail OAuth start/callback). Do NOT use this for
 * relative redirect *paths* — Next.js redirect responses must carry an
 * absolute URL because some browsers will not honour a path-only
 * Location header from an XHR.
 */
export function getPublicOrigin(req: Request): string {
  const envBase = process.env.NEXTAUTH_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, '');

  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('x-forwarded-host');
  if (proto && host) return `${proto}://${host}`;

  // Local dev — no proxy in front. req.url is `http://127.0.0.1:3040/...`
  // which is exactly what the browser used, so this is safe.
  return new URL(req.url).origin;
}

/**
 * Build an absolute URL for a redirect Location header, using the
 * public-facing origin (not the container's internal hostname).
 *
 * @param req  the incoming request (so we can read X-Forwarded-* headers)
 * @param path absolute path on this site, e.g. `/exam/${id}` or
 *             `/practice-exams/aws/saa-c03?teaser=unavailable`
 */
export function publicUrl(req: Request, path: string): URL {
  return new URL(path, getPublicOrigin(req));
}
