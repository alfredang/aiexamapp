import Link from 'next/link';
import { Check, ArrowRight, Mail, Sparkles } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="container-app max-w-xl py-20">
      <div className="card p-10 text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Payment successful</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Your purchase is unlocked. A confirmation email is on its way.
        </p>

        <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm dark:bg-slate-900">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-700 dark:text-slate-300">Practice + Exam modes are available immediately under My Content.</span>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-700 dark:text-slate-300">If you purchased a voucher, the code arrives by email within 3–5 business days.</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/user-dashboard" className="btn-primary-grad inline-flex items-center justify-center gap-1">
            Go to My Content <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/practice-exams" className="btn-outline inline-flex items-center justify-center">
            Browse more exams
          </Link>
        </div>
      </div>
    </div>
  );
}
