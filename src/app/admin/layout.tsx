import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN') redirect('/');
  return (
    <div className="container-app py-8 grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-4 text-sm">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Admin</div>
        <nav className="flex flex-col">
          {[
            ['Overview', '/admin'],
            ['Vendors', '/admin/vendors'],
            ['Exams', '/admin/exams'],
            ['Questions', '/admin/questions'],
            ['Users', '/admin/users'],
            ['Orders', '/admin/orders']
          ].map(([t, h]) => (
            <Link key={h} href={h as string} className="rounded px-2 py-1.5 hover:bg-slate-100">{t}</Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
