'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Eye, ChevronDown, LogOut, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ViewAs = 'admin' | 'user';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [viewAs, setViewAs] = useState<ViewAs>('admin');
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    const stored = (typeof window !== 'undefined' && localStorage.getItem('viewAs')) as ViewAs | null;
    if (stored === 'user' || stored === 'admin') setViewAs(stored);
  }, [isAdmin]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function setView(v: ViewAs) {
    setViewAs(v);
    if (typeof window !== 'undefined') localStorage.setItem('viewAs', v);
    setOpen(false);
    router.refresh();
  }

  if (status === 'loading') {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-slate-100" />;
  }

  if (!session?.user) {
    return (
      <>
        <Link href="/login" className="btn-ghost">Sign in</Link>
        <Link href="/signup" className="btn-primary-grad">Get started</Link>
      </>
    );
  }

  const name = user.name || user.email || 'Account';
  const initials = (user.name || user.email || 'U').split(/[\s@]/).filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join('') || 'U';

  return (
    <div className="flex items-center gap-2">
      {isAdmin && viewAs === 'admin' && <Link href="/admin" className="btn-ghost">Admin</Link>}
      <Link href="/my-content" className="btn-ghost">My Content</Link>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
        >
          {isAdmin && (
            <span className="flex items-center gap-1 text-slate-600">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View As:</span>
              <span className="font-medium capitalize">{viewAs}</span>
            </span>
          )}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-semibold text-white">
            {initials}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <div className="border-b border-slate-100 px-2 pb-2">
              <div className="truncate text-sm font-semibold">{name}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                {user.role || 'USER'}
              </div>
            </div>

            {isAdmin && (
              <div className="border-b border-slate-100 py-2">
                <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-slate-500">View As</div>
                <button
                  onClick={() => setView('admin')}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 ${viewAs === 'admin' ? 'text-blue-700' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin</span>
                  {viewAs === 'admin' && <span className="text-xs">●</span>}
                </button>
                <button
                  onClick={() => setView('user')}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 ${viewAs === 'user' ? 'text-blue-700' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-2"><User className="h-4 w-4" /> User</span>
                  {viewAs === 'user' && <span className="text-xs">●</span>}
                </button>
              </div>
            )}

            <div className="py-1">
              <Link href="/my-content/settings" className="block rounded-md px-2 py-1.5 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
