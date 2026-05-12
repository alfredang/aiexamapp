import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import argon2 from 'argon2';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NATIONALITIES, NATIONALITY_CODES } from '@/lib/nationalities';

async function updateProfile(formData: FormData) {
  'use server';
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;
  const name = String(formData.get('name') || '').trim().slice(0, 120) || null;
  const nationalityRaw = String(formData.get('nationality') || '').trim();
  const nationality = NATIONALITY_CODES.has(nationalityRaw) ? nationalityRaw : null;
  await db.user.update({ where: { id: userId }, data: { name, nationality } });
  revalidatePath('/user-dashboard/settings');
}

async function changePassword(formData: FormData) {
  'use server';
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;
  const newPassword = String(formData.get('newPassword') || '');
  if (newPassword.length < 8) return;
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await argon2.hash(newPassword) }
  });
  revalidatePath('/user-dashboard/settings');
}

export default async function MyProfilePage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect('/login');

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, nationality: true, createdAt: true, role: true }
  });
  if (!me) redirect('/login');

  return (
    <>
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your account details and password.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Profile details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Account details</h2>
          <form action={updateProfile} className="mt-4 space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                name="name"
                defaultValue={me.name ?? ''}
                placeholder="Your full name"
                className="input"
                maxLength={120}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                value={me.email}
                disabled
                className="input cursor-not-allowed opacity-70"
              />
              <p className="mt-1 text-xs text-slate-500">
                Email is used to sign in and cannot be changed here.
              </p>
            </div>

            <div>
              <label className="label">Nationality</label>
              <select name="nationality" defaultValue={me.nationality ?? ''} className="input">
                <option value="">Select nationality…</option>
                {NATIONALITIES.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Joined {me.createdAt.toLocaleDateString()} · Role {me.role}
              </span>
              <button className="btn-primary">Save changes</button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="card h-fit p-6">
          <h2 className="text-lg font-semibold">Reset password</h2>
          <p className="mt-1 text-sm text-slate-500">Minimum 8 characters.</p>
          <form action={changePassword} className="mt-4 space-y-3">
            <input
              name="newPassword"
              type="password"
              minLength={8}
              required
              placeholder="New password"
              className="input"
              autoComplete="new-password"
            />
            <button className="btn-primary">Reset password</button>
          </form>
        </div>
      </div>
    </>
  );
}
