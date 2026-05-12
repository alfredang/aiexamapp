import { NextResponse } from 'next/server';
import { getSocialLoginEnabled } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getSocialLoginEnabled();
  return NextResponse.json(status);
}
