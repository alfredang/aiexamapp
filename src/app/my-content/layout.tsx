import Link from 'next/link';

export default function MyContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-app py-8">
      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 pb-2 text-sm dark:border-slate-800">
        {[
          ['Overview', '/my-content'],
          ['Exams', '/my-content/exams'],
          ['Attempts', '/my-content/attempts'],
          ['Vouchers', '/my-content/vouchers'],
          ['Settings', '/my-content/settings']
        ].map(([t, h]) => (
          <Link
            key={h}
            href={h as string}
            className="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {t}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
