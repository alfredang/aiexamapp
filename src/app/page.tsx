import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';
import { DotPattern } from '@/components/dot-pattern';
import { Search, ShieldCheck, Sparkles, BookOpen, BadgeCheck, Award, ChevronDown, HelpCircle } from 'lucide-react';

// Vendor + popular-exam counts come from live DB queries; without this the
// page is statically prerendered and shows stale counts after seed updates.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { getSetting } = await import('@/lib/settings');
  const teaserSizeRaw = await getSetting('TEASER_QUESTION_COUNT');
  const TEASER_N = Math.max(1, Math.min(50, Number(teaserSizeRaw) || 20));
  // Vendor card counts include BOTH standalone published exams AND bundles
  // attributed to the vendor (via the first bundle item's exam vendor).
  // That matches what users actually see on /practice-exams/[vendor].
  const vendors = await db.vendor.findMany({
    include: { _count: { select: { exams: { where: { published: true, deletedAt: null, questions: { some: { status: 'PUBLISHED' } } } } } } },
    take: 12
  });
  const allBundlesForCounts = await db.bundle.findMany({
    where: { published: true },
    select: { id: true, items: { take: 1, select: { exam: { select: { vendor: { select: { slug: true } } } } } } }
  });
  const bundleCountByVendor = new Map<string, number>();
  for (const b of allBundlesForCounts) {
    const vs = b.items[0]?.exam.vendor.slug;
    if (vs) bundleCountByVendor.set(vs, (bundleCountByVendor.get(vs) || 0) + 1);
  }

  // Popular section mixes recent bundles + recent standalone exams (6 total)
  // since most catalog content is now sold as bundles.
  const recentExams = await db.exam.findMany({
    where: { published: true, deletedAt: null, questions: { some: { status: 'PUBLISHED' } } },
    include: { vendor: true, _count: { select: { questions: { where: { status: 'PUBLISHED' } } } } },
    take: 6,
    orderBy: { createdAt: 'desc' }
  });
  const recentBundles = await db.bundle.findMany({
    where: { published: true },
    include: { items: { include: { exam: { include: { vendor: true } } } } },
    take: 6,
    orderBy: { createdAt: 'desc' }
  });
  type PopularCard =
    | { kind: 'exam'; data: (typeof recentExams)[number] }
    | { kind: 'bundle'; data: (typeof recentBundles)[number] };
  const popular: PopularCard[] = [
    ...recentBundles.map(b => ({ kind: 'bundle' as const, data: b })),
    ...recentExams.map(e => ({ kind: 'exam' as const, data: e }))
  ].slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 text-blue-200/40 md:block dark:text-blue-400/15 md:dark:hidden">
          <DotPattern className="h-full w-full" />
        </div>
        <div className="container-app relative grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="badge-brand mb-4">Original AI-curated practice content</span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Practice Smarter <br />for Your <span className="gradient-text">Next Certification</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Realistic practice exams across AWS, Microsoft, Cisco, CompTIA, Google Cloud and more. Try {TEASER_N} questions for free on any exam.
            </p>
            <form action="/practice-exams" className="mt-8 flex max-w-lg items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-card dark:border-slate-700 dark:bg-slate-900">
              <Search className="ml-3 h-5 w-5 text-slate-400" />
              <input name="q" placeholder="Search exams (e.g. SAA-C03, AZ-900)" className="flex-1 bg-transparent px-2 py-2 text-sm outline-none dark:placeholder:text-slate-500" />
              <button className="btn-primary-grad rounded-full">Search</button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Money-back guarantee</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> AI-curated content</span>
              <span className="inline-flex items-center gap-1"><Award className="h-4 w-4" /> 100+ certifications</span>
            </div>
          </div>
          <div className="relative hidden items-center justify-center md:flex">
            <img
              src="/hero.webp"
              alt="ExamNova exam-prep dashboard preview"
              className="block h-auto max-h-[480px] w-full max-w-full object-contain dark:hidden"
            />
            <img
              src="/hero-dark.webp"
              alt="ExamNova exam-prep dashboard preview"
              className="hidden h-auto max-h-[480px] w-full max-w-full object-contain dark:block [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]"
            />
          </div>
        </div>
      </section>

      {/* Vendors */}
      <section className="container-app py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Browse by vendor</h2>
          <Link href="/vendors" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {vendors.map(v => {
            const total = v._count.exams + (bundleCountByVendor.get(v.slug) || 0);
            return (
              <Link key={v.id} href={`/practice-exams/${v.slug}`} className="card-hover flex flex-col items-center justify-center px-4 py-6 text-center">
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{total} exam{total === 1 ? '' : 's'}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular exams */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="container-app py-14">
          <h2 className="mb-6 text-2xl font-semibold">Popular Practice Exams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popular.map(card => {
              if (card.kind === 'bundle') {
                const b = card.data;
                const first = b.items[0]?.exam;
                const totalQs = b.items.reduce((s, i) => s + i.exam.questionCount, 0);
                return (
                  <Link key={`b-${b.id}`} href={first ? `/practice-exams/${first.vendor.slug}/${b.slug}` : `/bundles/${b.slug}`} className="card-hover p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs">
                      {first && <span className="badge">{first.vendor.name}</span>}
                      {first && <span className="badge">{first.code}</span>}
                      {first && <span className="badge">{first.level}</span>}
                    </div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{b.description}</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{totalQs} questions · {b.items.length} practice exams</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{b.price === 0 ? 'Free' : `from ${formatPrice(b.price)}`}</span>
                    </div>
                  </Link>
                );
              }
              const e = card.data;
              return (
                <Link key={`e-${e.id}`} href={`/practice-exams/${e.vendor.slug}/${e.slug}`} className="card-hover p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span className="badge">{e.vendor.name}</span>
                    <span className="badge">{e.code}</span>
                    <span className="badge">{e.level}</span>
                  </div>
                  <h3 className="font-semibold">{e.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{e.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{e._count.questions} questions</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">from {formatPrice(e.pricePractice)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-app py-16">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, t: 'Choose an exam', d: 'Pick from 100+ vendors and certifications.' },
            { icon: Sparkles, t: `Try ${TEASER_N} questions free`, d: 'Get a feel for our practice content before you buy.' },
            { icon: BadgeCheck, t: 'Pass with confidence', d: 'Practice + Exam modes simulate the real test.' }
          ].map((s, i) => (
            <div key={i} className="card p-6 text-center">
              <s.icon className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="container-app py-16">
          <h2 className="text-center text-2xl font-semibold">Three ways to prepare</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { t: `Try ${TEASER_N} questions for free`, d: 'Free teaser on every exam — no credit card required. Get a feel for our content before you buy.', cta: 'Browse exams' },
              { t: 'Practice Exam', d: 'Full access to the practice question bank with detailed explanations. Practice Mode and Exam Mode included.', cta: 'Browse' },
              { t: 'Exam Voucher (practice included)', d: 'A real exam voucher PLUS full practice access for the same exam — no separate practice purchase needed.', cta: 'Browse' }
            ].map((p, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-semibold">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.d}</p>
                <Link href="/practice-exams" className="btn-outline mt-4 w-full">{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="container-app py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Quick answers to common questions about how ExamNova works.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {[
              { q: 'Are these real exam questions?', a: 'No — and that\'s intentional. ExamNova provides original, hand-authored practice questions modelled on each certification\'s public exam blueprint. We do not sell or distribute real exam content ("dumps"), which would violate vendor terms and undermine the value of your certification.' },
              { q: 'How does the free teaser work?', a: `Every exam includes a free ${TEASER_N}-question teaser so you can sample the question quality and format before you buy. After signing in, you can retake the teaser as often as you like — there's no per-attempt limit.` },
              { q: 'What is the difference between Practice Mode and Exam Mode?', a: 'Practice Mode reveals the correct answer and full explanation after each question — ideal for studying and reinforcing concepts. Exam Mode is a timed simulation: no answer feedback until you submit, auto-save every 15 seconds, and auto-submit when time runs out — mirroring the real testing experience.' },
              { q: 'How do exam vouchers work?', a: 'Purchasing the Exam Voucher tier includes a real, vendor-issued voucher code (delivered by email within 3–5 business days) PLUS lifetime practice access to the same certification at no additional cost. Use the code to register for your official exam at the vendor\'s testing partner.' }
            ].map((f, i) => (
              <details key={i} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm open:border-blue-300 open:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:open:border-blue-500/60">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  <span>{f.q}</span>
                  <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-blue-600 dark:group-open:text-blue-400" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-slate-500 dark:text-slate-400">
            Still have questions? <a href="mailto:support@examnova.com" className="font-medium text-blue-600 hover:underline dark:text-blue-400">Email our support team</a> — we typically reply within one business day.
          </p>
        </div>
      </section>
    </>
  );
}
