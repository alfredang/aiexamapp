import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createOrder } from '@/lib/paypal';

const Body = z.object({ bundleId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { bundleId } = Body.parse(await req.json());
  const bundle = await db.bundle.findUnique({ where: { id: bundleId } });
  if (!bundle || !bundle.published) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });

  const paypal = await createOrder(bundle.price, 'USD', `bundle:${bundleId}`);
  const order = await db.order.create({
    data: {
      userId,
      bundleId,
      amount: bundle.price,
      currency: 'USD',
      status: 'PENDING',
      paypalOrderId: paypal.id
    }
  });
  return NextResponse.json({ orderId: order.id, paypalOrderId: paypal.id });
}
