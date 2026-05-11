import Link from 'next/link';
import { UserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="container-app flex h-24 items-center justify-between">
        <Link href="/" className="flex items-center font-semibold tracking-tight" aria-label="ExamNova home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/practice-exams" className="btn-ghost">Practice Exams</Link>
          <Link href="/vendors" className="btn-ghost">Vendors</Link>
          <Link href="/#pricing" className="btn-ghost">Pricing</Link>
          <Link href="/#faq" className="btn-ghost">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
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
