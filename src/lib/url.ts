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
 * Resolution order:
 *
 *   PRODUCTION (most authoritative first):
 *    1. `NEXTAUTH_URL` env — explicit, set in the prod env file.
 *    2. `X-Forwarded-Proto` + `X-Forwarded-Host` — Coolify/Traefik/nginx
 *       set these to the public scheme + host the client hit.
 *    3. Fall back to the origin of `req.url` — fine when there is no
 *       proxy in between.
 *
 *   DEVELOPMENT:
 *    Always use `req.url`'s origin. Skip NEXTAUTH_URL entirely.
 *    Reason: in dev, NEXTAUTH_URL is set to a convenience host in `.env`
 *    (e.g. `http://127.0.0.1:3040`). If the developer browses to
 *    `http://localhost:3040`, the redirect would cross-jump hosts —
 *    cookies are host-scoped and get left behind, which means the
 *    guest `gt` cookie set on `localhost` is invisible to the request
 *    landing on `127.0.0.1`, so the exam page bounces to /login.
 *    Honour whatever the dev typed and the flow holds together.
 *
 * Used by route handlers that issue redirects (teaser launch, admin
 * impersonate exit, Gmail OAuth start/callback). Do NOT use this for
 * relative redirect *paths* — Next.js redirect responses must carry an
 * absolute URL because some browsers will not honour a path-only
 * Location header from an XHR.
 */
export function getPublicOrigin(req: Request): string {
  // In dev, the user's chosen host wins — see comment above.
  if (process.env.NODE_ENV !== 'production') {
    return new URL(req.url).origin;
  }

  const envBase = process.env.NEXTAUTH_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, '');

  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('x-forwarded-host');
  if (proto && host) return `${proto}://${host}`;

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
