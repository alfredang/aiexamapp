import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { EyeOff } from 'lucide-react';

/**
 * Shown at the top of /user-dashboard when an admin has armed an
 * impersonation cookie pair. Currently the banner is informational only —
 * full session-swap wiring lands in Phase 7 (security/compliance).
 * The cookies and audit log entries are already in place so the swap
 * machinery has the data it needs.
 */
export async function ImpersonationBanner() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('impersonate_user_id')?.value;
  const adminId = cookieStore.get('impersonate_admin_id')?.value;
  if (!userId || !adminId) return null;

  const [target, admin] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    db.user.findUnique({ where: { id: adminId }, select: { email: true } })
  ]);
  if (!target || !admin) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-[12px] text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="container-app flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2">
          <EyeOff className="h-3.5 w-3.5" />
          You are impersonating <b>{target.name ?? target.email}</b> (signed in as {admin.email}). Auto-expires after 30 minutes.
        </span>
        <form action="/api/admin/impersonate/exit" method="post">
          <button className="rounded bg-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-300 dark:bg-amber-900/60 dark:text-amber-100 dark:hover:bg-amber-900">
            End impersonation
          </button>
        </form>
      </div>
    </div>
  );
}
