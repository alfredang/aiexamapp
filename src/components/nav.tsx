import Link from 'next/link';
import { auth } from '@/lib/auth';

export async function Nav() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>CertPrep AI</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/practice-exams" className="btn-ghost">Practice Exams</Link>
          <Link href="/vendors" className="btn-ghost">Vendors</Link>
          <Link href="/#pricing" className="btn-ghost">Pricing</Link>
          <Link href="/#faq" className="btn-ghost">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              {isAdmin && <Link href="/admin" className="btn-ghost">Admin</Link>}
              <Link href="/my-content" className="btn-outline">My Content</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Sign in</Link>
              <Link href="/signup" className="btn-primary-grad">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold">CP</span>
  );
}
