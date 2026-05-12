import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  page,
  totalPages,
  basePath
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  const pages = pageList(page, totalPages);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1 text-sm" aria-label="Pagination">
      <PagerLink href={href(Math.max(1, page - 1))} disabled={page === 1} ariaLabel="Previous page">
        <ChevronLeft className="h-4 w-4" /> Prev
      </PagerLink>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[2rem] rounded-md px-2.5 py-1.5 text-center ${
              p === page
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </Link>
        )
      )}

      <PagerLink
        href={href(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        ariaLabel="Next page"
      >
        Next <ChevronRight className="h-4 w-4" />
      </PagerLink>
    </nav>
  );
}

function PagerLink({
  href,
  disabled,
  ariaLabel,
  children
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const cls =
    'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';
  if (disabled) {
    return (
      <span aria-disabled className={`${cls} pointer-events-none opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={ariaLabel} className={cls}>
      {children}
    </Link>
  );
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}
