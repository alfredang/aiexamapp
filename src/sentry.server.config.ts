import * as Sentry from '@sentry/nextjs';

// Server-side Sentry init. No-op unless NEXT_PUBLIC_SENTRY_DSN is set, so
// dev / preview / pre-launch envs don't ship spans anywhere. Once you set
// the DSN in Coolify, errors thrown in server components, route handlers,
// and server actions all flow to Sentry automatically — no per-call
// instrumentation needed.
//
// tracesSampleRate is intentionally low (10%): perf spans are noisy and
// expensive, and the value here is error capture, not APM. Raise later
// if you actually start chasing latency regressions.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production'
  });
}
