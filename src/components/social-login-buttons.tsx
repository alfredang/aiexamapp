'use client';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Status = { google: boolean; github: boolean; linkedin: boolean; microsoft: boolean };

/**
 * Renders Google / GitHub / LinkedIn / Microsoft buttons. If the matching
 * prop is omitted, the component queries `/api/auth/social-status` on mount
 * so client-only pages (login, signup) can use it without converting to a
 * server component.
 */
export function SocialLoginButtons({
  google,
  github,
  linkedin,
  microsoft,
  callbackUrl = '/post-login'
}: {
  google?: boolean;
  github?: boolean;
  linkedin?: boolean;
  microsoft?: boolean;
  callbackUrl?: string;
}) {
  const propsProvided =
    google !== undefined || github !== undefined || linkedin !== undefined || microsoft !== undefined;
  const [status, setStatus] = useState<Status | null>(
    propsProvided
      ? { google: !!google, github: !!github, linkedin: !!linkedin, microsoft: !!microsoft }
      : null
  );

  useEffect(() => {
    if (status) return;
    let cancelled = false;
    fetch('/api/auth/social-status')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled)
          setStatus({
            google: !!d.google,
            github: !!d.github,
            linkedin: !!d.linkedin,
            microsoft: !!d.microsoft
          });
      })
      .catch(() => {
        if (!cancelled) setStatus({ google: false, github: false, linkedin: false, microsoft: false });
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (!status) return null;
  if (!status.google && !status.github && !status.linkedin && !status.microsoft) return null;

  const btnClass =
    'flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <div className="mt-6">
      <div className="relative my-4 text-center">
        <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="bg-white px-2 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900">
          Or continue with
        </span>
      </div>
      <div className="space-y-2">
        {status.google && (
          <button type="button" onClick={() => signIn('google', { callbackUrl })} className={btnClass}>
            <GoogleIcon />
            Continue with Google
          </button>
        )}
        {status.github && (
          <button type="button" onClick={() => signIn('github', { callbackUrl })} className={btnClass}>
            <GitHubIcon />
            Continue with GitHub
          </button>
        )}
        {status.linkedin && (
          <button type="button" onClick={() => signIn('linkedin', { callbackUrl })} className={btnClass}>
            <LinkedInIcon />
            Continue with LinkedIn
          </button>
        )}
        {status.microsoft && (
          <button
            type="button"
            onClick={() => signIn('microsoft-entra-id', { callbackUrl })}
            className={btnClass}
          >
            <MicrosoftIcon />
            Continue with Microsoft
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.87 0-5.29-1.94-6.15-4.54H2.18v2.85C3.99 20.53 7.71 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.85 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.57 1 10.24 1 12s.43 3.43 1.18 4.93l3.67-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.46 2.09 14.97 1 12 1 7.71 1 3.99 3.47 2.18 7.07l3.67 2.85C6.71 7.32 9.13 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.55v-1.92c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.52-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.97 10.97 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .3.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="#0A66C2" />
      <path
        d="M7.4 9.4h2.7v8.7H7.4V9.4zM8.75 5.6a1.55 1.55 0 1 1 0 3.1 1.55 1.55 0 0 1 0-3.1zM11.7 9.4h2.6v1.2h.04c.36-.68 1.24-1.4 2.55-1.4 2.72 0 3.22 1.79 3.22 4.11v5.78h-2.69v-5.13c0-1.22-.02-2.8-1.7-2.8-1.7 0-1.97 1.33-1.97 2.71v5.22H11.7V9.4z"
        fill="#fff"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
