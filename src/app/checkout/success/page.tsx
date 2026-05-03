import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="container-app max-w-xl py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 text-3xl">✓</div>
      <h1 className="text-2xl font-bold">Payment successful</h1>
      <p className="mt-2 text-slate-600">Your purchase is unlocked. A confirmation email is on the way.</p>
      <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Go to dashboard</Link>
    </div>
  );
}
