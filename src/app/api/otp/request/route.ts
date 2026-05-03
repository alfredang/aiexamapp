import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueOtp } from '@/lib/otp';

const Body = z.object({
  email: z.string().email(),
  purpose: z.enum(['LOGIN', 'REGISTER', 'RESET', 'TEASER_GATE'])
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const data = Body.parse(await req.json());
  const r = await issueOtp(data.email, data.purpose, ip);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 429 });
  return NextResponse.json({ ok: true });
}
