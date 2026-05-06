import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';
import { DotPattern } from '@/components/dot-pattern';
import { Search, ShieldCheck, Sparkles, BookOpen, BadgeCheck, Award } from 'lucide-react';

export default async function HomePage() {
  // Vendor exam counts only count exams visible in the public catalog
  // (i.e. published AND have at least one published question), so the
  // "X exams" label matches what users actually see when they click in.
  const vendors = await db.vendor.findMany({
    include: { _count: { select: { exams: { where: { published: true, questions: { some: { status: 'PUBLISHED' } } } } } } },
    take: 12
  });
  const popular = await db.exam.findMany({
    where: { published: true, questions: { some: { status: 'PUBLISHED' } } },
    include: { vendor: true, _count: { select: { questions: { where: { status: 'PUBLISHED' } } } } },
    take: 6,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 text-blue-200/40 md:block dark:text-blue-400/15">
          <DotPattern className="h-full w-full" />
        </div>
        <div className="container-app relative grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="badge-brand mb-4">Original AI-curated practice content</span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Practice Smarter <br />for Your <span className="gradient-text">Next Certification</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Realistic practice exams across AWS, Microsoft, Cisco, CompTIA, Google Cloud and more. Try 10 questions for free on any exam.
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
              src="/hero.png"
              alt="CertPrep AI exam-prep dashboard preview"
              className="h-auto max-h-[480px] w-full max-w-full object-contain"
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
          {vendors.map(v => (
            <Link key={v.id} href={`/practice-exams/${v.slug}`} className="card-hover flex flex-col items-center justify-center px-4 py-6 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-50 to-purple-50 text-blue-700 font-semibold dark:from-blue-950/40 dark:to-purple-950/40 dark:text-blue-300">
                {v.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-sm font-medium">{v.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{v._count.exams} exam{v._count.exams === 1 ? '' : 's'}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular exams */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="container-app py-14">
          <h2 className="mb-6 text-2xl font-semibold">Popular practice exams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popular.map(e => (
              <Link key={e.id} href={`/practice-exams/${e.vendor.slug}/${e.slug}`} className="card-hover p-5">
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
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-app py-16">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, t: 'Choose an exam', d: 'Pick from 100+ vendors and certifications.' },
            { icon: Sparkles, t: 'Try 30 questions free', d: 'Get a feel for our practice content before you buy.' },
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
              { t: 'Try 10 questions for free', d: 'Free teaser on every exam — no credit card required. Get a feel for our content before you buy.', cta: 'Browse exams' },
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
      <section id="faq" className="container-app py-16">
        <h2 className="text-center text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-200 dark:divide-slate-800">
          {[
            { q: 'Are these real exam questions?', a: 'No. We only provide original practice questions for learning. We do not offer dumps.' },
            { q: 'How does the free teaser work?', a: 'Every paid exam includes a free 10-question teaser. Registered users can retake it unlimited times.' },
            { q: 'What is the difference between Practice Mode and Exam Mode?', a: 'Practice Mode shows answers and explanations immediately after each question. Exam Mode is timed and only reveals results at the end — like the real test.' },
            { q: 'How do exam vouchers work?', a: 'When you buy the Exam Voucher tier, you get a real exam voucher (emailed after purchase) AND practice access for the same exam included at no extra charge.' }
          ].map((f, i) => (
            <details key={i} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between font-medium">{f.q}<span className="text-slate-400 transition group-open:rotate-180">▾</span></summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
