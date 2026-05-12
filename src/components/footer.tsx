import Link from 'next/link';
import { getCompanyInfo } from '@/lib/settings';
import { db } from '@/lib/db';
import { getFooterPages } from '@/lib/pages';

export async function Footer() {
  const [company, vendors, footerPages] = await Promise.all([
    getCompanyInfo(),
    db.vendor.findMany({
      where: { exams: { some: { published: true } } },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true }
    }),
    getFooterPages()
  ]);

  const companyLinks = footerPages.filter((p) => p.footerGroup === 'company');
  const legalLinks = footerPages.filter((p) => p.footerGroup === 'legal');

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="container-app py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center">
            <img src="/logo-light.webp" alt="ExamNova" className="h-12 w-auto shrink-0 object-contain dark:hidden" />
            <img src="/logo-dark.webp" alt="ExamNova" className="hidden h-12 w-auto shrink-0 object-contain dark:block" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Practice smarter for your next certification.</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Vendors</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {vendors.length === 0 ? (
              <li className="text-slate-400">No vendors published yet.</li>
            ) : (
              vendors.map((v) => (
                <li key={v.slug}>
                  <Link href={`/practice-exams/${v.slug}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                    {v.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <li><Link href="/practice-exams" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">Browse exams</Link></li>
            {companyLinks.map((p) => (
              <li key={p.slug}>
                <Link href={`/p/${p.slug}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          {legalLinks.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {legalLinks.map((p) => (
                <li key={p.slug}>
                  <Link href={`/p/${p.slug}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">{p.title}</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            This platform provides original practice questions for learning and exam preparation. It is not affiliated with AWS, Microsoft, Cisco, CompTIA, Linux Foundation, or other certification owners unless explicitly stated. We do not provide real exam dumps.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} {company.name}. All rights reserved.
      </div>
    </footer>
  );
}
