import Link from 'next/link';
import { getCompanyInfo } from '@/lib/settings';
import { db } from '@/lib/db';
import { getFooterPages } from '@/lib/pages';

async function safeCompany() {
  try {
    return await getCompanyInfo();
  } catch {
    return { name: 'Tertiary Infotech Academy Pte Ltd', shortName: 'ExamNova', uen: '', address: '', email: '', tel: '', website: '' };
  }
}
async function safeVendors() {
  try {
    // Include any vendor with at least one non-deleted exam. We don't require
    // the exam itself to be published — a vendor may have only bundles (whose
    // underlying parent exams sometimes stay unpublished), and we still want
    // those vendors to be browsable from the footer.
    return await db.vendor.findMany({
      where: { exams: { some: { deletedAt: null } } },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true }
    });
  } catch {
    return [];
  }
}
async function safeFooterPages() {
  try {
    return await getFooterPages();
  } catch {
    return [] as Awaited<ReturnType<typeof getFooterPages>>;
  }
}

/**
 * Full public-site footer with vendor / company / legal columns. Rendered
 * on marketing surfaces (homepage, /practice-exams/*, etc.) — admin and
 * app-shell routes hide it via <FooterGate>. The compact "© 2026 …" line
 * lives in <PersistentCopyright> and is shown on every page.
 */
export async function Footer() {
  const [company, vendors, footerPages] = await Promise.all([safeCompany(), safeVendors(), safeFooterPages()]);
  const companyLinks = footerPages.filter((p) => p.footerGroup === 'company');
  const legalLinks = footerPages.filter((p) => p.footerGroup === 'legal');

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="container-app grid gap-8 py-10 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center">
            <img src="/logo-light.webp" alt="ExamNova" className="h-12 w-auto shrink-0 object-contain dark:hidden" />
            <img src="/logo-dark.webp" alt="ExamNova" className="hidden h-12 w-auto shrink-0 object-contain dark:block" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Practice smarter for your next certification.</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Our mission is to help working professionals pass their next IT certification with confidence — without resorting to brain dumps. Every question on ExamNova is an original, blueprint-aligned practice item written by domain experts, paired with a clear explanation and a citation so you learn the <em>why</em>, not just the answer.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            We bundle multiple full-length practice exams with an optional discounted real-exam voucher, so one purchase covers your full prep journey from first attempt to test day.
          </p>
          {company.address && (
            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {company.name}
              {company.uen ? ` · ${company.uen}` : ''}
              <br />
              {company.address}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold">Vendors</h4>
          {vendors.length === 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li className="text-slate-400">No vendors published yet.</li>
            </ul>
          ) : (
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
              {vendors.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/practice-exams/${v.slug}`}
                    className="hover:text-slate-900 hover:underline dark:hover:text-slate-100"
                  >
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <li className="font-medium text-slate-700 dark:text-slate-300">{company.name}</li>
            {company.address && (
              <li className="text-xs leading-relaxed">{company.address}</li>
            )}
            {company.email && (
              <li>
                Email:{' '}
                <a href={`mailto:${company.email}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                  {company.email}
                </a>
              </li>
            )}
            {company.tel && (
              <li>
                Tel:{' '}
                <a href={`tel:${company.tel.replace(/\s+/g, '')}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                  {company.tel}
                </a>
              </li>
            )}
            <li className="pt-2">
              <Link href="/practice-exams" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                Browse exams
              </Link>
            </li>
            {companyLinks.map((p) => (
              <li key={p.slug}>
                <Link href={`/p/${p.slug}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Useful Links</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {(() => {
              const wanted = ['about-us', 'privacy-policy', 'refund-policy'];
              const bySlug = new Map(legalLinks.map((p) => [p.slug, p]));
              const fallbackTitles: Record<string, string> = {
                'about-us': 'About Us',
                'privacy-policy': 'Privacy',
                'refund-policy': 'Refund Policy'
              };
              return wanted.map((slug) => {
                const p = bySlug.get(slug);
                return (
                  <li key={slug}>
                    <Link href={`/p/${slug}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                      {p?.title || fallbackTitles[slug]}
                    </Link>
                  </li>
                );
              });
            })()}
          </ul>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Original practice questions for learning and exam preparation. Not affiliated with AWS, Microsoft, Cisco, CompTIA,
            Google Cloud, or other certification owners unless explicitly stated. We do not provide real exam dumps.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Single-line copyright shown on every page (frontend + backend). The
 * full multi-column <Footer> above is gated to the public surface via
 * <FooterGate>.
 */
export async function PersistentCopyright() {
  const company = await safeCompany();
  return (
    <div className="border-t border-slate-200 bg-slate-50 py-2 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      © {new Date().getFullYear()} {company.name}. All rights reserved.
    </div>
  );
}
