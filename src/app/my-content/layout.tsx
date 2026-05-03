import Link from 'next/link';

export default function MyContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-app py-8">
      <div className="mb-6 flex flex-wrap gap-1 text-sm">
        {[
          ['Overview', '/my-content'],
          ['Exams', '/my-content/exams'],
          ['Attempts', '/my-content/attempts'],
          ['Vouchers', '/my-content/vouchers'],
          ['Settings', '/my-content/settings']
        ].map(([t, h]) => (
          <Link key={h} href={h as string} className="rounded-md px-3 py-1.5 hover:bg-slate-100">{t}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
