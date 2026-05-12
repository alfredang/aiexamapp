import { db } from '@/lib/db';
import type { PaymentProvider } from '@prisma/client';
import crypto from 'node:crypto';

export type LogReceivedInput = {
  provider: PaymentProvider;
  eventId?: string | null;
  eventType: string;
  payload: any;
  orderId?: string | null;
};

/**
 * Persist a webhook the instant it arrives, BEFORE processing. Returns
 * the row id so subsequent `markProcessed` / `markFailed` can chain to it.
 * If a duplicate `(provider, eventId)` arrives we resolve to the existing
 * row instead of throwing — webhooks legitimately retry.
 */
export async function logWebhookReceived(input: LogReceivedInput) {
  const eventId = input.eventId || synthesizeEventId(input.provider, input.payload);
  const row = await db.paymentWebhookEvent
    .create({
      data: {
        provider: input.provider,
        eventId,
        eventType: input.eventType || 'unknown',
        payload: input.payload ?? {},
        orderId: input.orderId ?? null,
        status: 'RECEIVED'
      }
    })
    .catch(async (err: any) => {
      // Likely the unique (provider, eventId) constraint — return the existing row.
      if (err?.code === 'P2002') {
        const existing = await db.paymentWebhookEvent.findUnique({
          where: { provider_eventId: { provider: input.provider, eventId } }
        });
        if (existing) return existing;
      }
      throw err;
    });
  return row;
}

export async function markWebhookProcessed(id: string, opts?: { orderId?: string | null }) {
  return db.paymentWebhookEvent.update({
    where: { id },
    data: {
      status: 'PROCESSED',
      processedAt: new Date(),
      error: null,
      ...(opts?.orderId !== undefined ? { orderId: opts.orderId } : {})
    }
  });
}

export async function markWebhookFailed(id: string, error: string) {
  const row = await db.paymentWebhookEvent.update({
    where: { id },
    data: {
      status: 'FAILED',
      processedAt: new Date(),
      error: error.slice(0, 1000)
    }
  });
  // Notify admins so a broken webhook signature etc. doesn't get lost.
  try {
    const { notify } = await import('@/lib/admin-notifications');
    await notify({
      kind: 'webhook.failed',
      title: `${row.provider} webhook failed`,
      body: `${row.eventType} — ${error.slice(0, 200)}`,
      link: '/admin-dashboard/payments/webhooks?status=FAILED'
    });
  } catch {
    /* never break webhook processing */
  }
  return row;
}

export async function markWebhookIgnored(id: string, reason: string) {
  return db.paymentWebhookEvent.update({
    where: { id },
    data: {
      status: 'IGNORED',
      processedAt: new Date(),
      error: reason.slice(0, 500)
    }
  });
}

function synthesizeEventId(provider: PaymentProvider, payload: any): string {
  // Deterministic fallback so retries deduplicate even when the provider
  // doesn't supply an id in its webhook body.
  const h = crypto.createHash('sha256');
  h.update(`${provider}:`);
  h.update(JSON.stringify(payload ?? {}));
  return `synth-${h.digest('hex').slice(0, 24)}`;
}
