import { z } from 'zod';
import { db } from './db';

export const BillingAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).optional().nullable(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().length(2).toUpperCase(),
  phone: z.string().trim().max(40).optional().nullable(),
  isDefault: z.boolean().optional()
});

export type BillingAddressInput = z.infer<typeof BillingAddressSchema>;

export async function ensureOwnership(userId: string, addressId: string) {
  const row = await db.billingAddress.findUnique({ where: { id: addressId } });
  if (!row || row.userId !== userId) return null;
  return row;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await db.$transaction([
    db.billingAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    db.billingAddress.update({ where: { id: addressId }, data: { isDefault: true } })
  ]);
}
