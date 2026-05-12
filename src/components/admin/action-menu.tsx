'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';

/**
 * Compact "⋯" overflow menu used in dense table rows. Children render
 * inside a popover and can be plain `<button>`s or wrapped forms.
 */
export function ActionMenu({ children, label = 'More actions' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function ActionItem({
  onSelect,
  children,
  destructive,
  asChild
}: {
  onSelect?: () => void;
  children: ReactNode;
  destructive?: boolean;
  asChild?: boolean;
}) {
  const cls = `block w-full rounded px-2 py-1 text-left text-[12px] ${
    destructive
      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
  }`;
  if (asChild) {
    // Allow caller to wrap a <form> or <Link> using the same styling.
    return <div className={cls}>{children}</div>;
  }
  return (
    <button type="button" onClick={onSelect} className={cls}>
      {children}
    </button>
  );
}
