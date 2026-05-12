import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { BillingAddressSchema, setDefaultAddress } from '@/lib/billing-address';

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const items = await db.billingAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = BillingAddressSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad-request', issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const count = await db.billingAddress.count({ where: { userId } });
  const isDefault = data.isDefault ?? count === 0;
  const created = await db.billingAddress.create({
    data: {
      userId,
      fullName: data.fullName,
      company: data.company || null,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode,
      country: data.country,
      phone: data.phone || null,
      isDefault
    }
  });
  if (isDefault && count > 0) await setDefaultAddress(userId, created.id);
  return NextResponse.json({ item: created }, { status: 201 });
}
