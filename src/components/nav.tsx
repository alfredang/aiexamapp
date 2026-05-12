'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';

export function Nav() {
  const pathname = usePathname() || '/';
  const inBackend = pathname.startsWith('/admin') || pathname.startsWith('/my-content');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-24 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center font-semibold tracking-tight" aria-label="ExamNova home">
          <Logo />
        </Link>
        {!inBackend && (
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/practice-exams" className="btn-ghost">Practice Exams</Link>
            <Link href="/vendors" className="btn-ghost">Vendors</Link>
            <Link href="/#pricing" className="btn-ghost">Pricing</Link>
            <Link href="/#faq" className="btn-ghost">FAQ</Link>
          </nav>
        )}
        <div className="flex items-center gap-2">
          <UserMenu />
          <div className="ml-2 border-l border-slate-200 pl-3 dark:border-slate-800">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <>
      <img
        src="/logo-light.webp"
        alt="ExamNova"
        className="h-20 w-auto shrink-0 object-contain dark:hidden"
      />
      <img
        src="/logo-dark.webp"
        alt="ExamNova"
        className="hidden h-20 w-auto shrink-0 object-contain dark:block"
      />
    </>
  );
}
