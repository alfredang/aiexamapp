import { getCompanyInfo } from '@/lib/settings';

export async function Footer() {
  const company = await getCompanyInfo();
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
            <li>AWS</li><li>Microsoft Azure</li><li>Google Cloud</li><li>Cisco</li><li>CompTIA</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <li><a href="/#how">How it works</a></li>
            <li><a href="/#faq">FAQ</a></li>
            <li><a href="/exams">Browse exams</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
