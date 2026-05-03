import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container-app max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you're looking for doesn't exist.</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">Go home</Link>
    </div>
  );
}
