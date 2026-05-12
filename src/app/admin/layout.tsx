import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminChrome } from '@/components/admin-chrome';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN') redirect('/');
  return <AdminChrome>{children}</AdminChrome>;
}
