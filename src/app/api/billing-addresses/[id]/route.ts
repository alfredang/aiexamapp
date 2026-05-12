import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { BillingAddressSchema, ensureOwnership, setDefaultAddress } from '@/lib/billing-address';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await ensureOwnership(userId, id);
  if (!existing) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  const parsed = BillingAddressSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad-request', issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const updated = await db.billingAddress.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.company !== undefined ? { company: data.company || null } : {}),
      ...(data.line1 !== undefined ? { line1: data.line1 } : {}),
      ...(data.line2 !== undefined ? { line2: data.line2 || null } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.state !== undefined ? { state: data.state || null } : {}),
      ...(data.postalCode !== undefined ? { postalCode: data.postalCode } : {}),
      ...(data.country !== undefined ? { country: data.country } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {})
    }
  });
  if (data.isDefault === true) await setDefaultAddress(userId, id);
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const existing = await ensureOwnership(userId, id);
  if (!existing) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  await db.billingAddress.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
