import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import { runDueDeliveries } from '@/lib/scheduling/voucher-delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Worker endpoint. Trigger from an external scheduler (Coolify scheduled task,
// cron-job.org, GitHub Actions) every ~30 minutes:
//
//   curl -fsSL -H "Authorization: Bearer $WORKER_SHARED_SECRET" \
//     $APP_URL/api/cron/voucher-deliveries
//
// Auth: shared bearer secret stored in Settings (WORKER_SHARED_SECRET) or env.
async function authorize(req: Request): Promise<boolean> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const expected = (await getSetting('WORKER_SHARED_SECRET')) || process.env.WORKER_SHARED_SECRET || '';
  if (!expected) return false; // never auth-bypass when no secret configured
  // Constant-time-ish compare. Tokens are short so a length check first is fine.
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 50));
  const result = await runDueDeliveries(limit);
  return NextResponse.json(result);
}

// Allow GET for ergonomic curl from cron-runners that don't issue POST.
export async function GET(req: Request) {
  return POST(req);
}
