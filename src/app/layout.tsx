import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/components/session-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CertPrep AI — Practice Smarter for Your Next Certification',
  description: 'Original practice questions for AWS, Microsoft, Cisco, CompTIA, Google Cloud, Anthropic and more.'
};

// Runs synchronously in <head> before paint to avoid a flash of the wrong
// theme. Reads localStorage('theme') first, falls back to OS preference.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

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
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
