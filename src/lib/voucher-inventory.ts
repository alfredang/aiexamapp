import { db } from '@/lib/db';
import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export type ClaimInput = {
  vendorId: string;
  examId?: string | null;
};

/**
 * Atomically claim the oldest AVAILABLE voucher for the given vendor (and
 * optionally exam). Returns the code if one was claimed, null otherwise.
 *
 * Caller wires up the linkage by passing `assignedEntitlementId` once the
 * Entitlement.voucher has been set.
 */
export async function claimNextInventoryCode(
  input: ClaimInput,
  entitlementId: string,
  dbc?: DbClient
): Promise<string | null> {
  const client = dbc ?? db;
  // Prefer exam-scoped vouchers when an examId is given; fall back to
  // vendor-wide generic codes (examId = null).
  const orClause = input.examId
    ? [{ examId: input.examId }, { examId: null }]
    : [{ examId: null }];
  const candidates = await client.voucherInventory.findMany({
    where: {
      vendorId: input.vendorId,
      status: 'AVAILABLE',
      OR: orClause
    },
    orderBy: [
      // exam-specific first (non-null sorts before null in desc), then FIFO
      { examId: 'desc' },
      { importedAt: 'asc' }
    ],
    take: 5
  });
  for (const c of candidates) {
    // Re-claim with a conditional update to avoid race conditions when two
    // admins click "Assign Voucher" simultaneously.
    const claim = await client.voucherInventory.updateMany({
      where: { id: c.id, status: 'AVAILABLE' },
      data: {
        status: 'ASSIGNED',
        assignedAt: new Date(),
        assignedEntitlementId: entitlementId
      }
    });
    if (claim.count === 1) {
      // Fire-and-forget low-stock alert when the bucket dips to 2 or fewer.
      try {
        const remaining = await inventoryCount(input);
        if (remaining <= 2) {
          const { notify } = await import('@/lib/admin-notifications');
          const exam = input.examId
            ? await client.exam.findUnique({
                where: { id: input.examId },
                select: { code: true, vendor: { select: { name: true } } }
              })
            : null;
          const scope = exam ? `${exam.vendor.name} · ${exam.code}` : 'vendor-wide';
          await notify({
            kind: 'inventory.low',
            title: `Voucher inventory low (${remaining} left)`,
            body: `Scope: ${scope}. Upload more codes before the bank runs out.`,
            link: '/admin-dashboard/vouchers/inventory'
          });
        }
      } catch {
        /* never break the claim */
      }
      return c.code;
    }
  }
  return null;
}

/**
 * Parse a CSV body where each row is a single voucher code. Accepts an
 * optional header line. Also accepts `code,expiresAt` two-column form
 * (expiresAt = ISO date or `YYYY-MM-DD`).
 */
export function parseCsvVouchers(body: string): { code: string; expiresAt: Date | null }[] {
  const out: { code: string; expiresAt: Date | null }[] = [];
  const seen = new Set<string>();
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (i === 0 && /^(code|voucher)/i.test(line)) continue; // header
    const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    const code = parts[0];
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const expRaw = parts[1] ?? '';
    let expiresAt: Date | null = null;
    if (expRaw) {
      const d = new Date(expRaw);
      if (!isNaN(d.getTime())) expiresAt = d;
    }
    out.push({ code, expiresAt });
  }
  return out;
}

/** How many AVAILABLE inventory codes remain for a (vendor, exam) pair. */
export async function inventoryCount(input: ClaimInput): Promise<number> {
  const orClause = input.examId
    ? [{ examId: input.examId }, { examId: null }]
    : [{ examId: null }];
  return db.voucherInventory.count({
    where: {
      vendorId: input.vendorId,
      status: 'AVAILABLE',
      OR: orClause
    }
  });
}
