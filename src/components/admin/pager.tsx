import Link from 'next/link';
import { pageWindow } from './qs';

export function Pager({
  page,
  pages,
  buildHref
}: {
  page: number;
  pages: number;
  buildHref: (p: number) => string;
}) {
  if (pages <= 1) return null;
  const win = pageWindow(page, pages);

  function cell({ p, label, disabled, active }: { p: number; label: string; disabled?: boolean; active?: boolean }) {
    const cls = `inline-flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-[11px] ${
      active
        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
        : disabled
          ? 'cursor-not-allowed text-slate-400 dark:text-slate-600'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;
    if (disabled) return <span className={cls}>{label}</span>;
    return (
      <Link href={buildHref(p)} className={cls}>
        {label}
      </Link>
    );
  }

  return (
    <nav className="mt-3 flex flex-wrap items-center justify-end gap-0.5 text-sm">
      {cell({ p: 1, label: '«', disabled: page === 1 })}
      {cell({ p: page - 1, label: '‹', disabled: page === 1 })}
      {win.map((w, i) =>
        w === 'ellipsis' ? (
          <span key={`e${i}`} className="px-1 text-[11px] text-slate-400">…</span>
        ) : (
          cell({ p: w, label: String(w), active: w === page })
        )
      )}
      {cell({ p: page + 1, label: '›', disabled: page === pages })}
      {cell({ p: pages, label: '»', disabled: page === pages })}
    </nav>
  );
}
