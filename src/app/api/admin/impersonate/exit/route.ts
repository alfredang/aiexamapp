import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('impersonate_admin_id')?.value;
  const userId = cookieStore.get('impersonate_user_id')?.value;
  cookieStore.delete('impersonate_admin_id');
  cookieStore.delete('impersonate_user_id');
  if (adminId && userId) {
    await db.adminLog.create({
      data: { adminId, action: 'user.impersonate.end', targetType: 'User', targetId: userId, metadata: {} }
    }).catch(() => {});
  }
  const next = new URL(req.url).searchParams.get('next') || '/admin-dashboard/users';
  return NextResponse.redirect(new URL(next, req.url));
}

export async function GET(req: Request) {
  return POST(req);
}
