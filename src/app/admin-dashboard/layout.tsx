import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminChrome } from '@/components/admin-chrome';
import { isAdminRole } from '@/lib/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!isAdminRole(role)) redirect('/');
  return <AdminChrome>{children}</AdminChrome>;
}
