import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from '@/lib/email/defaults';

export const dynamic = 'force-dynamic';

export default async function EmailTemplatesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');

  const rows = await db.emailTemplate.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin-dashboard/settings" className="text-slate-500 hover:underline">← Back to Settings</Link>
      </div>
      <h1 className="text-2xl font-bold">Email Templates</h1>
      <p className="mt-1 text-sm text-slate-500">
        Customize the emails sent for purchases, voucher delivery, and one-time codes. Templates use Handlebars syntax (e.g. <code>{'{{user.name}}'}</code>).
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {TEMPLATE_KEYS.map((key) => {
              const row = byKey.get(key);
              const def = DEFAULT_TEMPLATES[key];
              return (
                <tr key={key}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{key}</div>
                    <div className="text-xs text-slate-500">{def.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    {row ? (
                      row.enabled ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">CUSTOM</span>
                      ) : (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">DISABLED</span>
                      )
                    ) : (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">DEFAULT</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row?.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin-dashboard/settings/email-templates/${key}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
