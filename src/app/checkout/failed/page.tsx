import Link from 'next/link';

export default function FailedPage() {
  return (
    <div className="container-app max-w-xl py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 text-3xl">!</div>
      <h1 className="text-2xl font-bold">Payment failed</h1>
      <p className="mt-2 text-slate-600">We couldn't complete your payment. No charge was made.</p>
      <Link href="/exams" className="btn-primary mt-6 inline-flex">Back to catalog</Link>
    </div>
  );
}
