import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PostLogin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user) redirect('/login');
  if (role === 'ADMIN') redirect('/admin-dashboard');
  redirect('/user-dashboard');
}
