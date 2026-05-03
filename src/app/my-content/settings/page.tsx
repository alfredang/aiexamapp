import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import argon2 from 'argon2';

async function changePassword(formData: FormData) {
  'use server';
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;
  const newPassword = String(formData.get('newPassword') || '');
  if (newPassword.length < 8) return;
  await db.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(newPassword) } });
  revalidatePath('/my-content/settings');
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <>
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-4 card max-w-md p-6">
        <h2 className="font-semibold">Change password</h2>
        <form action={changePassword} className="mt-3 space-y-3">
          <input name="newPassword" type="password" minLength={8} required placeholder="New password" className="input" />
          <button className="btn-primary">Update password</button>
        </form>
      </div>
    </>
  );
}
