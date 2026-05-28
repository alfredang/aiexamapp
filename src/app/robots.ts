import type { MetadataRoute } from 'next';

/**
 * /robots.txt — generated dynamically by Next.js from this file.
 *
 * We allow all crawlers on every public route, disallow the obvious
 * non-public surfaces (auth endpoints, admin, user dashboard, in-progress
 * exam attempts, results), and point at the sitemap for discovery.
 *
 * Match `/api/*` is intentional even though some API routes (e.g.
 * `/api/auth/csrf`) are public — crawlers shouldn't be indexing API
 * responses regardless. The sitemap covers all the human-facing URLs.
 */
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    'https://ai-exams.tertiaryinfo.tech';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/admin-dashboard/',
          '/user-dashboard/',
          '/exam/',
          '/results/',
          '/checkout/',
          '/verify-otp',
          '/forgot-password',
          '/reset-password'
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
