import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Tier } from '@prisma/client';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatPrice(cents: number, currency = 'USD') {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

// Per the simplified tier model: VOUCHER now includes practice access
// (it absorbs what the old BUNDLE tier did). The BUNDLE label/price
// are preserved here for legacy orders/entitlements that already exist
// in the DB, but the public catalogue no longer offers BUNDLE.
export function tierLabel(t: Tier) {
  return ({
    PRACTICE: 'Practice Exam',
    BUNDLE: 'Practice + Exam Voucher',  // legacy orders only
    VOUCHER: 'Exam Voucher (practice exams included)',
    ADMIN_GRANT: 'Admin Grant'
  } as const)[t];
}

export function priceForTier(exam: { pricePractice: number; priceBundle: number; priceVoucher: number }, tier: Tier) {
  if (tier === 'PRACTICE') return exam.pricePractice;
  if (tier === 'BUNDLE') return exam.priceBundle;
  if (tier === 'VOUCHER') return exam.priceVoucher;
  return 0;
}

// Public catalogue offers two tiers per exam: PRACTICE alone, and VOUCHER
// (which now bundles practice access in). The legacy BUNDLE tier is no
// longer surfaced — kept in the Tier enum so existing orders/entitlements
// still typecheck.
export function tiersForExam(exam: { pricePractice: number; priceBundle: number; priceVoucher: number }): { tier: Tier; price: number }[] {
  return [
    { tier: 'PRACTICE', price: exam.pricePractice },
    { tier: 'VOUCHER',  price: exam.priceVoucher }
  ];
}

export function genVoucherCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VCH-${part()}${part()}`;
}
