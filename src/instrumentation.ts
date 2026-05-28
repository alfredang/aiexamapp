/**
 * Next.js calls register() on server boot for both the Node.js runtime and
 * the Edge runtime. We branch on NEXT_RUNTIME so each runtime gets its
 * matching Sentry init. Both init files no-op if NEXT_PUBLIC_SENTRY_DSN is
 * not set, so this whole file is a runtime no-op pre-launch — it only
 * starts capturing once you set the DSN env in Coolify.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Next.js calls `onRequestError` for errors thrown in React Server
// Components, Server Actions, and route handlers. Sentry v10 exports
// the implementation as `captureRequestError`, so we re-export under the
// name Next.js expects. Without an active Sentry client this is a noop.
export { captureRequestError as onRequestError } from '@sentry/nextjs';
