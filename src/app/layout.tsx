import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Nav } from '@/components/nav';
import { Footer, PersistentCopyright } from '@/components/footer';
import { FooterGate } from '@/components/footer-gate';
import { AuthProvider } from '@/components/session-provider';
import { getAllSettings } from '@/lib/settings';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await getAllSettings();
    return {
      title: s.SITE_HOME_TITLE || 'ExamNova — Practice Smarter for Your Next Certification',
      description:
        s.SITE_HOME_DESCRIPTION ||
        'Original practice questions for AWS, Microsoft, Cisco, CompTIA, Google Cloud, Anthropic and more.',
      keywords: s.SITE_HOME_KEYWORDS || undefined,
      openGraph: {
        title: s.SITE_HOME_TITLE || 'ExamNova',
        description: s.SITE_HOME_DESCRIPTION || 'Original practice questions for IT certifications.'
      }
    };
  } catch {
    return {
      title: 'ExamNova — Practice Smarter for Your Next Certification',
      description: 'Original practice questions for AWS, Microsoft, Cisco, CompTIA, Google Cloud, Anthropic and more.'
    };
  }
}

// Runs synchronously in <head> before paint to avoid a flash of the wrong
// theme. Default is dark; respects an explicit localStorage('theme') override.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;if(d)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AuthProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <FooterGate>
            <Footer />
          </FooterGate>
          <PersistentCopyright />
        </AuthProvider>
      </body>
    </html>
  );
}
