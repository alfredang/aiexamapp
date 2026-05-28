import * as Sentry from '@sentry/nextjs';

// Edge runtime init (middleware + any route configured with
// `export const runtime = 'edge'`). Mirrors sentry.server.config.ts but
// loaded by Next.js only when NEXT_RUNTIME === 'edge'. Same no-op rule:
// stays silent until NEXT_PUBLIC_SENTRY_DSN is set.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production'
  });
}
