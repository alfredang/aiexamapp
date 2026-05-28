import * as Sentry from '@sentry/nextjs';

// Browser-side Sentry init. Loaded by Next.js exactly once per page lifecycle.
// No-op without NEXT_PUBLIC_SENTRY_DSN so the bundle stays clean pre-launch.
//
// We disable BrowserTracing by leaving `integrations` empty — error capture is
// the only thing we want at launch. Tracing in the browser is expensive
// (lots of fetch wraps) and the data isn't actionable until you have
// thousands of pageviews to compare against. Re-enable later if you need it.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
    enabled: process.env.NODE_ENV === 'production'
  });
}

// Hook Sentry into Next.js App Router client-side navigation so transitions
// show up as parent spans for any errors that fire during them. Safe to
// export unconditionally — without an active Sentry client this is a noop.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
