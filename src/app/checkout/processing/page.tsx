import { Suspense } from 'react';
import ProcessingClient from './processing-client';

export const dynamic = 'force-dynamic';

export default function ProcessingPage() {
  return (
    <div className="container-app max-w-xl py-16 text-center">
      <h1 className="text-2xl font-bold">Processing your payment…</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This page will update automatically once we receive confirmation from your payment provider.
      </p>
      <Suspense fallback={null}>
        <ProcessingClient />
      </Suspense>
    </div>
  );
}
