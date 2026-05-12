'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Hides the footer on backend / app-shell routes where it adds chrome
 * but no value (admin dashboard, exam runner, my-content, checkout flows).
 * Shows it on the public marketing + catalog surface.
 */
const HIDDEN_PREFIXES = [
  '/admin-dashboard',
  '/exam/',
  '/my-content',
  '/checkout',
  '/login',
  '/signup',
  '/verify-otp',
  '/forgot-password'
];

export function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return null;
  return <>{children}</>;
}
