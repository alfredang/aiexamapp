import { Ranges, type Range } from '@/lib/analytics';

/**
 * Resolve a `range` URL param + optional `from`/`to` into a Range.
 * Supported shortcuts: today | 7d | 30d | 90d | mtd | ytd | custom.
 */
export function rangeFromSearchParams(sp: { range?: string; from?: string; to?: string }): { range: Range; label: string } {
  const r = (sp.range || '30d').toLowerCase();
  if (r === 'today') return { range: Ranges.today(), label: 'today' };
  if (r === '7d') return { range: Ranges.lastNDays(7), label: 'last 7 days' };
  if (r === '30d') return { range: Ranges.lastNDays(30), label: 'last 30 days' };
  if (r === '90d') return { range: Ranges.lastNDays(90), label: 'last 90 days' };
  if (r === 'mtd') return { range: Ranges.mtd(), label: 'month-to-date' };
  if (r === 'ytd') return { range: Ranges.ytd(), label: 'year-to-date' };
  if (r === 'custom') {
    const fallback = Ranges.lastNDays(30);
    const from = sp.from ? new Date(sp.from) : fallback.from;
    const toRaw = sp.to ? new Date(sp.to) : new Date();
    if (!isNaN(toRaw.getTime())) toRaw.setHours(23, 59, 59, 999);
    return {
      range: { from: isNaN(from.getTime()) ? fallback.from : from, to: toRaw },
      label: `${sp.from ?? ''} → ${sp.to ?? ''}`
    };
  }
  return { range: Ranges.lastNDays(30), label: 'last 30 days' };
}

export const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'mtd', label: 'Month-to-date' },
  { value: 'ytd', label: 'Year-to-date' },
  { value: 'custom', label: 'Custom…' }
];
